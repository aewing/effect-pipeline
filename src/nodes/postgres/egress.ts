import { Effect, Option, Data, Array as EffectArray, Schedule, Duration } from 'effect';
import { PostgresConnection } from './config.js';
import { DataTransformer, TransformationError } from './transformers.js';

// Error types for PostgreSQL egress operations
export class PostgresEgressError extends Data.TaggedError('PostgresEgressError')<{
  readonly message: string;
  readonly cause?: unknown;
  readonly query?: string;
  readonly data?: unknown;
}> {}

// Base egress node interface
export interface PostgresEgressNode<T> {
  readonly name: string;
  readonly description: string;
  readonly execute: (data: T[]) => Effect.Effect<WriteResult, PostgresEgressError, PostgresConnection>;
}

// Write result interface
export interface WriteResult {
  readonly rowsAffected: number;
  readonly insertedIds?: unknown[];
  readonly metadata?: Record<string, unknown>;
}

// Insert configuration
export interface InsertConfig {
  readonly table: string;
  readonly columns: string[];
  readonly onConflict?: 'ignore' | 'update' | 'error';
  readonly conflictColumns?: string[];
  readonly returning?: string[];
  readonly batchSize?: number;
  readonly timeout?: number;
  readonly maxRetries?: number;
}

// Update configuration
export interface UpdateConfig {
  readonly table: string;
  readonly setColumns: string[];
  readonly whereColumns: string[];
  readonly batchSize?: number;
  readonly timeout?: number;
  readonly maxRetries?: number;
}

// Upsert configuration
export interface UpsertConfig {
  readonly table: string;
  readonly columns: string[];
  readonly conflictColumns: string[];
  readonly updateColumns?: string[];
  readonly batchSize?: number;
  readonly returning?: string[];
  readonly timeout?: number;
  readonly maxRetries?: number;
}

// Create a generic insert egress node
export const createInsertEgress = <T extends Record<string, unknown>>(
  config: InsertConfig,
  transformer?: DataTransformer<T, Record<string, unknown>>
): PostgresEgressNode<T> => ({
  name: 'postgres-insert-egress',
  description: `Insert into ${config.table}`,
  execute: (data: T[]) =>
    Effect.gen(function* () {
      if (data.length === 0) {
        return { rowsAffected: 0 };
      }

      const connection = yield* PostgresConnection;
      const { sql } = connection;
      
      // Transform data if transformer is provided
      const transformedData = transformer
        ? yield* Effect.all(
            data.map((item) =>
              transformer.transform(item).pipe(
                Effect.mapError((error) =>
                  new PostgresEgressError({
                    message: `Data transformation failed: ${error.message}`,
                    cause: error,
                    data: item,
                  })
                )
              )
            )
          )
        : data;

      const batchSize = config.batchSize || 1000;
      const batches = EffectArray.chunksOf(transformedData, batchSize);
      
      let totalRowsAffected = 0;
      const allInsertedIds: unknown[] = [];

      for (const batch of batches) {
        const result = yield* Effect.gen(function* () {
          const columns = config.columns.join(', ');
          const values = batch
            .map((_, index) => 
              `(${config.columns.map((_, colIndex) => `$${index * config.columns.length + colIndex + 1}`).join(', ')})`
            )
            .join(', ');
          
          const conflictClause = config.onConflict === 'ignore' 
            ? 'ON CONFLICT DO NOTHING'
            : config.onConflict === 'update' && config.conflictColumns
            ? `ON CONFLICT (${config.conflictColumns.join(', ')}) DO UPDATE SET ${config.columns
                .filter(col => !config.conflictColumns?.includes(col))
                .map(col => `${col} = EXCLUDED.${col}`)
                .join(', ')}`
            : '';
          
          const returningClause = config.returning 
            ? `RETURNING ${config.returning.join(', ')}`
            : '';
          
          const query = `
            INSERT INTO ${config.table} (${columns})
            VALUES ${values}
            ${conflictClause}
            ${returningClause}
          `.trim();

          const parameters = batch.flatMap(item => 
            config.columns.map(col => item[col])
          );

          return yield* Effect.tryPromise({
            try: () => sql.unsafe(query, parameters),
            catch: (error) =>
              new PostgresEgressError({
                message: `Insert operation failed: ${error}`,
                cause: error,
                query,
                data: batch,
              }),
          });
        }).pipe(
          Effect.timeout(Duration.seconds(config.timeout || 30)),
          Effect.retry(
            Schedule.exponential(Duration.seconds(1)).pipe(
              Schedule.intersect(Schedule.recurs(config.maxRetries || 3))
            )
          )
        );

        totalRowsAffected += Array.isArray(result) ? result.length : result.count || 0;
        
        if (config.returning && Array.isArray(result)) {
          allInsertedIds.push(...result);
        }
      }

      return {
        rowsAffected: totalRowsAffected,
        insertedIds: allInsertedIds.length > 0 ? allInsertedIds : undefined,
      };
    }),
});

// Create a generic update egress node
export const createUpdateEgress = <T extends Record<string, unknown>>(
  config: UpdateConfig,
  transformer?: DataTransformer<T, Record<string, unknown>>
): PostgresEgressNode<T> => ({
  name: 'postgres-update-egress',
  description: `Update ${config.table}`,
  execute: (data: T[]) =>
    Effect.gen(function* () {
      if (data.length === 0) {
        return { rowsAffected: 0 };
      }

      const connection = yield* PostgresConnection;
      const { sql } = connection;
      
      const transformedData = transformer
        ? yield* Effect.all(
            data.map((item) =>
              transformer.transform(item).pipe(
                Effect.mapError((error) =>
                  new PostgresEgressError({
                    message: `Data transformation failed: ${error.message}`,
                    cause: error,
                    data: item,
                  })
                )
              )
            )
          )
        : data;

      const batchSize = config.batchSize || 100;
      const batches = EffectArray.chunksOf(transformedData, batchSize);
      
      let totalRowsAffected = 0;

      for (const batch of batches) {
        // Process updates individually within the batch for now
        // TODO: Implement batch updates using unnest() for better performance
        const results = yield* Effect.all(
          batch.map((item) =>
            Effect.gen(function* () {
              const setClause = config.setColumns
                .map((col, index) => `${col} = $${index + 1}`)
                .join(', ');
              
              const whereClause = config.whereColumns
                .map((col, index) => `${col} = $${config.setColumns.length + index + 1}`)
                .join(' AND ');
              
              const query = `
                UPDATE ${config.table}
                SET ${setClause}
                WHERE ${whereClause}
              `.trim();

              const parameters = [
                ...config.setColumns.map(col => item[col]),
                ...config.whereColumns.map(col => item[col])
              ];

              return yield* Effect.tryPromise({
                try: () => sql.unsafe(query, parameters),
                catch: (error) =>
                  new PostgresEgressError({
                    message: `Update operation failed: ${error}`,
                    cause: error,
                    query,
                    data: item,
                  }),
              });
            }).pipe(
              Effect.timeout(Duration.seconds(config.timeout || 30)),
              Effect.retry(
                Schedule.exponential(Duration.seconds(1)).pipe(
                  Schedule.intersect(Schedule.recurs(config.maxRetries || 3))
                )
              )
            )
          )
        );

        totalRowsAffected += results.reduce((sum, result) => 
          sum + (result.count || 0), 0
        );
      }

      return { rowsAffected: totalRowsAffected };
    }),
});

// Create an upsert egress node
export const createUpsertEgress = <T extends Record<string, unknown>>(
  config: UpsertConfig,
  transformer?: DataTransformer<T, Record<string, unknown>>
): PostgresEgressNode<T> => {
  const updateColumns = config.updateColumns || 
    config.columns.filter(col => !config.conflictColumns.includes(col));
  
  return createInsertEgress(
    {
      table: config.table,
      columns: config.columns,
      onConflict: 'update',
      conflictColumns: config.conflictColumns,
      returning: config.returning,
      batchSize: config.batchSize,
      timeout: config.timeout,
      maxRetries: config.maxRetries,
    },
    transformer
  );
};

// Create a custom query egress node
export const createQueryEgress = <T>(
  queryTemplate: string,
  parameterMapper: (data: T) => unknown[],
  options?: {
    readonly batchSize?: number;
    readonly timeout?: number;
    readonly maxRetries?: number;
  }
): PostgresEgressNode<T> => ({
  name: 'postgres-query-egress',
  description: `Execute custom query: ${queryTemplate.substring(0, 50)}...`,
  execute: (data: T[]) =>
    Effect.gen(function* () {
      if (data.length === 0) {
        return { rowsAffected: 0 };
      }

      const connection = yield* PostgresConnection;
      const { sql } = connection;
      
      const batchSize = options?.batchSize || 100;
      const batches = EffectArray.chunksOf(data, batchSize);
      
      let totalRowsAffected = 0;

      for (const batch of batches) {
        const results = yield* Effect.all(
          batch.map((item) =>
            Effect.gen(function* () {
              const parameters = parameterMapper(item);
              
              return yield* Effect.tryPromise({
                try: () => sql.unsafe(queryTemplate, parameters),
                catch: (error) =>
                  new PostgresEgressError({
                    message: `Custom query failed: ${error}`,
                    cause: error,
                    query: queryTemplate,
                    data: item,
                  }),
              });
            }).pipe(
              Effect.timeout(Duration.seconds(options?.timeout || 30)),
              Effect.retry(
                Schedule.exponential(Duration.seconds(1)).pipe(
                  Schedule.intersect(Schedule.recurs(options?.maxRetries || 3))
                )
              )
            )
          )
        );

        totalRowsAffected += results.reduce((sum, result) => 
          sum + (result.count || 0), 0
        );
      }

      return { rowsAffected: totalRowsAffected };
    }),
});

// Common egress patterns
export const CommonEgressPatterns = {
  // Insert events into the events table
  insertEvents: () =>
    createInsertEgress({
      table: 'pipeline.events',
      columns: ['event_id', 'event_type', 'data', 'metadata'],
      onConflict: 'ignore',
      conflictColumns: ['event_id'],
      returning: ['id', 'event_id'],
    }),

  // Insert transformations
  insertTransformations: () =>
    createInsertEgress({
      table: 'pipeline.transformations',
      columns: ['source_event_id', 'transformation_type', 'input_data', 'output_data', 'transformation_metadata'],
      returning: ['id'],
    }),

  // Insert outputs
  insertOutputs: () =>
    createInsertEgress({
      table: 'pipeline.outputs',
      columns: ['output_id', 'source_transformation_id', 'output_type', 'data', 'destination', 'status'],
      onConflict: 'update',
      conflictColumns: ['output_id'],
      returning: ['id', 'output_id'],
    }),

  // Update output status
  updateOutputStatus: () =>
    createUpdateEgress({
      table: 'pipeline.outputs',
      setColumns: ['status', 'processed_at'],
      whereColumns: ['output_id'],
    }),

  // Upsert events (insert or update)
  upsertEvents: () =>
    createUpsertEgress({
      table: 'pipeline.events',
      columns: ['event_id', 'event_type', 'data', 'metadata'],
      conflictColumns: ['event_id'],
      updateColumns: ['data', 'metadata', 'updated_at'],
      returning: ['id', 'event_id'],
    }),

  // Archive old events (soft delete)
  archiveEvents: (daysOld: number = 30) =>
    createQueryEgress(
      `UPDATE pipeline.events SET metadata = metadata || '{"archived": true}' WHERE created_at < NOW() - INTERVAL '${daysOld} days' AND (metadata->>'archived')::boolean IS NOT TRUE`,
      () => [],
      { batchSize: 1 }
    ),

  // Clean up processed outputs
  cleanupProcessedOutputs: (daysOld: number = 7) =>
    createQueryEgress(
      `DELETE FROM pipeline.outputs WHERE status = 'processed' AND processed_at < NOW() - INTERVAL '${daysOld} days'`,
      () => [],
      { batchSize: 1 }
    ),
};

// Utility function to create a batch writer that accumulates data before writing
export const createBatchWriter = <T>(
  egress: PostgresEgressNode<T>,
  options: {
    readonly batchSize: number;
    readonly maxWaitTime: Duration.Duration;
  }
) => {
  let batch: T[] = [];
  let timeoutId: NodeJS.Timeout | null = null;
  
  const flush = (): Effect.Effect<WriteResult, PostgresEgressError, PostgresConnection> =>
    Effect.gen(function* () {
      if (batch.length === 0) {
        return { rowsAffected: 0 };
      }
      
      const dataToWrite = [...batch];
      batch = [];
      
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      return yield* egress.execute(dataToWrite);
    });
  
  const scheduleFlush = () => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      Effect.runPromise(flush().pipe(Effect.provide(PostgresConnection)));
    }, Duration.toMillis(options.maxWaitTime));
  };
  
  const write = (data: T): Effect.Effect<WriteResult | null, PostgresEgressError, PostgresConnection> =>
    Effect.gen(function* () {
      batch.push(data);
      
      if (batch.length >= options.batchSize) {
        return yield* flush();
      } else {
        scheduleFlush();
        return null;
      }
    });
  
  return { write, flush };
};
import { Effect, Option, Data, Stream, Schedule, Duration, Array as EffectArray } from 'effect';
import { PostgresConnection } from './config.js';
import { DataTransformer, TransformationError } from './transformers.js';

// Error types for PostgreSQL operations
export class PostgresIngressError extends Data.TaggedError('PostgresIngressError')<{
  readonly message: string;
  readonly cause?: unknown;
  readonly query?: string;
}> {}

// Base ingress node interface
export interface PostgresIngressNode<T> {
  readonly name: string;
  readonly description: string;
  readonly execute: () => Effect.Effect<T[], PostgresIngressError, PostgresConnection>;
}

// Query configuration
export interface QueryConfig {
  readonly sql: string;
  readonly parameters?: unknown[];
  readonly timeout?: number;
  readonly maxRetries?: number;
  readonly retrySchedule?: Schedule.Schedule<unknown, unknown, unknown>;
}

// Polling configuration
export interface PollingConfig extends QueryConfig {
  readonly interval: Duration.Duration;
  readonly batchSize?: number;
  readonly offset?: number;
}

// Create a basic query ingress node
export const createQueryIngress = <T = unknown>(
  config: QueryConfig,
  transformer?: DataTransformer<unknown, T>
): PostgresIngressNode<T> => ({
  name: 'postgres-query-ingress',
  description: `Execute query: ${config.sql.substring(0, 50)}...`,
  execute: () =>
    Effect.gen(function* () {
      const connection = yield* PostgresConnection;
      const { sql } = connection;
      
      const rows = yield* Effect.tryPromise({
        try: () => sql.unsafe(config.sql, config.parameters || []),
        catch: (error) =>
          new PostgresIngressError({
            message: `Query execution failed: ${error}`,
            cause: error,
            query: config.sql,
          }),
      }).pipe(
        Effect.timeout(Duration.seconds(config.timeout || 30)),
        Effect.retry(
          config.retrySchedule || 
          Schedule.exponential(Duration.seconds(1)).pipe(
            Schedule.intersect(Schedule.recurs(config.maxRetries || 3))
          )
        )
      );

      if (transformer) {
        return yield* Effect.all(
          rows.map((row) =>
            transformer.transform(row).pipe(
              Effect.mapError((error) =>
                new PostgresIngressError({
                  message: `Transformation failed: ${error.message}`,
                  cause: error,
                  query: config.sql,
                })
              )
            )
          )
        );
      }

      return rows as T[];
    }),
});

// Create a table scan ingress node
export const createTableScanIngress = <T = unknown>(
  tableName: string,
  options?: {
    readonly columns?: string[];
    readonly where?: string;
    readonly orderBy?: string;
    readonly limit?: number;
    readonly offset?: number;
    readonly transformer?: DataTransformer<unknown, T>;
  }
): PostgresIngressNode<T> => {
  const columns = options?.columns?.join(', ') || '*';
  const whereClause = options?.where ? `WHERE ${options.where}` : '';
  const orderClause = options?.orderBy ? `ORDER BY ${options.orderBy}` : '';
  const limitClause = options?.limit ? `LIMIT ${options.limit}` : '';
  const offsetClause = options?.offset ? `OFFSET ${options.offset}` : '';
  
  const sql = `SELECT ${columns} FROM ${tableName} ${whereClause} ${orderClause} ${limitClause} ${offsetClause}`.trim();
  
  return createQueryIngress(
    { sql },
    options?.transformer
  );
};

// Create a polling ingress node that continuously polls for new data
export const createPollingIngress = <T = unknown>(
  config: PollingConfig,
  transformer?: DataTransformer<unknown, T>
): Stream.Stream<T[], PostgresIngressError, PostgresConnection> =>
  Stream.repeatEffect(
    createQueryIngress(config, transformer).execute()
  ).pipe(
    Stream.schedule(Schedule.spaced(config.interval))
  );

// Create a change data capture (CDC) style ingress for tables with timestamps
export const createCdcIngress = <T = unknown>(
  tableName: string,
  timestampColumn: string = 'updated_at',
  options?: {
    readonly columns?: string[];
    readonly where?: string;
    readonly interval?: Duration.Duration;
    readonly batchSize?: number;
    readonly transformer?: DataTransformer<unknown, T>;
  }
): Stream.Stream<T[], PostgresIngressError, PostgresConnection> => {
  let lastTimestamp: string | null = null;
  
  const fetchChanges = Effect.gen(function* () {
    const connection = yield* PostgresConnection;
    const { sql } = connection;
    
    const columns = options?.columns?.join(', ') || '*';
    const whereClause = options?.where || '1=1';
    const timestampFilter = lastTimestamp 
      ? `AND ${timestampColumn} > '${lastTimestamp}'`
      : '';
    const limit = options?.batchSize ? `LIMIT ${options.batchSize}` : '';
    
    const query = `
      SELECT ${columns}, ${timestampColumn}
      FROM ${tableName} 
      WHERE ${whereClause} ${timestampFilter}
      ORDER BY ${timestampColumn} ASC
      ${limit}
    `.trim();
    
    const rows = yield* Effect.tryPromise({
      try: () => sql.unsafe(query),
      catch: (error) =>
        new PostgresIngressError({
          message: `CDC query failed: ${error}`,
          cause: error,
          query,
        }),
    });
    
    if (rows.length > 0) {
      // Update the last timestamp
      const lastRow = rows[rows.length - 1] as any;
      lastTimestamp = lastRow[timestampColumn];
      
      if (options?.transformer) {
        return yield* Effect.all(
          rows.map((row) =>
            options.transformer!.transform(row).pipe(
              Effect.mapError((error) =>
                new PostgresIngressError({
                  message: `CDC transformation failed: ${error.message}`,
                  cause: error,
                  query,
                })
              )
            )
          )
        );
      }
    }
    
    return rows as T[];
  });
  
  return Stream.repeatEffect(fetchChanges).pipe(
    Stream.schedule(Schedule.spaced(options?.interval || Duration.seconds(10))),
    Stream.filter((batch) => batch.length > 0)
  );
};

// Create an event-based ingress that listens to PostgreSQL notifications
export const createNotificationIngress = <T = unknown>(
  channel: string,
  transformer?: DataTransformer<string, T>
): Stream.Stream<T, PostgresIngressError, PostgresConnection> =>
  Stream.async<T, PostgresIngressError>((emit) => {
    Effect.gen(function* () {
      const connection = yield* PostgresConnection;
      const { sql } = connection;
      
      // Listen to the channel
      yield* Effect.tryPromise({
        try: () => sql`LISTEN ${sql(channel)}`,
        catch: (error) =>
          new PostgresIngressError({
            message: `Failed to listen to channel ${channel}: ${error}`,
            cause: error,
          }),
      });
      
      // Set up notification handler
      sql.listen(channel, (payload) => {
        if (transformer) {
          Effect.runPromise(
            transformer.transform(payload).pipe(
              Effect.match({
                onFailure: (error) => 
                  emit.fail(new PostgresIngressError({
                    message: `Notification transformation failed: ${error.message}`,
                    cause: error,
                  })),
                onSuccess: (result) => emit.single(result),
              })
            )
          );
        } else {
          emit.single(payload as T);
        }
      });
      
    }).pipe(
      Effect.provide(PostgresConnection),
      Effect.runCallback((exit) => {
        if (exit._tag === 'Failure') {
          emit.fail(exit.cause);
        }
      })
    );
  });

// Common ingress patterns
export const CommonIngressPatterns = {
  // Stream all events from the events table
  streamEvents: (batchSize: number = 100) =>
    createTableScanIngress('pipeline.events', {
      columns: ['event_id', 'event_type', 'data', 'metadata', 'created_at'],
      orderBy: 'created_at DESC',
      limit: batchSize,
    }),
  
  // Poll for new events since last check
  pollNewEvents: (interval: Duration.Duration = Duration.seconds(30)) =>
    createCdcIngress('pipeline.events', 'created_at', {
      columns: ['event_id', 'event_type', 'data', 'metadata', 'created_at'],
      interval,
    }),
  
  // Stream events by type
  streamEventsByType: (eventType: string, limit?: number) =>
    createTableScanIngress('pipeline.events', {
      columns: ['event_id', 'event_type', 'data', 'metadata', 'created_at'],
      where: `event_type = '${eventType}'`,
      orderBy: 'created_at DESC',
      limit,
    }),
  
  // Stream pending outputs
  streamPendingOutputs: () =>
    createTableScanIngress('pipeline.outputs', {
      where: "status = 'pending'",
      orderBy: 'created_at ASC',
    }),
  
  // Poll for transformations to process
  pollTransformations: (interval: Duration.Duration = Duration.seconds(10)) =>
    createCdcIngress('pipeline.transformations', 'created_at', {
      interval,
    }),
};

// Utility function to combine multiple ingress streams
export const combineIngress = <T>(
  streams: Stream.Stream<T[], any, any>[]
): Stream.Stream<T[], any, any> =>
  Stream.merge(...streams);

// Utility function to flatten ingress stream batches
export const flattenIngress = <T>(
  stream: Stream.Stream<T[], any, any>
): Stream.Stream<T, any, any> =>
  Stream.flatMap(stream, (batch) => Stream.fromIterable(batch));
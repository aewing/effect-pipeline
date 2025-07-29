import { Database } from "bun:sqlite";
import { NodeKind, type Node, Effect } from "../../core/node";

export interface SqliteEgressConfig {
  readonly dbPath: string;
  readonly query: string;
  readonly mode?: "readwrite" | "create";
  readonly createIfNotExists?: boolean;
}

export interface SqliteWriteResult {
  readonly changes: number;
  readonly lastInsertRowid?: number;
  readonly success: boolean;
}

/**
 * An Egress Node that terminates a pipeline by writing data to a SQLite database.
 * Uses Bun's native SQLite API for high performance database operations.
 */
export function sqliteEgress(
  name: string,
  config: SqliteEgressConfig
): Node<any, SqliteWriteResult> {
  return {
    kind: NodeKind.Egress,
    name,
    run: (input: any) => {
      return Effect.tryPromise({
        try: async () => {
          const db = new Database(config.dbPath);
          
          try {
            const stmt = db.prepare(config.query);
            
            // Handle different input types
            let result;
            if (Array.isArray(input) && input.length > 0 && Array.isArray(input[0])) {
              // Batch operation - array of parameter arrays
              result = db.transaction(() => {
                let totalChanges = 0;
                let lastId;
                for (const params of input) {
                  const res = stmt.run(...params);
                  totalChanges += res.changes;
                  lastId = res.lastInsertRowid;
                }
                return { changes: totalChanges, lastInsertRowid: lastId };
              })();
            } else if (Array.isArray(input)) {
              // Single operation with array of parameters
              result = stmt.run(...input);
            } else {
              // Single operation with single parameter or object
              result = stmt.run(input);
            }
            
            return {
              changes: result.changes,
              lastInsertRowid: result.lastInsertRowid,
              success: true
            };
          } finally {
            db.close();
          }
        },
        catch: (error) => new Error(`SQLite egress error: ${error}`)
      });
    }
  };
}

/**
 * A specialized SQLite egress node for INSERT operations.
 */
export function sqliteInsert(
  name: string,
  config: {
    readonly dbPath: string;
    readonly table: string;
    readonly columns?: string[];
    readonly mode?: "readwrite" | "create";
    readonly createIfNotExists?: boolean;
    readonly onConflict?: "IGNORE" | "REPLACE" | "ABORT" | "FAIL" | "ROLLBACK";
  }
): Node<Record<string, any> | Record<string, any>[], SqliteWriteResult> {
  return {
    kind: NodeKind.Egress,
    name,
    run: (input: Record<string, any> | Record<string, any>[]) => {
      return Effect.tryPromise({
        try: async () => {
          const db = new Database(config.dbPath);
          
          try {
            // Get the first record to determine columns if not specified
            const firstRecord = Array.isArray(input) ? input[0] : input;
            const columns = config.columns || Object.keys(firstRecord);
            const placeholders = columns.map(() => '?').join(', ');
            
            const conflictClause = config.onConflict ? ` OR ${config.onConflict}` : '';
            const query = `INSERT${conflictClause} INTO ${config.table} (${columns.join(', ')}) VALUES (${placeholders})`;
            
            const stmt = db.prepare(query);
            
            let result;
            if (Array.isArray(input)) {
              // Batch insert
              result = db.transaction(() => {
                let totalChanges = 0;
                let lastId;
                for (const record of input) {
                  const values = columns.map(col => record[col]);
                  const res = stmt.run(...values);
                  totalChanges += res.changes;
                  lastId = res.lastInsertRowid;
                }
                return { changes: totalChanges, lastInsertRowid: lastId };
              })();
            } else {
              // Single insert
              const values = columns.map(col => firstRecord[col]);
              result = stmt.run(...values);
            }
            
            return {
              changes: result.changes,
              lastInsertRowid: result.lastInsertRowid,
              success: true
            };
          } finally {
            db.close();
          }
        },
        catch: (error) => new Error(`SQLite insert error: ${error}`)
      });
    }
  };
}

/**
 * A specialized SQLite egress node for UPDATE operations.
 */
export function sqliteUpdate(
  name: string,
  config: {
    readonly dbPath: string;
    readonly table: string;
    readonly setClause: string;
    readonly whereClause: string;
    readonly mode?: "readwrite" | "create";
  }
): Node<any, SqliteWriteResult> {
  return {
    kind: NodeKind.Egress,
    name,
    run: (input: any) => {
      return Effect.tryPromise({
        try: async () => {
          const db = new Database(config.dbPath);
          
          try {
            const query = `UPDATE ${config.table} SET ${config.setClause} WHERE ${config.whereClause}`;
            const stmt = db.prepare(query);
            const result = stmt.run(...input);
            
            return {
              changes: result.changes,
              lastInsertRowid: result.lastInsertRowid,
              success: true
            };
          } finally {
            db.close();
          }
        },
        catch: (error) => new Error(`SQLite update error: ${error}`)
      });
    }
  };
}
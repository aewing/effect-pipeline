import { Database } from "bun:sqlite";
import { NodeKind, type Node, Effect } from "../../core/node";

export interface SqliteIngressConfig {
  readonly dbPath: string;
  readonly query: string;
  readonly params?: Record<string, any> | any[];
  readonly mode?: "readonly" | "readwrite" | "create";
}

export interface SqliteQueryResult {
  readonly rows: any[];
  readonly changes?: number;
  readonly lastInsertRowid?: number;
}

/**
 * An Ingress Node that starts a pipeline by reading data from a SQLite database.
 * Uses Bun's native SQLite API for high performance database operations.
 */
export function sqliteIngress(
  name: string,
  config: SqliteIngressConfig
): Node<undefined, SqliteQueryResult> {
  return {
    kind: NodeKind.Ingress,
    name,
    run: () => {
      return Effect.tryPromise({
        try: async () => {
          const db = new Database(config.dbPath);
          
          try {
            const stmt = db.prepare(config.query);
            
            // For SELECT queries, we only need the rows
            const rows = config.params 
              ? stmt.all(config.params)
              : stmt.all();
            
            return {
              rows,
              changes: 0,  // Not meaningful for SELECT queries
              lastInsertRowid: undefined  // Not meaningful for SELECT queries
            };
          } finally {
            db.close();
          }
        },
        catch: (error) => new Error(`SQLite ingress error: ${error}`)
      });
    }
  };
}

/**
 * A specialized SQLite ingress node for SELECT queries that returns just the rows.
 */
export function sqliteSelect(
  name: string,
  config: Omit<SqliteIngressConfig, 'mode'> & { mode?: "readonly" }
): Node<undefined, any[]> {
  return {
    kind: NodeKind.Ingress,
    name,
    run: () => {
      return Effect.tryPromise({
        try: async () => {
          const dbOptions: any = {};
          if (config.dbPath !== ":memory:") {
            dbOptions.readonly = true;
          }
          const db = new Database(config.dbPath, dbOptions);
          
          try {
            const stmt = db.prepare(config.query);
            return config.params 
              ? stmt.all(config.params)
              : stmt.all();
          } finally {
            db.close();
          }
        },
        catch: (error) => new Error(`SQLite select error: ${error}`)
      });
    }
  };
}
import postgres from 'postgres';
import { Config, ConfigError, Effect, Layer } from 'effect';

// PostgreSQL configuration interface
export interface PostgresConfig {
  readonly host: string;
  readonly port: number;
  readonly database: string;
  readonly username: string;
  readonly password: string;
  readonly ssl?: boolean;
  readonly max?: number;
  readonly idle_timeout?: number;
  readonly connect_timeout?: number;
}

// Default PostgreSQL configuration
export const defaultPostgresConfig: PostgresConfig = {
  host: 'localhost',
  port: 5432,
  database: 'pipeline_db',
  username: 'pipeline_user',
  password: 'pipeline_pass',
  ssl: false,
  max: 10,
  idle_timeout: 300,
  connect_timeout: 30,
};

// Configuration provider that reads from environment variables
export const PostgresConfigLive = Layer.effect(
  PostgresConfig,
  Effect.gen(function* () {
    const host = yield* Config.string('POSTGRES_HOST').pipe(
      Config.withDefault(defaultPostgresConfig.host)
    );
    const port = yield* Config.integer('POSTGRES_PORT').pipe(
      Config.withDefault(defaultPostgresConfig.port)
    );
    const database = yield* Config.string('POSTGRES_DATABASE').pipe(
      Config.withDefault(defaultPostgresConfig.database)
    );
    const username = yield* Config.string('POSTGRES_USERNAME').pipe(
      Config.withDefault(defaultPostgresConfig.username)
    );
    const password = yield* Config.string('POSTGRES_PASSWORD').pipe(
      Config.withDefault(defaultPostgresConfig.password)
    );
    const ssl = yield* Config.boolean('POSTGRES_SSL').pipe(
      Config.withDefault(defaultPostgresConfig.ssl || false)
    );
    const max = yield* Config.integer('POSTGRES_MAX_CONNECTIONS').pipe(
      Config.withDefault(defaultPostgresConfig.max || 10)
    );
    const idle_timeout = yield* Config.integer('POSTGRES_IDLE_TIMEOUT').pipe(
      Config.withDefault(defaultPostgresConfig.idle_timeout || 300)
    );
    const connect_timeout = yield* Config.integer('POSTGRES_CONNECT_TIMEOUT').pipe(
      Config.withDefault(defaultPostgresConfig.connect_timeout || 30)
    );

    return {
      host,
      port,
      database,
      username,
      password,
      ssl,
      max,
      idle_timeout,
      connect_timeout,
    } satisfies PostgresConfig;
  })
);

// Service tag for PostgresConfig
export class PostgresConfig extends Config.Tag('PostgresConfig')<
  PostgresConfig,
  PostgresConfig
>() {}

// PostgreSQL connection service
export interface PostgresConnection {
  readonly sql: postgres.Sql;
  readonly close: () => Promise<void>;
}

// PostgreSQL connection layer
export const PostgresConnectionLive = Layer.scoped(
  PostgresConnection,
  Effect.gen(function* () {
    const config = yield* PostgresConfig;
    
    const sql = postgres({
      host: config.host,
      port: config.port,
      database: config.database,
      username: config.username,
      password: config.password,
      ssl: config.ssl,
      max: config.max,
      idle_timeout: config.idle_timeout,
      connect_timeout: config.connect_timeout,
    });

    // Test the connection
    yield* Effect.tryPromise({
      try: () => sql`SELECT 1 as test`,
      catch: (error) => new ConfigError.ConfigError({
        message: `Failed to connect to PostgreSQL: ${error}`,
      }),
    });

    yield* Effect.addFinalizer(() => Effect.promise(() => sql.end()));

    return {
      sql,
      close: () => sql.end(),
    } satisfies PostgresConnection;
  })
);

// Service tag for PostgresConnection
export class PostgresConnection extends Config.Tag('PostgresConnection')<
  PostgresConnection,
  PostgresConnection
>() {}

// Helper function to create a PostgreSQL URL from config
export const createPostgresUrl = (config: PostgresConfig): string => {
  const protocol = config.ssl ? 'postgresql' : 'postgresql';
  return `${protocol}://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`;
};

// Environment variable template for .env file
export const envTemplate = `# PostgreSQL Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=pipeline_db
POSTGRES_USERNAME=pipeline_user
POSTGRES_PASSWORD=pipeline_pass
POSTGRES_SSL=false
POSTGRES_MAX_CONNECTIONS=10
POSTGRES_IDLE_TIMEOUT=300
POSTGRES_CONNECT_TIMEOUT=30`;
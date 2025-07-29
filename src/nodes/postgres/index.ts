// PostgreSQL configuration and connection
export * from './config.js';

// PostgreSQL data transformers
export * from './transformers.js';

// PostgreSQL ingress nodes (reading data)
export * from './ingress.js';

// PostgreSQL egress nodes (writing data)
export * from './egress.js';

// Re-export common patterns for convenience
export {
  // Config
  defaultPostgresConfig,
  PostgresConfigLive,
  PostgresConnectionLive,
  createPostgresUrl,
  envTemplate,
} from './config.js';

export {
  // Transformers
  JsonTransformers,
  DateTransformers,
  StringTransformers,
  NumberTransformers,
  ArrayTransformers,
  JsonbTransformers,
  UuidTransformers,
  CommonPipelines,
  createPipeline,
} from './transformers.js';

export {
  // Ingress patterns
  createQueryIngress,
  createTableScanIngress,
  createPollingIngress,
  createCdcIngress,
  createNotificationIngress,
  CommonIngressPatterns,
  combineIngress,
  flattenIngress,
} from './ingress.js';

export {
  // Egress patterns
  createInsertEgress,
  createUpdateEgress,
  createUpsertEgress,
  createQueryEgress,
  CommonEgressPatterns,
  createBatchWriter,
} from './egress.js';
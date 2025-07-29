# PostgreSQL Nodes for Effect Pipeline

This directory contains PostgreSQL nodes and utilities for the Effect Pipeline system, built using Bun's native PostgreSQL driver.

## Features

- **PostgreSQL Configuration**: Environment-based configuration with sensible defaults
- **Ingress Nodes**: Read data from PostgreSQL with various patterns (queries, table scans, polling, CDC, notifications)
- **Egress Nodes**: Write data to PostgreSQL with insert, update, upsert, and custom query operations
- **Data Transformers**: Comprehensive set of transformers for common data operations
- **Docker Support**: Ready-to-use Docker Compose setup with PostgreSQL and Adminer

## Quick Start

### 1. Start PostgreSQL with Docker

```bash
# Start PostgreSQL and Adminer
npm run postgres:up

# View logs
npm run postgres:logs

# Stop services
npm run postgres:down
```

This starts:
- PostgreSQL 16 on port 5432
- Adminer (database admin UI) on port 8080

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Adjust the PostgreSQL configuration as needed:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=pipeline_db
POSTGRES_USERNAME=pipeline_user
POSTGRES_PASSWORD=pipeline_pass
POSTGRES_SSL=false
POSTGRES_MAX_CONNECTIONS=10
POSTGRES_IDLE_TIMEOUT=300
POSTGRES_CONNECT_TIMEOUT=30
```

### 3. Run the Example

```bash
npm run postgres:example
```

## Architecture

### Configuration Layer (`config.ts`)

- `PostgresConfig`: Configuration interface with environment variable support
- `PostgresConnection`: Connection management with automatic cleanup
- Layer-based dependency injection using Effect

### Data Transformers (`transformers.ts`)

Common transformers for PostgreSQL data:

- **JSON Transformers**: Parse, stringify, extract JSON data
- **Date Transformers**: Convert timestamps, format dates
- **String Transformers**: Trim, case conversion, splitting, regex
- **Number Transformers**: Parse, round, format numbers
- **Array Transformers**: Map, filter, take, skip operations
- **JSONB Transformers**: PostgreSQL-specific JSONB operations
- **UUID Transformers**: Generate and validate UUIDs
- **Pipeline Transformers**: Chain multiple transformers

### Ingress Nodes (`ingress.ts`)

Read data from PostgreSQL:

- **Query Ingress**: Execute custom SQL queries
- **Table Scan Ingress**: Read from tables with filtering and pagination
- **Polling Ingress**: Continuously poll for new data
- **CDC Ingress**: Change Data Capture based on timestamps
- **Notification Ingress**: Listen to PostgreSQL NOTIFY events

### Egress Nodes (`egress.ts`)

Write data to PostgreSQL:

- **Insert Egress**: Insert new records with conflict handling
- **Update Egress**: Update existing records
- **Upsert Egress**: Insert or update records
- **Query Egress**: Execute custom write queries
- **Batch Writer**: Accumulate and batch write operations

## Usage Examples

### Basic Data Flow

```typescript
import { Effect } from 'effect';
import {
  PostgresConfigLive,
  PostgresConnectionLive,
  CommonIngressPatterns,
  CommonEgressPatterns,
} from './src/nodes/postgres';

const pipeline = Effect.gen(function* () {
  // Read events from database
  const ingress = CommonIngressPatterns.streamEvents(100);
  const events = yield* ingress.execute();
  
  // Process events (transform, filter, etc.)
  const processedEvents = events.map(event => ({
    ...event,
    processed_at: new Date().toISOString(),
  }));
  
  // Write processed events
  const egress = CommonEgressPatterns.insertEvents();
  const result = yield* egress.execute(processedEvents);
  
  console.log(`Processed ${result.rowsAffected} events`);
});

// Run with dependencies
const program = pipeline.pipe(
  Effect.provide(PostgresConnectionLive),
  Effect.provide(PostgresConfigLive)
);
```

### Using Data Transformers

```typescript
import { createPipeline, JsonTransformers, StringTransformers } from './src/nodes/postgres';

// Create a transformation pipeline
const transformer = createPipeline([
  JsonTransformers.extract('user.email'),
  StringTransformers.lowercase(),
  StringTransformers.trim(),
]);

// Apply transformation
const result = yield* transformer.transform({
  user: { email: '  USER@EXAMPLE.COM  ' }
});
// Result: "user@example.com"
```

### Streaming Data

```typescript
import { Stream, Duration } from 'effect';
import { CommonIngressPatterns } from './src/nodes/postgres';

// Poll for new events every 30 seconds
const eventStream = CommonIngressPatterns.pollNewEvents(Duration.seconds(30));

// Process the stream
yield* eventStream.pipe(
  Stream.tap(batch => Console.log(`Processing ${batch.length} events`)),
  Stream.flatMap(batch => Stream.fromIterable(batch)),
  Stream.take(1000), // Process first 1000 events
  Stream.runDrain
);
```

### Custom Queries

```typescript
import { createQueryIngress, createQueryEgress } from './src/nodes/postgres';

// Custom read query
const customIngress = createQueryIngress({
  sql: `
    SELECT e.*, t.transformation_type 
    FROM pipeline.events e 
    JOIN pipeline.transformations t ON e.event_id = t.source_event_id 
    WHERE e.created_at > $1
  `,
  parameters: [new Date(Date.now() - 24 * 60 * 60 * 1000)], // Last 24 hours
});

// Custom write query
const customEgress = createQueryEgress(
  'UPDATE pipeline.events SET metadata = metadata || $1 WHERE event_id = $2',
  (data: { metadata: object; eventId: string }) => [data.metadata, data.eventId]
);
```

## Database Schema

The setup includes a predefined schema with three main tables:

### `pipeline.events`
- Primary event storage
- JSONB data field for flexible event payloads
- Metadata support
- Automatic timestamps

### `pipeline.transformations`
- Track data transformations
- Links to source events
- Input/output data storage

### `pipeline.outputs`
- Store pipeline outputs
- Status tracking
- Destination information

## Performance Considerations

- **Batch Operations**: Use batch sizes appropriate for your data volume
- **Connection Pooling**: Configure max connections based on your needs
- **Indexes**: The schema includes optimized indexes for common queries
- **JSONB**: Leverages PostgreSQL's efficient JSONB operations
- **Retry Logic**: Built-in retry mechanisms for transient failures

## Monitoring

Access Adminer at http://localhost:8080 to:
- View database structure
- Execute queries
- Monitor performance
- Manage data

Default credentials:
- Server: postgres
- Username: pipeline_user
- Password: pipeline_pass
- Database: pipeline_db

## Error Handling

All operations use Effect's error handling:

```typescript
const result = yield* ingress.execute().pipe(
  Effect.catchTag('PostgresIngressError', (error) => {
    console.error('Database read failed:', error.message);
    return Effect.succeed([]); // Return empty array as fallback
  })
);
```

## Testing

Run the comprehensive example:

```bash
npm run postgres:example
```

This demonstrates:
- Basic CRUD operations
- Data transformations
- Upsert patterns
- Error handling
- Streaming operations
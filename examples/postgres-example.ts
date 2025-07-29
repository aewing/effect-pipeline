#!/usr/bin/env bun
import { Effect, Duration, Stream, Console } from 'effect';
import {
  PostgresConfigLive,
  PostgresConnectionLive,
  createTableScanIngress,
  createInsertEgress,
  CommonIngressPatterns,
  CommonEgressPatterns,
  JsonTransformers,
  DateTransformers,
  createPipeline,
  CommonPipelines,
} from '../src/nodes/postgres/index.js';

// Example data types
interface Event {
  event_id: string;
  event_type: string;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

interface ProcessedEvent {
  id: string;
  type: string;
  processedData: Record<string, unknown>;
  timestamp: string;
}

// Example 1: Basic ingress and egress
const basicExample = Effect.gen(function* () {
  console.log('=== Basic PostgreSQL Example ===');
  
  // Create an ingress to read events
  const eventIngress = CommonIngressPatterns.streamEvents(10);
  
  // Create an egress to insert events
  const eventEgress = CommonEgressPatterns.insertEvents();
  
  // Sample data to insert
  const sampleEvents: Event[] = [
    {
      event_id: crypto.randomUUID(),
      event_type: 'user_login',
      data: { userId: '123', timestamp: new Date().toISOString() },
      metadata: { source: 'web_app' },
    },
    {
      event_id: crypto.randomUUID(),
      event_type: 'order_created',
      data: { orderId: '456', amount: 99.99, currency: 'USD' },
      metadata: { source: 'mobile_app' },
    },
  ];
  
  // Insert sample events
  const insertResult = yield* eventEgress.execute(sampleEvents);
  yield* Console.log(`Inserted ${insertResult.rowsAffected} events`);
  
  // Read events back
  const events = yield* eventIngress.execute();
  yield* Console.log(`Read ${events.length} events:`, events.slice(0, 2));
});

// Example 2: Using data transformers
const transformerExample = Effect.gen(function* () {
  console.log('\n=== Data Transformer Example ===');
  
  // Create a pipeline to transform event data
  const eventTransformer = createPipeline([
    JsonTransformers.extract('data'),
    JsonTransformers.stringify(),
    CommonPipelines.cleanString(),
  ]);
  
  // Test transformation
  const sampleEvent = {
    event_id: crypto.randomUUID(),
    event_type: 'test',
    data: { message: 'Hello, World!', count: 42 },
    metadata: {},
  };
  
  const transformedData = yield* eventTransformer.transform(sampleEvent);
  yield* Console.log('Transformed data:', transformedData);
});

// Example 3: Streaming with polling
const streamingExample = Effect.gen(function* () {
  console.log('\n=== Streaming Example ===');
  
  // Create a polling stream for new events
  const eventStream = CommonIngressPatterns.pollNewEvents(Duration.seconds(5));
  
  // Process the stream (take first 3 batches)
  yield* Stream.take(eventStream, 3).pipe(
    Stream.tap((batch) => Console.log(`Received batch of ${batch.length} events`)),
    Stream.runDrain
  );
});

// Example 4: Upsert operations
const upsertExample = Effect.gen(function* () {
  console.log('\n=== Upsert Example ===');
  
  const upsertEgress = CommonEgressPatterns.upsertEvents();
  
  // Create an event that might already exist
  const duplicateEvent: Event = {
    event_id: 'fixed-id-123',
    event_type: 'duplicate_test',
    data: { version: 1, message: 'First version' },
  };
  
  // First insert
  let result = yield* upsertEgress.execute([duplicateEvent]);
  yield* Console.log(`First upsert: ${result.rowsAffected} rows affected`);
  
  // Update the same event
  duplicateEvent.data = { version: 2, message: 'Updated version' };
  result = yield* upsertEgress.execute([duplicateEvent]);
  yield* Console.log(`Second upsert: ${result.rowsAffected} rows affected`);
});

// Example 5: Complex transformation with multiple transformers
const complexTransformationExample = Effect.gen(function* () {
  console.log('\n=== Complex Transformation Example ===');
  
  // Create a complex transformation pipeline
  const complexTransformer = createPipeline([
    // Extract nested data
    JsonTransformers.extract('metadata.source'),
    // Convert to uppercase
    (input: unknown) => Effect.succeed(String(input).toUpperCase()),
    // Add prefix
    (input: string) => Effect.succeed(`SOURCE_${input}`),
  ]);
  
  const testData = {
    metadata: { source: 'mobile_app', version: '1.0' },
  };
  
  const result = yield* complexTransformer.transform(testData);
  yield* Console.log('Complex transformation result:', result);
});

// Main program that runs all examples
const main = Effect.gen(function* () {
  yield* Console.log('Starting PostgreSQL Examples...\n');
  
  try {
    yield* basicExample;
    yield* transformerExample;
    yield* upsertExample;
    yield* complexTransformationExample;
    
    // Note: Streaming example is commented out as it would run indefinitely
    // yield* streamingExample;
    
    yield* Console.log('\n✅ All examples completed successfully!');
  } catch (error) {
    yield* Console.error('❌ Example failed:', error);
  }
});

// Run the program with PostgreSQL configuration
const program = main.pipe(
  Effect.provide(PostgresConnectionLive),
  Effect.provide(PostgresConfigLive)
);

// Execute the program
Effect.runPromise(program).catch(console.error);
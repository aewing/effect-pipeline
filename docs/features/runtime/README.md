# Runtime Engine

The runtime engine executes Pipes by wiring their Nodes together with Effect fiber supervision and back-pressure handling.

## PipelineExecutor

The `PipelineExecutor` is the core runtime component that:

1. **Sequential Execution** - Runs Nodes in the order they appear in the Pipe
2. **Event Streaming** - Emits runtime events for monitoring and debugging
3. **Error Handling** - Catches and reports Node failures
4. **Effect Integration** - Uses Effect fibers for supervision and resource management

## Basic Usage

```typescript
import { PipelineExecutor } from "@effect-pipeline/runtime";
import { Queue } from "effect";

// Create an event queue for monitoring
const eventQueue = await Effect.runPromise(Queue.unbounded<RuntimeEvent>());

// Create executor with your pipeline
const executor = new PipelineExecutor(myPipeline, eventQueue);

// Run the pipeline
await Effect.runPromise(executor.run());
```

## Runtime Events

The executor emits typed events that can be consumed for monitoring:

```typescript
// Start event listener
const listener = Effect.fork(
  Effect.forever(
    Effect.gen(function* (_) {
      const event = yield* _(Queue.take(eventQueue));
      
      switch (event._tag) {
        case "PipelineStarted":
          console.log(`Pipeline ${event.pipelineName} started`);
          break;
        case "NodeStarted":
          console.log(`Node ${event.nodeName} started`);
          break;
        case "NodeCompleted":
          console.log(`Node ${event.nodeName} completed`);
          break;
        case "NodeErrored":
          console.error(`Node ${event.nodeName} failed:`, event.error);
          break;
        case "PipelineCompleted":
          console.log(`Pipeline ${event.pipelineName} completed`);
          break;
        case "PipelineErrored":
          console.error(`Pipeline ${event.pipelineName} failed:`, event.error);
          break;
      }
    })
  )
);

// Don't forget to interrupt the listener when done
await Effect.runPromise(Effect.interrupt(listener));
```

## Error Handling

When a Node throws an error, the executor:

1. Emits a `NodeErrored` event with the error details
2. Stops execution of the pipeline
3. Throws the error to the caller

```typescript
try {
  await Effect.runPromise(executor.run());
} catch (error) {
  console.error("Pipeline execution failed:", error);
}
```

## Execution Flow

The executor follows this sequence:

1. **PipelineStarted** - Pipeline execution begins
2. **NodeStarted** - Each Node starts execution
3. **Node.run()** - Node processes its input
4. **NodeCompleted** - Node finishes successfully
5. **Data Flow** - Output becomes input for next Node
6. **PipelineCompleted** - All Nodes complete successfully

If any Node fails, execution stops after emitting the error event.

## Relationships

- **Nodes** - Executes individual Nodes in sequence
- **Pipes** - Takes a Pipe as input and executes its Nodes
- **CLI** - Used by `ep run` to execute pipeline files
- **Events** - Emits RuntimeEvent for monitoring and debugging 
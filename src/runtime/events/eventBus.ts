import { Queue, Effect } from "effect";
import type { RuntimeEvent } from "../../core/event";

/**
 * Simple pub/sub event bus built on Effect Queue.
 */
export class EventBus {
  private constructor(private readonly queue: Queue.Queue<RuntimeEvent>) {}

  static make(): Effect.Effect<EventBus, never> {
    return Effect.map(Queue.unbounded<RuntimeEvent>(), (q) => new EventBus(q));
  }

  /** Publish an event to all subscribers */
  publish(event: RuntimeEvent): Effect.Effect<void, never> {
    return Queue.offer(this.queue, event);
  }

  /** Take a single event (suspends if none) */
  take(): Effect.Effect<RuntimeEvent, never> {
    return Queue.take(this.queue);
  }

  /** Access underlying queue for interop. */
  getQueue(): Queue.Queue<RuntimeEvent> {
    return this.queue;
  }
} 
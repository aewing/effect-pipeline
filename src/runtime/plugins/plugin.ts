import type { RuntimeEvent } from "../../core/event";
import { Effect } from "effect";

/**
 * A Plugin can tap into the event stream and perform side-effects such as
 * logging, metric collection, tracing, etc.
 */
export interface Plugin {
  readonly name: string;
  /**
   * Called for every {@link RuntimeEvent}. Implementations should be pure where
   * possible; long-running or blocking work should be off-loaded to their own
   * fibers.
   */
  onEvent: (event: RuntimeEvent) => Effect.Effect<void, never>;
} 
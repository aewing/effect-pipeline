import { Effect } from "effect";
import { NodeKind, type Node } from "../../core/node";

export interface BatchConfig {
  readonly size: number;
  readonly timeout?: number;
}

/**
 * A Transform Node that batches individual items into arrays.
 * Useful for processing data in chunks for efficiency.
 */
export function batch(
  name: string,
  config: BatchConfig
): Node<unknown, unknown[]> {
  let batchBuffer: unknown[] = [];
  let timeoutId: NodeJS.Timeout | null = null;

  return {
    kind: NodeKind.Transform,
    name,
    run: (input) => Effect.gen(function* () {
      batchBuffer.push(input);
      
      // If we have enough items, emit the batch
      if (batchBuffer.length >= config.size) {
        const currentBatch = [...batchBuffer];
        batchBuffer = [];
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        console.log(`Batch "${name}" emitting full batch of ${currentBatch.length} items`);
        return currentBatch;
      }
      
      // For immediate processing in Effect pipelines, return current single item as batch
      // In a real streaming implementation, this would handle partial batches differently
      console.log(`Batch "${name}" buffering item (${batchBuffer.length}/${config.size})`);
      
      // Return a single-item batch for now to keep the pipeline flowing
      return [input];
    })
  };
} 
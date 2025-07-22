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
    run: async (input) => {
      batchBuffer.push(input);
      
      // If we have enough items, emit the batch
      if (batchBuffer.length >= config.size) {
        const currentBatch = [...batchBuffer];
        batchBuffer = [];
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        return currentBatch;
      }
      
      // Set timeout for partial batches
      if (config.timeout && !timeoutId) {
        timeoutId = setTimeout(() => {
          if (batchBuffer.length > 0) {
            const currentBatch = [...batchBuffer];
            batchBuffer = [];
            timeoutId = null;
            return currentBatch;
          }
        }, config.timeout);
      }
      
      // For now, return the current item (in a real implementation, this would be more complex)
      return [input];
    }
  };
} 
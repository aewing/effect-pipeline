// Simple concurrency helpers for the Semantic API
// Makes Effect's powerful concurrency accessible through familiar Promise patterns

import type { ConcurrentOperations, ConcurrentResults } from "./types";

/**
 * Execute multiple async operations concurrently and return their results.
 * This is a simple wrapper around Promise.all() with better typing and error handling.
 * 
 * @param operations - Object where keys are result names and values are Promises
 * @returns Promise that resolves to an object with the same keys and resolved values
 * 
 * @example
 * ```typescript
 * const results = await concurrent({
 *   user: userService.getProfile(id),
 *   preferences: prefsService.getPreferences(id),
 *   permissions: permService.getPermissions(id)
 * });
 * 
 * // results.user, results.preferences, results.permissions are all available
 * ```
 */
export async function concurrent<T extends ConcurrentOperations>(
  operations: T
): Promise<ConcurrentResults<T>> {
  const keys = Object.keys(operations) as (keyof T)[];
  const promises = Object.values(operations);
  
  try {
    const results = await Promise.all(promises);
    
    // Reconstruct the object with the same keys but resolved values
    const resultObject = {} as ConcurrentResults<T>;
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]!;
      (resultObject as any)[key] = results[i];
    }
    
    return resultObject;
  } catch (error) {
    // Add context about which operation failed
    if (error instanceof Error) {
      // Try to identify which promise failed
      const settledResults = await Promise.allSettled(promises);
      const failedIndices = settledResults
        .map((result, index) => result.status === 'rejected' ? index : -1)
        .filter(index => index !== -1);
      
      if (failedIndices.length > 0) {
        const failedKeys = failedIndices.map(index => keys[index]!);
        const enhancedError = new Error(
          `Concurrent operation failed in: ${failedKeys.join(", ")}. Original error: ${error.message}`
        );
        enhancedError.stack = error.stack;
        throw enhancedError;
      }
    }
    
    throw error;
  }
}

/**
 * Execute operations concurrently with a timeout.
 * If any operation takes longer than the timeout, all operations are cancelled.
 * 
 * @param operations - Object where keys are result names and values are Promises
 * @param timeoutMs - Maximum time to wait in milliseconds
 * @returns Promise that resolves to results or rejects with timeout error
 */
export async function concurrentWithTimeout<T extends ConcurrentOperations>(
  operations: T,
  timeoutMs: number
): Promise<ConcurrentResults<T>> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Concurrent operations timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  
  return Promise.race([
    concurrent(operations),
    timeoutPromise
  ]);
}

/**
 * Execute operations concurrently but allow some to fail.
 * Returns partial results with successful operations and error information.
 * 
 * @param operations - Object where keys are result names and values are Promises
 * @returns Promise with successful results and error information
 */
export async function concurrentAllowFailures<T extends ConcurrentOperations>(
  operations: T
): Promise<{
  results: Partial<ConcurrentResults<T>>;
  errors: Record<string, Error>;
  succeeded: string[];
  failed: string[];
}> {
  const keys = Object.keys(operations) as (keyof T)[];
  const promises = Object.values(operations);
  
  const settledResults = await Promise.allSettled(promises);
  
  const results: Partial<ConcurrentResults<T>> = {};
  const errors: Record<string, Error> = {};
  const succeeded: string[] = [];
  const failed: string[] = [];
  
  for (let i = 0; i < settledResults.length; i++) {
    const key = keys[i]! as string;
    const result = settledResults[i]!;
    
    if (result.status === 'fulfilled') {
      (results as any)[key] = result.value;
      succeeded.push(key);
    } else {
      errors[key] = result.reason instanceof Error 
        ? result.reason 
        : new Error(String(result.reason));
      failed.push(key);
    }
  }
  
  return { results, errors, succeeded, failed };
} 
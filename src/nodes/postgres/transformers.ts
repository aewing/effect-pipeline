import { Effect, Option, Data, Array as EffectArray, Record } from 'effect';

// Error types for transformers
export class TransformationError extends Data.TaggedError('TransformationError')<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

// Base transformer interface
export interface DataTransformer<A, B> {
  readonly transform: (input: A) => Effect.Effect<B, TransformationError>;
  readonly name: string;
  readonly description: string;
}

// JSON transformers
export const JsonTransformers = {
  // Parse JSON string to object
  parse: <T = unknown>(): DataTransformer<string, T> => ({
    name: 'json-parse',
    description: 'Parse JSON string to object',
    transform: (input: string) =>
      Effect.try({
        try: () => JSON.parse(input) as T,
        catch: (error) =>
          new TransformationError({
            message: `Failed to parse JSON: ${error}`,
            cause: error,
          }),
      }),
  }),

  // Stringify object to JSON
  stringify: <T = unknown>(): DataTransformer<T, string> => ({
    name: 'json-stringify',
    description: 'Stringify object to JSON',
    transform: (input: T) =>
      Effect.try({
        try: () => JSON.stringify(input),
        catch: (error) =>
          new TransformationError({
            message: `Failed to stringify JSON: ${error}`,
            cause: error,
          }),
      }),
  }),

  // Extract value from JSON path
  extract: <T = unknown>(path: string): DataTransformer<Record<string, unknown>, T> => ({
    name: 'json-extract',
    description: `Extract value from JSON path: ${path}`,
    transform: (input: Record<string, unknown>) =>
      Effect.gen(function* () {
        const keys = path.split('.');
        let current: unknown = input;
        
        for (const key of keys) {
          if (typeof current === 'object' && current !== null && key in current) {
            current = (current as Record<string, unknown>)[key];
          } else {
            yield* Effect.fail(
              new TransformationError({
                message: `Path '${path}' not found in object`,
              })
            );
          }
        }
        
        return current as T;
      }),
  }),
};

// Date transformers
export const DateTransformers = {
  // Convert timestamp to Date
  fromTimestamp: (): DataTransformer<number, Date> => ({
    name: 'date-from-timestamp',
    description: 'Convert timestamp to Date',
    transform: (input: number) =>
      Effect.try({
        try: () => new Date(input),
        catch: (error) =>
          new TransformationError({
            message: `Failed to convert timestamp to date: ${error}`,
            cause: error,
          }),
      }),
  }),

  // Convert Date to timestamp
  toTimestamp: (): DataTransformer<Date, number> => ({
    name: 'date-to-timestamp',
    description: 'Convert Date to timestamp',
    transform: (input: Date) =>
      Effect.succeed(input.getTime()),
  }),

  // Format date to string
  format: (format: string = 'ISO'): DataTransformer<Date, string> => ({
    name: 'date-format',
    description: `Format date to string (${format})`,
    transform: (input: Date) =>
      Effect.try({
        try: () => {
          switch (format) {
            case 'ISO':
              return input.toISOString();
            case 'UTC':
              return input.toUTCString();
            case 'LOCAL':
              return input.toString();
            default:
              return input.toISOString();
          }
        },
        catch: (error) =>
          new TransformationError({
            message: `Failed to format date: ${error}`,
            cause: error,
          }),
      }),
  }),

  // Parse string to Date
  parse: (format?: string): DataTransformer<string, Date> => ({
    name: 'date-parse',
    description: `Parse string to Date${format ? ` (${format})` : ''}`,
    transform: (input: string) =>
      Effect.try({
        try: () => new Date(input),
        catch: (error) =>
          new TransformationError({
            message: `Failed to parse date string: ${error}`,
            cause: error,
          }),
      }),
  }),
};

// String transformers
export const StringTransformers = {
  // Trim whitespace
  trim: (): DataTransformer<string, string> => ({
    name: 'string-trim',
    description: 'Trim whitespace from string',
    transform: (input: string) => Effect.succeed(input.trim()),
  }),

  // Convert to uppercase
  uppercase: (): DataTransformer<string, string> => ({
    name: 'string-uppercase',
    description: 'Convert string to uppercase',
    transform: (input: string) => Effect.succeed(input.toUpperCase()),
  }),

  // Convert to lowercase
  lowercase: (): DataTransformer<string, string> => ({
    name: 'string-lowercase',
    description: 'Convert string to lowercase',
    transform: (input: string) => Effect.succeed(input.toLowerCase()),
  }),

  // Split string
  split: (delimiter: string): DataTransformer<string, string[]> => ({
    name: 'string-split',
    description: `Split string by delimiter: ${delimiter}`,
    transform: (input: string) => Effect.succeed(input.split(delimiter)),
  }),

  // Replace text
  replace: (search: string | RegExp, replacement: string): DataTransformer<string, string> => ({
    name: 'string-replace',
    description: `Replace text: ${search} -> ${replacement}`,
    transform: (input: string) =>
      Effect.try({
        try: () => input.replace(search, replacement),
        catch: (error) =>
          new TransformationError({
            message: `Failed to replace text: ${error}`,
            cause: error,
          }),
      }),
  }),

  // Extract using regex
  extract: (pattern: RegExp): DataTransformer<string, string[]> => ({
    name: 'string-extract',
    description: `Extract using regex: ${pattern}`,
    transform: (input: string) =>
      Effect.try({
        try: () => {
          const matches = input.match(pattern);
          return matches ? Array.from(matches) : [];
        },
        catch: (error) =>
          new TransformationError({
            message: `Failed to extract with regex: ${error}`,
            cause: error,
          }),
      }),
  }),
};

// Number transformers
export const NumberTransformers = {
  // Parse string to number
  parse: (): DataTransformer<string, number> => ({
    name: 'number-parse',
    description: 'Parse string to number',
    transform: (input: string) =>
      Effect.gen(function* () {
        const result = Number(input);
        if (isNaN(result)) {
          yield* Effect.fail(
            new TransformationError({
              message: `Failed to parse number: ${input}`,
            })
          );
        }
        return result;
      }),
  }),

  // Round number
  round: (decimals: number = 0): DataTransformer<number, number> => ({
    name: 'number-round',
    description: `Round number to ${decimals} decimals`,
    transform: (input: number) => {
      const factor = Math.pow(10, decimals);
      return Effect.succeed(Math.round(input * factor) / factor);
    },
  }),

  // Convert to string
  toString: (radix?: number): DataTransformer<number, string> => ({
    name: 'number-to-string',
    description: `Convert number to string${radix ? ` (base ${radix})` : ''}`,
    transform: (input: number) => Effect.succeed(input.toString(radix)),
  }),
};

// Array transformers
export const ArrayTransformers = {
  // Map over array
  map: <A, B>(transformer: DataTransformer<A, B>): DataTransformer<A[], B[]> => ({
    name: 'array-map',
    description: `Map array using ${transformer.name}`,
    transform: (input: A[]) =>
      Effect.all(input.map(transformer.transform)),
  }),

  // Filter array
  filter: <A>(predicate: (item: A) => boolean): DataTransformer<A[], A[]> => ({
    name: 'array-filter',
    description: 'Filter array using predicate',
    transform: (input: A[]) => Effect.succeed(input.filter(predicate)),
  }),

  // Take first N elements
  take: <A>(count: number): DataTransformer<A[], A[]> => ({
    name: 'array-take',
    description: `Take first ${count} elements`,
    transform: (input: A[]) => Effect.succeed(input.slice(0, count)),
  }),

  // Skip first N elements
  skip: <A>(count: number): DataTransformer<A[], A[]> => ({
    name: 'array-skip',
    description: `Skip first ${count} elements`,
    transform: (input: A[]) => Effect.succeed(input.slice(count)),
  }),

  // Join array to string
  join: (separator: string = ','): DataTransformer<string[], string> => ({
    name: 'array-join',
    description: `Join array with separator: ${separator}`,
    transform: (input: string[]) => Effect.succeed(input.join(separator)),
  }),
};

// JSONB specific transformers for PostgreSQL
export const JsonbTransformers = {
  // Convert object to JSONB format
  toJsonb: <T = unknown>(): DataTransformer<T, string> => ({
    name: 'jsonb-to-jsonb',
    description: 'Convert object to JSONB format',
    transform: JsonTransformers.stringify<T>().transform,
  }),

  // Parse JSONB to object
  fromJsonb: <T = unknown>(): DataTransformer<string, T> => ({
    name: 'jsonb-from-jsonb',
    description: 'Parse JSONB to object',
    transform: JsonTransformers.parse<T>().transform,
  }),

  // Merge JSONB objects
  merge: (): DataTransformer<[Record<string, unknown>, Record<string, unknown>], Record<string, unknown>> => ({
    name: 'jsonb-merge',
    description: 'Merge two JSONB objects',
    transform: ([obj1, obj2]) => Effect.succeed({ ...obj1, ...obj2 }),
  }),
};

// UUID transformers
export const UuidTransformers = {
  // Generate UUID v4
  generate: (): DataTransformer<void, string> => ({
    name: 'uuid-generate',
    description: 'Generate UUID v4',
    transform: () =>
      Effect.try({
        try: () => crypto.randomUUID(),
        catch: (error) =>
          new TransformationError({
            message: `Failed to generate UUID: ${error}`,
            cause: error,
          }),
      }),
  }),

  // Validate UUID format
  validate: (): DataTransformer<string, boolean> => ({
    name: 'uuid-validate',
    description: 'Validate UUID format',
    transform: (input: string) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return Effect.succeed(uuidRegex.test(input));
    },
  }),
};

// Composite transformer that chains multiple transformers
export const createPipeline = <A, B>(
  transformers: DataTransformer<any, any>[]
): DataTransformer<A, B> => ({
  name: 'pipeline',
  description: `Pipeline: ${transformers.map(t => t.name).join(' -> ')}`,
  transform: (input: A) =>
    transformers.reduce(
      (acc, transformer) => Effect.flatMap(acc, transformer.transform),
      Effect.succeed(input as any)
    ) as Effect.Effect<B, TransformationError>,
});

// Common transformer combinations for PostgreSQL
export const CommonPipelines = {
  // JSON string to object with validation
  parseAndValidateJson: <T = unknown>(): DataTransformer<string, T> =>
    createPipeline([
      StringTransformers.trim(),
      JsonTransformers.parse<T>(),
    ]),

  // Object to JSONB with prettification
  objectToJsonb: <T = unknown>(): DataTransformer<T, string> =>
    createPipeline([
      JsonTransformers.stringify<T>(),
    ]),

  // Clean and format string
  cleanString: (): DataTransformer<string, string> =>
    createPipeline([
      StringTransformers.trim(),
      StringTransformers.replace(/\s+/g, ' '), // Replace multiple spaces with single space
    ]),

  // Parse and format timestamp
  normalizeTimestamp: (): DataTransformer<string | number, string> => ({
    name: 'normalize-timestamp',
    description: 'Normalize timestamp to ISO string',
    transform: (input: string | number) =>
      Effect.gen(function* () {
        const date = typeof input === 'string' 
          ? yield* DateTransformers.parse().transform(input)
          : yield* DateTransformers.fromTimestamp().transform(input);
        
        return yield* DateTransformers.format('ISO').transform(date);
      }),
  }),
};
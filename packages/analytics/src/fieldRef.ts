/**
 * FieldRef — typed field reference for query builders.
 * Carries the field name along with its TypeScript type for operator type safety.
 */
export class FieldRef<T> {
  constructor(public readonly name: string) {}

  toString(): string {
    return this.name;
  }
}

/**
 * Extracts a row type from a fields object.
 * Given { id: FieldRef<string>, mode: FieldRef<string> },
 * yields { id: string, mode: string }.
 */
export type InferRow<TFields> = {
  [K in keyof TFields]: TFields[K] extends FieldRef<infer V> ? V : never;
};




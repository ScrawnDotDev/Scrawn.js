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




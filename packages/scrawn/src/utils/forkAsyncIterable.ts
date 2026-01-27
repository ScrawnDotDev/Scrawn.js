/**
 * Forks an async iterable into two independent async iterables.
 *
 * Both returned iterables will receive the same items from the source.
 * Items are buffered internally so both consumers can read at their own pace.
 *
 * @param source - The source async iterable to fork
 * @returns A tuple of two async iterables that both yield the same items
 *
 * @internal
 */
export function forkAsyncIterable<T>(
  source: AsyncIterable<T>
): [AsyncIterable<T>, AsyncIterable<T>] {
  const buffer1: T[] = [];
  const buffer2: T[] = [];

  let resolve1: (() => void) | null = null;
  let resolve2: (() => void) | null = null;

  let done = false;
  let started = false;

  // Start consuming the source and push to both buffers
  async function startConsuming() {
    if (started) return;
    started = true;

    try {
      for await (const item of source) {
        buffer1.push(item);
        buffer2.push(item);

        // Wake up any waiting consumers
        if (resolve1) {
          resolve1();
          resolve1 = null;
        }
        if (resolve2) {
          resolve2();
          resolve2 = null;
        }
      }
    } finally {
      done = true;
      // Wake up consumers so they can finish
      if (resolve1) {
        resolve1();
        resolve1 = null;
      }
      if (resolve2) {
        resolve2();
        resolve2 = null;
      }
    }
  }

  async function* createIterator(
    buffer: T[],
    setResolve: (r: (() => void) | null) => void
  ): AsyncGenerator<T> {
    // Kick off consuming (idempotent)
    startConsuming();

    while (true) {
      if (buffer.length > 0) {
        yield buffer.shift()!;
      } else if (done) {
        return;
      } else {
        // Wait for new item or done
        await new Promise<void>((resolve) => {
          setResolve(resolve);
        });
      }
    }
  }

  const iter1 = createIterator(buffer1, (r) => {
    resolve1 = r;
  });
  const iter2 = createIterator(buffer2, (r) => {
    resolve2 = r;
  });

  return [iter1, iter2];
}

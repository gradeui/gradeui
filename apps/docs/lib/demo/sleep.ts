/**
 * Cancellable sleep + type helpers for scripted demos.
 *
 * The runner threads an `AbortSignal` through every step so a `stop()`
 * call (or an unmount) can short-circuit long waits and typing loops
 * cleanly. Consumers write `await sleep(ms, signal)` inside their
 * interpret callback and the cancellation is automatic.
 *
 * Note: this throws DOMException("Aborted", "AbortError") on cancel.
 * The runner's outer try/catch swallows that specific error and exits;
 * any other rejection bubbles up so authoring bugs aren't silenced.
 */

/**
 * Promisified setTimeout that resolves after `ms` milliseconds, or
 * rejects with an AbortError if the signal fires first. Resolves
 * immediately if `ms <= 0`.
 */
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = window.setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      window.clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * Type `text` one character at a time, calling `onTick(partial)` for
 * each prefix. Stagger between ticks defaults to 22ms (the `normal`
 * speed preset's `tokenStagger`).
 *
 * `onTick` receives the cumulative typed text (not the new char), so
 * consumers can do `setBuffer(prefix + partial)` without tracking state
 * themselves. The final call fires with the complete text — there's no
 * separate "done" callback.
 */
export async function typeText(
  text: string,
  onTick: (partial: string) => void,
  stagger = 22,
  signal?: AbortSignal,
): Promise<void> {
  for (let i = 1; i <= text.length; i++) {
    onTick(text.slice(0, i));
    if (i < text.length) await sleep(stagger, signal);
  }
}

/**
 * Helper for treating an unknown error as the runner's abort sentinel.
 * Returns true if the value is the AbortError thrown by `sleep` / a
 * downstream `fetch` / etc. Used by the runner's catch block to
 * distinguish cancellation (silent exit) from real bugs (rethrow).
 */
export function isAbortError(err: unknown): boolean {
  return (
    err instanceof DOMException && err.name === "AbortError"
  );
}

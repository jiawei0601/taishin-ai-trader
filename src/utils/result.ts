export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

export const success = <T>(data: T): Result<T, never> => ({
  success: true,
  data,
});

export const failure = <E = Error>(error: E): Result<never, E> => ({
  success: false,
  error,
});

/**
 * 輔助函式：包裝非同步呼叫為 Result 模式
 */
export async function wrapResult<T>(
  promise: Promise<T>,
  context?: string
): Promise<Result<T>> {
  try {
    const data = await promise;
    return success(data);
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    if (context) {
      error.message = `[${context}] ${error.message}`;
    }
    return failure(error);
  }
}

/**
 * Abstract base class for authentication methods.
 *
 * All authentication implementations must extend this class and implement the required methods.
 * Auth methods are responsible for managing and providing credentials for API requests.
 *
 * @template TCreds - The type of credentials this auth method returns
 *
 * @example
 * ```typescript
 * type MyAuthCreds = { token: string };
 *
 * export class MyAuth extends AuthBase<MyAuthCreds> {
 *   async getCreds(): Promise<MyAuthCreds> {
 *     return { token: 'my_token' };
 *   }
 * }
 * ```
 */
export abstract class AuthBase<TCreds = unknown> {
  /**
   * Retrieve the current credentials for this authentication method.
   *
   * This method is called whenever an event needs to authenticate.
   * Credentials are cached by the SDK, so this is typically only called once.
   *
   * @returns A promise that resolves to the credentials object
   *
   * @example
   * ```typescript
   * async getCreds(): Promise<MyAuthCreds> {
   *   return { apiKey: this.apiKey };
   * }
   * ```
   */
  abstract getCreds(): Promise<TCreds>;

  /**
   * Optional hook that runs before each event is processed.
   *
   * Use this for operations that must happen before every request,
   * such as token refresh checks or rate limiting.
   *
   * @returns A promise that resolves when the pre-run hook completes
   *
   * @example
   * ```typescript
   * async preRun() {
   *   await this.refreshTokenIfNeeded();
   * }
   * ```
   */
  preRun?(): Promise<void>;

  /**
   * Optional hook that runs after each event is processed.
   *
   * Use this for cleanup operations or logging that should happen
   * after every request completes.
   *
   * @returns A promise that resolves when the post-run hook completes
   *
   * @example
   * ```typescript
   * async postRun() {
   *   await this.logRequestMetrics();
   * }
   * ```
   */
  postRun?(): Promise<void>;
}

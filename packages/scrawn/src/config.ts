/**
 * Central configuration for the Scrawn SDK.
 * All configuration values should be defined here for easy maintenance.
 */

export const ScrawnConfig = {
  /**
   * gRPC client configuration
   */
  grpc: {
    /**
     * HTTP version to use for gRPC transport.
     * HTTP/2 provides better performance with:
     * - Single persistent connection with multiplexing
     * - Header compression (HPACK)
     * - Binary framing
     * - Built-in connection keep-alive
     */
    httpVersion: "1.1" as const,

    /**
     * Enable gzip compression for request/response bodies.
     * Reduces payload size by ~60-80% with minimal CPU overhead.
     */
    useCompression: true,
  },

  /**
   * Logging configuration
   */
  logging: {
    /**
     * Enable debug logs
     */
    enableDebug: false,
  },
} as const;

export type ScrawnConfig = typeof ScrawnConfig;

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
     * Default gRPC port
     */
    defaultPort: 8069,
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

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

/**
 * Configuration for the Scrawn CLI (`scrawn tag sync`).
 * Used in the project's `scrawn.config.ts` file.
 */
export interface ScrawnCLIConfig {
  apiKey: string;
  grpcUrl: string;
  httpUrl: string;
  directory: string;
}

/**
 * Type-safe helper for defining project configuration in `scrawn.config.ts`.
 * Returns the config unchanged — purely a type-witness.
 */
export function scrawnConfig(config: ScrawnCLIConfig): ScrawnCLIConfig {
  return config;
}

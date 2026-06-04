// Cloudflare Worker entry point (default export)
export { default } from "./index.js";

// Re-export all modules for library consumers
export { DeviceRegistry } from "./device-registry.js";
export { NotificationDelivery } from "./notification-delivery.js";
export { RateLimiter } from "./rate-limiter.js";
export type {
  DeviceMetadata,
  RegisteredDevice,
  NotificationPreferences,
  RegisterDeviceRequest,
  DeviceRegistryEnv,
} from "./device-registry.js";
export type {
  NotificationType,
  NotificationPayload,
  DeliveryResult,
  BatchDeliveryResult,
  DeliveryStatus,
  DeliveryEnv,
} from "./notification-delivery.js";
export type {
  RateLimitConfig,
  RateLimitResult,
  RateLimiterEnv,
} from "./rate-limiter.js";

// Legacy exports
export { PushServer } from "./PushServer.js";
export type { PushServerConfig, PushNotification, DeliveryResult as LegacyDeliveryResult } from "./PushServer.js";

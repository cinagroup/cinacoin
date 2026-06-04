/**
 * Cinacoin Push Network SDK — Client library for web, iOS, Android.
 *
 * Usage:
 *   const push = new PushNetworkClient({ baseUrl: "https://push.cinacoin.com" });
 *   await push.registerDevice(fcmToken, address);
 *   await push.updatePreferences({ transaction_received: false });
 *   const status = await push.getDeliveryStatus(deviceId);
 */

export interface PushNetworkConfig {
  /** Push server base URL */
  baseUrl: string;
  /** API key for authenticated endpoints */
  apiKey?: string;
  /** Device ID (returned from registerDevice) */
  deviceId?: string;
  /** Address associated with the device */
  address?: string;
}

export type Platform = "ios" | "android" | "web";

export interface NotificationPreferences {
  transaction_received?: boolean;
  transaction_confirmed?: boolean;
  message_signed?: boolean;
  wallet_connected?: boolean;
  chain_switched?: boolean;
  custom?: boolean;
  doNotDisturbStart?: string;
  doNotDisturbEnd?: string;
}

export interface DeliveryStatus {
  deviceId: string;
  lastDelivery: number | null;
  totalDelivered: number;
  totalFailed: number;
}

export interface RegisterResponse {
  success: boolean;
  deviceId: string;
  message: string;
}

export interface ErrorResponse {
  error: string;
}

type ApiResponse<T> = T | ErrorResponse;

function isErrorResponse(data: unknown): data is ErrorResponse {
  return typeof data === "object" && data !== null && "error" in data;
}

/**
 * PushNetworkClient — HTTP client for the Cinacoin Push Network.
 */
export class PushNetworkClient {
  private baseUrl: string;
  private apiKey?: string;
  deviceId?: string;
  address?: string;

  constructor(config: PushNetworkConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.apiKey = config.apiKey;
    this.deviceId = config.deviceId;
    this.address = config.address;
  }

  /**
   * Set the device ID and address after registration.
   */
  setIdentity(deviceId: string, address: string): void {
    this.deviceId = deviceId;
    this.address = address;
  }

  /**
   * Build request headers with auth and identity.
   */
  private headers(contentType = "application/json"): Record<string, string> {
    const headers: Record<string, string> = { "Content-Type": contentType };
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }
    if (this.deviceId) {
      headers["X-Device-Id"] = this.deviceId;
    }
    return headers;
  }

  /**
   * Make an API request with error handling.
   */
  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const init: RequestInit = {
      method,
      headers: this.headers(),
    };

    if (body) {
      init.body = JSON.stringify(body);
    }

    const res = await fetch(url, init);
    const data = await res.json();

    if (!res.ok || isErrorResponse(data)) {
      const error = isErrorResponse(data) ? data.error : `HTTP ${res.status}`;
      throw new Error(error);
    }

    return data as T;
  }

  /**
   * Register a device for push notifications.
   *
   * @param pushToken - FCM token (Android/Web) or APNs device token (iOS)
   * @param address - Blockchain address to associate with this device
   * @param platform - Device platform (auto-detected if not provided)
   * @param metadata - Optional device metadata
   *
   * @returns RegisterResponse with deviceId
   *
   * @example
   * ```ts
   * const { deviceId } = await client.registerDevice(fcmToken, "0xabc...");
   * ```
   */
  async registerDevice(
    pushToken: string,
    address: string,
    platform?: Platform,
    metadata?: {
      appVersion?: string;
      locale?: string;
      deviceModel?: string;
    }
  ): Promise<RegisterResponse> {
    const detectedPlatform = platform ?? detectPlatform();

    const response = await this.request<ApiResponse<RegisterResponse>>(
      "POST",
      "/register",
      {
        address,
        platform: detectedPlatform,
        pushToken,
        ...metadata,
      }
    );

    if (isErrorResponse(response)) {
      throw new Error(response.error);
    }

    // Store identity for subsequent calls
    this.setIdentity(response.deviceId, address);
    return response;
  }

  /**
   * Unregister the current device.
   *
   * @returns Confirmation message
   *
   * @example
   * ```ts
   * await client.unregisterDevice();
   * ```
   */
  async unregisterDevice(): Promise<{ success: boolean; message: string }> {
    if (!this.deviceId) {
      throw new Error("No device registered. Call registerDevice first.");
    }

    const response = await this.request<ApiResponse<{ success: boolean; message: string }>>(
      "POST",
      "/unregister",
      { deviceId: this.deviceId }
    );

    if (isErrorResponse(response)) {
      throw new Error(response.error);
    }

    this.deviceId = undefined;
    return response;
  }

  /**
   * Update notification preferences for the current device.
   *
   * @param preferences - Partial preferences to update
   *
   * @example
   * ```ts
   * await client.updatePreferences({
   *   transaction_received: false,
   *   doNotDisturbStart: "22:00",
   *   doNotDisturbEnd: "07:00",
   * });
   * ```
   */
  async updatePreferences(
    preferences: Partial<NotificationPreferences>
  ): Promise<{ success: boolean; message: string }> {
    if (!this.deviceId) {
      throw new Error("No device registered. Call registerDevice first.");
    }

    const response = await this.request<ApiResponse<{ success: boolean; message: string }>>(
      "POST",
      "/preferences",
      { deviceId: this.deviceId, preferences }
    );

    if (isErrorResponse(response)) {
      throw new Error(response.error);
    }

    return response;
  }

  /**
   * Get delivery status for a device.
   *
   * @param deviceId - Device ID (defaults to current device)
   *
   * @example
   * ```ts
   * const status = await client.getDeliveryStatus();
   * console.log(status.totalDelivered, status.totalFailed);
   * ```
   */
  async getDeliveryStatus(deviceId?: string): Promise<DeliveryStatus> {
    const id = deviceId ?? this.deviceId;
    if (!id) {
      throw new Error("No deviceId provided and no device registered.");
    }

    const response = await this.request<ApiResponse<DeliveryStatus>>(
      "GET",
      `/status/${id}`
    );

    if (isErrorResponse(response)) {
      throw new Error(response.error);
    }

    return response;
  }
}

/**
 * Detect the current platform from the runtime environment.
 */
function detectPlatform(): Platform {
  // React Native
  if (
    typeof navigator !== "undefined" &&
    navigator.product === "ReactNative"
  ) {
    // Could be ios or android — default to android, caller should override
    return "android";
  }

  // iOS (Safari on iPhone/iPad)
  if (
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent)
  ) {
    return "ios";
  }

  // Android (Chrome on Android)
  if (
    typeof navigator !== "undefined" &&
    /Android/.test(navigator.userAgent)
  ) {
    return "android";
  }

  // Default: web (desktop browser)
  return "web";
}

/**
 * Default export for convenience.
 */
export { PushNetworkClient as default };

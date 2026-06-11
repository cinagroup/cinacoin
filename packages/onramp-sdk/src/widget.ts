/**
 * On-Ramp Widget Integration Component
 *
 * Provides a unified widget interface for all supported on-ramp providers.
 * Can be embedded in a web page via iframe or opened as a popup.
 */

import type { OnRampResult, OnRampWidgetParams, OnRampProviderId, OnRampQuote } from "./types.js";
import type { OnRampAggregator } from "./aggregator.js";
import type { KycStatus } from "@cinacoin/kyc";

// ============================================================
// Events emitted by the widget
// ============================================================

export type OnRampWidgetEvent =
  | { type: "open" }
  | { type: "close" }
  | { type: "success"; result: OnRampResult }
  | { type: "error"; error: string }
  | { type: "payment_initiated" }
  | { type: "payment_completed"; orderId: string }
  | { type: "kyc_started" }
  | { type: "kyc_completed" }
  | { type: "provider_selected"; provider: OnRampProviderId }
  | { type: "order_created"; orderId: string }
  | { type: "order_updated"; orderId: string; status: OrderStatus };

/**
 * Callback type for widget events.
 */
export type OnRampWidgetCallback = (event: OnRampWidgetEvent) => void;

// ============================================================
// Order Tracking Types
// ============================================================

export type OrderStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export interface OrderInfo {
  orderId: string;
  provider: OnRampProviderId;
  status: OrderStatus;
  fiatAmount: number;
  fiatCurrency: string;
  cryptoAmount: number;
  cryptoToken: string;
  createdAt: number;
  updatedAt: number;
  txHash?: string;
}

export interface KycCheckResult {
  status: KycStatus;
  provider: OnRampProviderId;
  requiresKyc: boolean;
  message?: string;
}

// ============================================================
// Widget Configuration
// ============================================================

export interface WidgetConfig {
  /** Container element ID for embedded mode */
  containerId?: string;
  /** Widget width in pixels (for embedded mode) */
  width?: number;
  /** Widget height in pixels (for embedded mode) */
  height?: number;
  /** Whether to show as popup instead of embedded */
  popup?: boolean;
  /** Popup window width */
  popupWidth?: number;
  /** Popup window height */
  popupHeight?: number;
  /** Event callback */
  onEvent?: OnRampWidgetCallback;
}

// ============================================================
// OnRampWidget
// ============================================================

export class OnRampWidget {
  private aggregator: OnRampAggregator;
  private iframe: HTMLIFrameElement | null = null;
  private popupWindow: Window | null = null;
  private config: WidgetConfig;
  private widgetUrl: string | null = null;
  private _popupMessageHandler: ((event: MessageEvent) => void) | null = null;
  private _embeddedMessageHandler: ((event: MessageEvent) => void) | null = null;
  private _orders: Map<string, OrderInfo> = new Map();
  private _selectedProvider: OnRampProviderId | null = null;
  private _kycStatus: Map<OnRampProviderId, KycCheckResult> = new Map();

  constructor(aggregator: OnRampAggregator, config?: WidgetConfig) {
    this.aggregator = aggregator;
    this.config = {
      width: 400,
      height: 600,
      popupWidth: 480,
      popupHeight: 720,
      popup: true,
      ...config,
    };
  }

  /**
   * Open the widget with the given parameters.
   */
  async open(params: OnRampWidgetParams): Promise<OnRampResult> {
    const url = this.aggregator.getWidgetUrl(params);

    if (!url) {
      const result: OnRampResult = {
        completed: false,
        error: "No on-ramp providers available",
      };
      this.emitEvent({ type: "error", error: result.error! });
      return result;
    }

    this.widgetUrl = url;

    if (this.config.popup) {
      return this.openPopup(url);
    } else {
      return this.openEmbedded(url);
    }
  }

  /**
   * Open as a popup window.
   */
  private openPopup(url: string): Promise<OnRampResult> {
    return new Promise((resolve) => {
      const left = (window.screen.width - this.config.popupWidth!) / 2;
      const top = (window.screen.height - this.config.popupHeight!) / 2;

      this.popupWindow = window.open(
        url,
        "Cinacoin OnRamp",
        `width=${this.config.popupWidth},height=${this.config.popupHeight},left=${left},top=${top},scrollbars=yes`,
      );

      this.emitEvent({ type: "open" });

      // Poll for popup close
      const checkInterval = setInterval(() => {
        if (this.popupWindow?.closed) {
          clearInterval(checkInterval);
          this.emitEvent({ type: "close" });
          resolve({ completed: false });
        }
      }, 500);

      // Listen for messages from the popup
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === "onramp_complete") {
          clearInterval(checkInterval);
          this.popupWindow?.close();
          this.emitEvent({ type: "success", result: event.data.result });
          resolve(event.data.result as OnRampResult);
        } else if (event.data?.type === "onramp_error") {
          clearInterval(checkInterval);
          this.emitEvent({ type: "error", error: event.data.error });
          resolve({ completed: false, error: event.data.error });
        }
      };

      this._popupMessageHandler = handleMessage;
      window.addEventListener("message", handleMessage);
    });
  }

  /**
   * Open as an embedded iframe.
   */
  private openEmbedded(url: string): Promise<OnRampResult> {
    return new Promise((resolve) => {
      const container = document.getElementById(this.config.containerId || "onramp-widget");
      if (!container) {
        resolve({ completed: false, error: "Widget container not found" });
        return;
      }

      this.iframe = document.createElement("iframe");
      this.iframe.src = url;
      this.iframe.style.width = `${this.config.width}px`;
      this.iframe.style.height = `${this.config.height}px`;
      this.iframe.style.border = "none";
      this.iframe.style.borderRadius = "12px";

      container.innerHTML = "";
      container.appendChild(this.iframe);

      this.emitEvent({ type: "open" });

      // Listen for messages from the iframe
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === "onramp_complete") {
          this.emitEvent({ type: "success", result: event.data.result });
          resolve(event.data.result as OnRampResult);
        } else if (event.data?.type === "onramp_error") {
          this.emitEvent({ type: "error", error: event.data.error });
          resolve({ completed: false, error: event.data.error });
        }
      };

      this._embeddedMessageHandler = handleMessage;
      window.addEventListener("message", handleMessage);
    });
  }

  /**
   * Close the widget.
   */
  close(): void {
    // Clean up message listeners to prevent memory leaks
    if (this._popupMessageHandler) {
      window.removeEventListener("message", this._popupMessageHandler);
      this._popupMessageHandler = null;
    }
    if (this._embeddedMessageHandler) {
      window.removeEventListener("message", this._embeddedMessageHandler);
      this._embeddedMessageHandler = null;
    }
    if (this.popupWindow && !this.popupWindow.closed) {
      this.popupWindow.close();
      this.popupWindow = null;
    }
    if (this.iframe) {
      this.iframe.remove();
      this.iframe = null;
    }
    // Clear stale message handlers
    this._popupMessageHandler = null;
    this._embeddedMessageHandler = null;
    this.emitEvent({ type: "close" });
  }

  /**
   * Emit an event to the callback.
   */
  private emitEvent(event: OnRampWidgetEvent): void {
    this.config.onEvent?.(event);
  }

  // ============================================================
  // Provider Selection
  // ============================================================

  /**
   * Select a specific provider for the widget.
   */
  selectProvider(provider: OnRampProviderId): void {
    this._selectedProvider = provider;
    this.emitEvent({ type: "provider_selected", provider });
  }

  /**
   * Get the currently selected provider.
   */
  getSelectedProvider(): OnRampProviderId | null {
    return this._selectedProvider;
  }

  /**
   * Get available providers for the given parameters.
   */
  getAvailableProviders(params: OnRampWidgetParams): OnRampProviderId[] {
    const providers = this.aggregator.getProviders(params.userRegion);
    return providers.map((p) => p.id as OnRampProviderId);
  }

  // ============================================================
  // KYC Status
  // ============================================================

  /**
   * Check KYC status for a provider.
   * In production, this would call a backend API.
   */
  async checkKycStatus(
    provider: OnRampProviderId,
    walletAddress: string
  ): Promise<KycCheckResult> {
    // Check cache first
    const cached = this._kycStatus.get(provider);
    if (cached) {
      return cached;
    }

    // Simulate KYC check (in production, call backend API)
    const result: KycCheckResult = {
      status: "unverified",
      provider,
      requiresKyc: true,
      message: "KYC verification required for this provider",
    };

    this._kycStatus.set(provider, result);
    return result;
  }

  /**
   * Update KYC status for a provider.
   */
  updateKycStatus(provider: OnRampProviderId, status: KycStatus): void {
    const existing = this._kycStatus.get(provider);
    if (existing) {
      existing.status = status;
      this._kycStatus.set(provider, existing);

      if (status === "verified") {
        this.emitEvent({ type: "kyc_completed" });
      }
    }
  }

  // ============================================================
  // Order Tracking
  // ============================================================

  /**
   * Create a new order.
   */
  createOrder(
    provider: OnRampProviderId,
    fiatAmount: number,
    fiatCurrency: string,
    cryptoAmount: number,
    cryptoToken: string
  ): string {
    const orderId = `order_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    const now = Date.now();

    const order: OrderInfo = {
      orderId,
      provider,
      status: "pending",
      fiatAmount,
      fiatCurrency,
      cryptoAmount,
      cryptoToken,
      createdAt: now,
      updatedAt: now,
    };

    this._orders.set(orderId, order);
    this.emitEvent({ type: "order_created", orderId });

    return orderId;
  }

  /**
   * Get order information by ID.
   */
  getOrder(orderId: string): OrderInfo | undefined {
    return this._orders.get(orderId);
  }

  /**
   * Get all orders.
   */
  getAllOrders(): OrderInfo[] {
    return Array.from(this._orders.values());
  }

  /**
   * Update order status.
   */
  updateOrderStatus(orderId: string, status: OrderStatus, txHash?: string): void {
    const order = this._orders.get(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    order.status = status;
    order.updatedAt = Date.now();
    if (txHash) {
      order.txHash = txHash;
    }

    this._orders.set(orderId, order);
    this.emitEvent({ type: "order_updated", orderId, status });

    if (status === "completed") {
      this.emitEvent({ type: "payment_completed", orderId });
    }
  }

  /**
   * Track order status (polling simulation).
   * In production, this would poll a backend API or use webhooks.
   */
  async trackOrder(
    orderId: string,
    onStatusChange?: (status: OrderStatus) => void
  ): Promise<OrderInfo> {
    const order = this._orders.get(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    // Simulate status progression
    const statusFlow: OrderStatus[] = ["pending", "processing", "completed"];
    const currentIndex = statusFlow.indexOf(order.status);

    if (currentIndex < statusFlow.length - 1) {
      const nextStatus = statusFlow[currentIndex + 1];
      this.updateOrderStatus(orderId, nextStatus);
      onStatusChange?.(nextStatus);
    }

    return this._orders.get(orderId)!;
  }
}

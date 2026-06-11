import type { NotificationType } from "./notification-delivery.js";

const VALID_TYPES: NotificationType[] = [
  "transaction_received",
  "transaction_confirmed", 
  "message_signed",
  "wallet_connected",
  "chain_switched",
  "custom"
];

export function validateNotificationType(type: string): NotificationType {
  if (VALID_TYPES.includes(type as NotificationType)) {
    return type as NotificationType;
  }
  throw new Error(`Invalid notification type: ${type}`);
}
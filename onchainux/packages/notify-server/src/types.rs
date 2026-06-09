use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NotificationType {
    BalanceAlert,
    TransactionStatus,
    PriceAlert,
    DAppNotification,
    Custom,
}

impl NotificationType {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::BalanceAlert => "balance",
            Self::TransactionStatus => "transaction",
            Self::PriceAlert => "price",
            Self::DAppNotification => "dapp",
            Self::Custom => "custom",
        }
    }
    
    pub fn from_str(s: &str) -> Self {
        match s {
            "balance" => Self::BalanceAlert,
            "transaction" => Self::TransactionStatus,
            "price" => Self::PriceAlert,
            "dapp" => Self::DAppNotification,
            _ => Self::Custom,
        }
    }
}

impl sqlx::Type<sqlx::Postgres> for NotificationType {
    fn type_info() -> sqlx::postgres::PgTypeInfo {
        sqlx::postgres::PgTypeInfo::with_name("TEXT")
    }
}

impl sqlx::postgres::PgHasArrayType for NotificationType {}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NotificationStatus {
    Pending,
    Sent,
    Failed,
    Read,
}

impl NotificationStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Pending => "pending",
            Self::Sent => "sent",
            Self::Failed => "failed",
            Self::Read => "read",
        }
    }
}

impl sqlx::Type<sqlx::Postgres> for NotificationStatus {
    fn type_info() -> sqlx::postgres::PgTypeInfo {
        sqlx::postgres::PgTypeInfo::with_name("TEXT")
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Notification {
    pub id: Uuid,
    pub user_address: String,
    pub dapp_id: String,
    pub notification_type: NotificationType,
    pub title: String,
    pub body: Option<String>,
    pub data: Option<serde_json::Value>,
    pub status: NotificationStatus,
    pub created_at: DateTime<Utc>,
    pub sent_at: Option<DateTime<Utc>>,
    pub read_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubscribeRequest {
    pub user_address: String,
    pub dapp_id: String,
    pub notification_types: Vec<NotificationType>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnsubscribeRequest {
    pub user_address: String,
    pub dapp_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotifyRequest {
    pub user_address: String,
    pub dapp_id: String,
    pub notification_type: NotificationType,
    pub title: String,
    pub body: Option<String>,
    pub data: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoryQuery {
    pub user_address: String,
    pub page: Option<i64>,
    pub per_page: Option<i64>,
    pub filter_type: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationResponse {
    pub id: Uuid,
    pub status: String,
    pub message: String,
}

use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;
use chrono::{DateTime, Utc};
use uuid::Uuid;
use crate::types::{Notification, NotificationStatus, NotificationType};

#[derive(Debug, Clone)]
pub struct Database {
    pool: PgPool,
}

impl Database {
    pub async fn new(url: &str) -> Result<Self, sqlx::Error> {
        let pool = PgPoolOptions::new()
            .max_connections(10)
            .connect(url)
            .await?;
        
        sqlx::query!(
            r#"
            CREATE TABLE IF NOT EXISTS notifications (
                id UUID PRIMARY KEY,
                user_address TEXT NOT NULL,
                dapp_id TEXT NOT NULL,
                type TEXT NOT NULL,
                title TEXT NOT NULL,
                body TEXT,
                data JSONB,
                status TEXT NOT NULL DEFAULT 'pending',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                sent_at TIMESTAMPTZ,
                read_at TIMESTAMPTZ
            )
            "#
        )
        .execute(&pool)
        .await?;
        
        sqlx::query!(
            r#"
            CREATE TABLE IF NOT EXISTS subscriptions (
                id UUID PRIMARY KEY,
                user_address TEXT NOT NULL,
                dapp_id TEXT NOT NULL,
                notification_types TEXT[] NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                active BOOLEAN NOT NULL DEFAULT true
            )
            "#
        )
        .execute(&pool)
        .await?;
        
        Ok(Self { pool })
    }
    
    pub async fn insert_notification(&self, n: &Notification) -> Result<Uuid, sqlx::Error> {
        let id = Uuid::new_v4();
        sqlx::query!(
            r#"
            INSERT INTO notifications (id, user_address, dapp_id, type, title, body, data, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
            "#,
            id,
            n.user_address,
            n.dapp_id,
            n.notification_type.as_str(),
            n.title,
            n.body,
            n.data,
        )
        .execute(&self.pool)
        .await?;
        
        Ok(id)
    }
    
    pub async fn get_history(
        &self,
        user_address: &str,
        page: i64,
        per_page: i64,
        filter_type: Option<&str>,
    ) -> Result<Vec<Notification>, sqlx::Error> {
        let offset = page * per_page;
        let rows = if let Some(t) = filter_type {
            sqlx::query_as!(
                Notification,
                r#"
                SELECT id, user_address, dapp_id, notification_type as "notification_type: NotificationType",
                       title, body, data, status as "status: NotificationStatus", created_at, sent_at, read_at
                FROM notifications
                WHERE user_address = $1 AND type = $2
                ORDER BY created_at DESC
                LIMIT $3 OFFSET $4
                "#,
                user_address,
                t,
                per_page,
                offset,
            )
            .fetch_all(&self.pool)
            .await?
        } else {
            sqlx::query_as!(
                Notification,
                r#"
                SELECT id, user_address, dapp_id, notification_type as "notification_type: NotificationType",
                       title, body, data, status as "status: NotificationStatus", created_at, sent_at, read_at
                FROM notifications
                WHERE user_address = $1
                ORDER BY created_at DESC
                LIMIT $2 OFFSET $3
                "#,
                user_address,
                per_page,
                offset,
            )
            .fetch_all(&self.pool)
            .await?
        };
        
        Ok(rows)
    }
    
    pub async fn mark_sent(&self, id: Uuid) -> Result<(), sqlx::Error> {
        sqlx::query!(
            "UPDATE notifications SET status = 'sent', sent_at = NOW() WHERE id = $1",
            id
        )
        .execute(&self.pool)
        .await?;
        Ok(())
    }
    
    pub async fn mark_read(&self, id: Uuid) -> Result<(), sqlx::Error> {
        sqlx::query!(
            "UPDATE notifications SET read_at = NOW() WHERE id = $1",
            id
        )
        .execute(&self.pool)
        .await?;
        Ok(())
    }
}

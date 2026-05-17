use redis::{Client, ConnectionAddr, ConnectionInfo};
use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Debug, Clone)]
pub struct RedisClient {
    client: Arc<Client>,
}

impl RedisClient {
    pub fn new(url: &str) -> Result<Self, redis::RedisError> {
        let client = Client::open(url)?;
        Ok(Self { client: Arc::new(client) })
    }
    
    pub async fn check_rate_limit(&self, user_address: &str, limit: u32, window_secs: u64) -> Result<bool, redis::RedisError> {
        let mut conn = self.client.get_connection()?;
        let key = format!("rate_limit:{}", user_address);
        
        let count: u32 = redis::cmd("INCR")
            .arg(&key)
            .query(&mut conn)?;
        
        if count == 1 {
            redis::cmd("EXPIRE")
                .arg(&key)
                .arg(window_secs)
                .query(&mut conn)?;
        }
        
        Ok(count <= limit)
    }
    
    pub async fn is_duplicate(&self, notification_id: &str) -> Result<bool, redis::RedisError> {
        let mut conn = self.client.get_connection()?;
        let key = format!("notification_dup:{}", notification_id);
        
        let exists: bool = redis::cmd("EXISTS")
            .arg(&key)
            .query(&mut conn)?;
        
        if !exists {
            redis::cmd("SET")
                .arg(&key)
                .arg("1")
                .arg("EX")
                .arg(300)
                .query(&mut conn)?;
        }
        
        Ok(exists)
    }
    
    pub async fn get_active_subscriptions(&self, user_address: &str) -> Result<Vec<String>, redis::RedisError> {
        let mut conn = self.client.get_connection()?;
        let key = format!("subscriptions:{}", user_address);
        
        let subs: Vec<String> = redis::cmd("SMEMBERS")
            .arg(&key)
            .query(&mut conn)?;
        
        Ok(subs)
    }
    
    pub async fn add_subscription(&self, user_address: &str, dapp_id: &str) -> Result<(), redis::RedisError> {
        let mut conn = self.client.get_connection()?;
        let key = format!("subscriptions:{}", user_address);
        
        redis::cmd("SADD")
            .arg(&key)
            .arg(dapp_id)
            .query(&mut conn)?;
        
        Ok(())
    }
    
    pub async fn remove_subscription(&self, user_address: &str, dapp_id: &str) -> Result<(), redis::RedisError> {
        let mut conn = self.client.get_connection()?;
        let key = format!("subscriptions:{}", user_address);
        
        redis::cmd("SREM")
            .arg(&key)
            .arg(dapp_id)
            .query(&mut conn)?;
        
        Ok(())
    }
}

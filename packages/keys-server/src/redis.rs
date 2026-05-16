use redis::Client;

/// Redis client wrapper.
pub struct RedisClient {
    client: Client,
}

impl RedisClient {
    /// Create a new Redis client and test the connection.
    pub async fn new(redis_url: &str) -> Result<Self, Box<dyn std::error::Error>> {
        let client = Client::open(redis_url)?;
        Ok(Self { client })
    }

    /// Ping Redis to check connectivity.
    pub async fn ping(&self) -> bool {
        match self.client.get_multiplexed_async_connection().await {
            Ok(mut conn) => {
                let result: Result<String, _> = redis::cmd("PING").query_async(&mut conn).await;
                result.is_ok()
            }
            Err(_) => false,
        }
    }

    /// Get a multiplexed async connection.
    pub async fn connection(&self) -> Result<redis::aio::MultiplexedConnection, redis::RedisError> {
        self.client.get_multiplexed_async_connection().await
    }

    /// Cache a value with TTL.
    pub async fn cache_set(&self, key: &str, value: &str, ttl_secs: u64) -> Result<(), redis::RedisError> {
        let mut conn = self.connection().await?;
        let _: () = redis::cmd("SET")
            .arg(key)
            .arg(value)
            .arg("EX")
            .arg(ttl_secs)
            .query_async(&mut conn)
            .await?;
        Ok(())
    }

    /// Get a cached value.
    pub async fn cache_get(&self, key: &str) -> Result<Option<String>, redis::RedisError> {
        let mut conn = self.connection().await?;
        let value: Option<String> = redis::cmd("GET").arg(key).query_async(&mut conn).await?;
        Ok(value)
    }

    /// Delete a cached value.
    pub async fn cache_delete(&self, key: &str) -> Result<(), redis::RedisError> {
        let mut conn = self.connection().await?;
        let _: () = redis::cmd("DEL").arg(key).query_async(&mut conn).await?;
        Ok(())
    }
}

/// Factory function to create a RedisClient.
pub async fn create_client(redis_url: &str) -> Result<RedisClient, Box<dyn std::error::Error>> {
    RedisClient::new(redis_url).await
}

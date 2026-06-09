use std::env;

#[derive(Debug, Clone)]
pub struct Config {
    pub database_url: String,
    pub redis_url: String,
    pub push_server_url: String,
    pub jwt_secret: String,
    pub rate_limit_per_user: u32,
    pub rate_limit_window_secs: u64,
}

impl Config {
    pub fn from_env() -> Result<Self, env::VarError> {
        Ok(Self {
            database_url: env::var("DATABASE_URL")?,
            redis_url: env::var("REDIS_URL")?,
            push_server_url: env::var("PUSH_SERVER_URL")?,
            jwt_secret: env::var("JWT_SECRET")?,
            rate_limit_per_user: env::var("RATE_LIMIT_PER_USER")
                .unwrap_or("100").parse().unwrap_or(100),
            rate_limit_window_secs: env::var("RATE_LIMIT_WINDOW_SECS")
                .unwrap_or("60").parse().unwrap_or(60),
        })
    }
}

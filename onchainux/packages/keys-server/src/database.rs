use sqlx::PgPool;

pub type DbPool = PgPool;

/// Create a connection pool to PostgreSQL.
pub async fn create_pool(database_url: &str) -> Result<DbPool, Box<dyn std::error::Error>> {
    let pool = PgPool::connect(database_url).await?;
    Ok(pool)
}

/// Run database migrations.
pub async fn run_migrations(pool: &DbPool) -> Result<(), Box<dyn std::error::Error>> {
    sqlx::migrate!("./migrations").run(pool).await?;
    Ok(())
}

/// Health check: returns true if the database is reachable.
pub async fn check_health(pool: &DbPool) -> bool {
    sqlx::query("SELECT 1").execute(pool).await.is_ok()
}

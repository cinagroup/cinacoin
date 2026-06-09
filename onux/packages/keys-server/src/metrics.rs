use lazy_static::lazy_static;
use prometheus::{HistogramOpts, HistogramVec, IntCounterVec, IntGauge, Opts, Registry};

lazy_static! {
    static ref REGISTRY: Registry = Registry::new();

    /// Total identity key operations.
    pub static ref IDENTITY_KEY_OPS_TOTAL: IntCounterVec = IntCounterVec::new(
        Opts::new("identity_key_operations_total", "Total identity key operations"),
        &["operation"]
    )
    .unwrap();

    /// Total invite key operations.
    pub static ref INVITE_KEY_OPS_TOTAL: IntCounterVec = IntCounterVec::new(
        Opts::new("invite_key_operations_total", "Total invite key operations"),
        &["operation"]
    )
    .unwrap();

    /// Total wallet key operations.
    pub static ref WALLET_KEY_OPS_TOTAL: IntCounterVec = IntCounterVec::new(
        Opts::new("wallet_key_operations_total", "Total wallet key operations"),
        &["operation"]
    )
    .unwrap();

    /// Active identity keys count.
    pub static ref ACTIVE_IDENTITY_KEYS: IntGauge = IntGauge::new(
        "active_identity_keys", "Number of active identity keys"
    )
    .unwrap();

    /// Active wallet keys count.
    pub static ref ACTIVE_WALLET_KEYS: IntGauge = IntGauge::new(
        "active_wallet_keys", "Number of active wallet keys"
    )
    .unwrap();

    /// Request latency histogram.
    pub static ref KEYS_REQUEST_DURATION: HistogramVec = HistogramVec::new(
        HistogramOpts::new("keys_request_duration_seconds", "Keys server request duration")
            .buckets(vec![0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0]),
        &["method", "path", "status"]
    )
    .unwrap();

    /// Database query latency.
    pub static ref DB_QUERY_DURATION: HistogramVec = HistogramVec::new(
        HistogramOpts::new("db_query_duration_seconds", "Database query duration")
            .buckets(vec![0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0]),
        &["operation"]
    )
    .unwrap();

    /// Cache hit/miss counters.
    pub static ref CACHE_HIT_TOTAL: IntCounterVec = IntCounterVec::new(
        Opts::new("cache_hit_total", "Total cache hits"),
        &["key_type"]
    )
    .unwrap();

    pub static ref CACHE_MISS_TOTAL: IntCounterVec = IntCounterVec::new(
        Opts::new("cache_miss_total", "Total cache misses"),
        &["key_type"]
    )
    .unwrap();

    /// Auth failures.
    pub static ref AUTH_FAILURE_TOTAL: IntCounterVec = IntCounterVec::new(
        Opts::new("auth_failure_total", "Total authentication failures"),
        &["reason"]
    )
    .unwrap();
}

fn register_all() {
    let metrics: Vec<Box<dyn prometheus::core::Collector>> = vec![
        Box::new(IDENTITY_KEY_OPS_TOTAL.clone()),
        Box::new(INVITE_KEY_OPS_TOTAL.clone()),
        Box::new(WALLET_KEY_OPS_TOTAL.clone()),
        Box::new(ACTIVE_IDENTITY_KEYS.clone()),
        Box::new(ACTIVE_WALLET_KEYS.clone()),
        Box::new(KEYS_REQUEST_DURATION.clone()),
        Box::new(DB_QUERY_DURATION.clone()),
        Box::new(CACHE_HIT_TOTAL.clone()),
        Box::new(CACHE_MISS_TOTAL.clone()),
        Box::new(AUTH_FAILURE_TOTAL.clone()),
    ];
    for m in metrics {
        REGISTRY.register(m).expect("metric registration failed");
    }
}

pub fn init() {
    register_all();
}

pub fn registry() -> &'static Registry {
    &REGISTRY
}

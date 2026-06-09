use lazy_static::lazy_static;
use prometheus::{HistogramOpts, HistogramVec, IntCounterVec, IntGauge, Opts, Registry};

lazy_static! {
    static ref REGISTRY: Registry = Registry::new();

    /// Total number of push notifications sent (labelled by platform).
    pub static ref PUSH_SENT_TOTAL: IntCounterVec = IntCounterVec::new(
        Opts::new("push_sent_total", "Total push notifications sent"),
        &["platform"]
    )
    .unwrap();

    /// Total number of failed push notifications (labelled by platform).
    pub static ref PUSH_FAILED_TOTAL: IntCounterVec = IntCounterVec::new(
        Opts::new("push_failed_total", "Total push notifications that failed"),
        &["platform"]
    )
    .unwrap();

    /// Push delivery success count.
    pub static ref PUSH_DELIVERY_SUCCESS: IntCounterVec = IntCounterVec::new(
        Opts::new("push_delivery_success_total", "Total successful deliveries"),
        &["platform"]
    )
    .unwrap();

    /// Push delivery failure count.
    pub static ref PUSH_DELIVERY_FAILURE: IntCounterVec = IntCounterVec::new(
        Opts::new("push_delivery_failure_total", "Total failed deliveries"),
        &["platform"]
    )
    .unwrap();

    /// Delivery latency histogram (seconds).
    pub static ref PUSH_DELIVERY_LATENCY: HistogramVec = HistogramVec::new(
        HistogramOpts::new("push_delivery_latency_seconds", "Push delivery latency")
            .buckets(vec![0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]),
        &["platform"]
    )
    .unwrap();

    /// Retry attempt count.
    pub static ref PUSH_RETRY_TOTAL: IntCounterVec = IntCounterVec::new(
        Opts::new("push_retry_total", "Total retry attempts"),
        &["platform", "outcome"]
    )
    .unwrap();

    /// Rate-limited requests.
    pub static ref PUSH_RATE_LIMITED_TOTAL: IntCounterVec = IntCounterVec::new(
        Opts::new("push_rate_limited_total", "Total rate-limited requests"),
        &["limit_type"]
    )
    .unwrap();

    /// Registration count.
    pub static ref DEVICE_REGISTER_TOTAL: IntCounterVec = IntCounterVec::new(
        Opts::new("device_register_total", "Total device registrations"),
        &["platform"]
    )
    .unwrap();

    /// Active registered devices.
    pub static ref ACTIVE_DEVICES: IntGauge = IntGauge::new(
        "active_devices", "Number of currently registered devices"
    )
    .unwrap();

    /// HTTP request latency histogram.
    pub static ref HTTP_REQUEST_DURATION: HistogramVec = HistogramVec::new(
        HistogramOpts::new("http_request_duration_seconds", "HTTP request duration")
            .buckets(vec![0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0]),
        &["method", "path", "status"]
    )
    .unwrap();

    /// Queue depth (pending pushes).
    pub static ref QUEUE_DEPTH: IntGauge = IntGauge::new(
        "push_queue_depth", "Number of pending push operations"
    )
    .unwrap();
}

fn register_all() {
    let metrics: Vec<Box<dyn prometheus::core::Collector>> = vec![
        Box::new(PUSH_SENT_TOTAL.clone()),
        Box::new(PUSH_FAILED_TOTAL.clone()),
        Box::new(PUSH_DELIVERY_SUCCESS.clone()),
        Box::new(PUSH_DELIVERY_FAILURE.clone()),
        Box::new(PUSH_DELIVERY_LATENCY.clone()),
        Box::new(PUSH_RETRY_TOTAL.clone()),
        Box::new(PUSH_RATE_LIMITED_TOTAL.clone()),
        Box::new(DEVICE_REGISTER_TOTAL.clone()),
        Box::new(ACTIVE_DEVICES.clone()),
        Box::new(HTTP_REQUEST_DURATION.clone()),
        Box::new(QUEUE_DEPTH.clone()),
    ];
    for m in metrics {
        REGISTRY.register(m).expect("metric registration failed");
    }
}

pub fn record_push_sent(platform: &str) {
    PUSH_SENT_TOTAL.with_label_values(&[platform]).inc();
}

pub fn record_push_failed(platform: &str) {
    PUSH_FAILED_TOTAL.with_label_values(&[platform]).inc();
}

pub fn record_rate_limited(limit_type: &str) {
    PUSH_RATE_LIMITED_TOTAL.with_label_values(&[limit_type]).inc();
}

pub fn record_retry(platform: &str, outcome: &str) {
    PUSH_RETRY_TOTAL.with_label_values(&[platform, outcome]).inc();
}

/// Initialize metrics (call once at startup).
pub fn init() {
    register_all();
}

/// Return a reference to the global registry.
pub fn registry() -> &'static Registry {
    &REGISTRY
}

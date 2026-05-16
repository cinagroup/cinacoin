//! Bundler metrics collection.
//!
//! Tracks operation counts, gas usage, fees, and latency.
//! Exposes Prometheus-compatible metrics.

use prometheus_client::encoding::text::encode;
use prometheus_client::metrics::counter::Counter;
use prometheus_client::metrics::family::Family;
use prometheus_client::metrics::gauge::Gauge;
use prometheus_client::metrics::histogram::{exponential_buckets, Histogram};
use prometheus_client::registry::Registry;
use std::sync::Arc;

/// Metric labels.
#[derive(Clone, Debug, Hash, PartialEq, Eq)]
struct MetricLabels {
    method: String,
    status: String,
}

/// Shared metrics registry.
#[derive(Clone)]
pub struct Metrics {
    pub registry: Arc<Registry>,

    // Counters
    pub ops_submitted: Arc<Counter>,
    pub ops_bundled: Arc<Counter>,
    pub ops_rejected: Arc<Counter>,
    pub ops_included: Arc<Counter>,

    // Gas
    pub total_gas_used: Arc<Counter>,
    pub total_fees_paid: Arc<Counter>,

    // Bundles
    pub bundles_sent: Arc<Counter>,
    pub bundle_size: Arc<Histogram>,

    // RPC
    pub rpc_calls: Arc<Family<MetricLabels, Counter>>,
    pub rpc_latency: Arc<Family<MetricLabels, Histogram>>,

    // Gauges
    pub pending_ops: Arc<Gauge>,
    pub active_senders: Arc<Gauge>,
}

impl Metrics {
    /// Create a new metrics collector.
    pub fn new() -> Self {
        let mut registry = Registry::default();

        let ops_submitted = Counter::default();
        registry.register(
            "ops_submitted",
            "Total UserOps submitted to the bundler",
            ops_submitted.clone(),
        );

        let ops_bundled = Counter::default();
        registry.register(
            "ops_bundled",
            "Total UserOps bundled into transactions",
            ops_bundled.clone(),
        );

        let ops_rejected = Counter::default();
        registry.register(
            "ops_rejected",
            "Total UserOps rejected by the bundler",
            ops_rejected.clone(),
        );

        let ops_included = Counter::default();
        registry.register(
            "ops_included",
            "Total UserOps included on-chain",
            ops_included.clone(),
        );

        let total_gas_used = Counter::default();
        registry.register(
            "total_gas_used",
            "Total gas used by bundled transactions",
            total_gas_used.clone(),
        );

        let total_fees_paid = Counter::default();
        registry.register(
            "total_fees_paid",
            "Total fees paid in wei",
            total_fees_paid.clone(),
        );

        let bundles_sent = Counter::default();
        registry.register(
            "bundles_sent",
            "Total bundles sent to the chain",
            bundles_sent.clone(),
        );

        let bundle_size = Histogram::new(exponential_buckets(1.0, 2.0, 10));
        registry.register(
            "bundle_size",
            "Number of UserOps per bundle",
            bundle_size.clone(),
        );

        let rpc_calls = Family::default();
        registry.register(
            "rpc_calls_total",
            "Total RPC calls by method and status",
            rpc_calls.clone(),
        );

        let rpc_latency = Histogram::new(exponential_buckets(0.001, 2.0, 12));
        let rpc_latency = Family::new_with_label_types(rpc_latency);
        registry.register(
            "rpc_latency_seconds",
            "RPC call latency in seconds",
            rpc_latency.clone(),
        );

        let pending_ops = Gauge::default();
        registry.register(
            "pending_ops",
            "Current number of pending UserOps in mempool",
            pending_ops.clone(),
        );

        let active_senders = Gauge::default();
        registry.register(
            "active_senders",
            "Number of unique active senders",
            active_senders.clone(),
        );

        Self {
            registry: Arc::new(registry),
            ops_submitted: Arc::new(ops_submitted),
            ops_bundled: Arc::new(ops_bundled),
            ops_rejected: Arc::new(ops_rejected),
            ops_included: Arc::new(ops_included),
            total_gas_used: Arc::new(total_gas_used),
            total_fees_paid: Arc::new(total_fees_paid),
            bundles_sent: Arc::new(bundles_sent),
            bundle_size: Arc::new(bundle_size),
            rpc_calls: Arc::new(rpc_calls),
            rpc_latency: Arc::new(rpc_latency),
            pending_ops: Arc::new(pending_ops),
            active_senders: Arc::new(active_senders),
        }
    }

    /// Record a UserOp submission.
    pub fn record_submit(&self) {
        self.ops_submitted.inc();
    }

    /// Record a UserOp being bundled.
    pub fn record_bundle(&self) {
        self.ops_bundled.inc();
    }

    /// Record a UserOp rejection.
    pub fn record_reject(&self) {
        self.ops_rejected.inc();
    }

    /// Record a UserOp on-chain inclusion.
    pub fn record_inclusion(&self) {
        self.ops_included.inc();
    }

    /// Record gas usage.
    pub fn record_gas(&self, gas: u64) {
        self.total_gas_used.inc_by(gas);
    }

    /// Record fee paid (in wei).
    pub fn record_fee(&self, fee: u64) {
        self.total_fees_paid.inc_by(fee);
    }

    /// Record a bundle sent.
    pub fn record_bundle_sent(&self, size: usize) {
        self.bundles_sent.inc();
        self.bundle_size.get_or_create(&()).observe(size as f64);
    }

    /// Record an RPC call.
    pub fn record_rpc(&self, method: &str, status: &str, latency_secs: f64) {
        let labels = MetricLabels {
            method: method.to_string(),
            status: status.to_string(),
        };
        self.rpc_calls.get_or_create(&labels).inc();
        self.rpc_latency.get_or_create(&labels).observe(latency_secs);
    }

    /// Update pending ops gauge.
    pub fn set_pending_ops(&self, count: u64) {
        self.pending_ops.set(count as i64);
    }

    /// Update active senders gauge.
    pub fn set_active_senders(&self, count: u64) {
        self.active_senders.set(count as i64);
    }

    /// Encode metrics in Prometheus text format.
    pub fn encode(&self) -> String {
        let mut buf = String::new();
        encode(&mut buf, &self.registry).expect("encoding failed");
        buf
    }
}

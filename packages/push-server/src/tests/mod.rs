//! Unit tests for push-server: APNs JWT token generation, FCM OAuth2 token
//! generation, push payload building, rate limiting per device, and delivery retry logic.

use crate::config::Config;
use crate::retry::RetryPolicy;
use crate::rate_limiter::RateLimiter;
use crate::types::PushResponse;

// =========================================================================
// APNs JWT Token Generation (ES256)
// =========================================================================

#[test]
fn apns_token_generation_missing_key_file() {
    let config = Config {
        host: "0.0.0.0".into(),
        port: 3000,
        shutdown_timeout_secs: 30,
        apns_team_id: "ABC123DEF".into(),
        apns_key_id: "XYZ789ABC".into(),
        apns_cert_path: "/nonexistent/key.p8".into(),
        apns_topic: "com.example.app".into(),
        apns_environment: "production".into(),
        apns_base_url: "https://api.push.apple.com".into(),
        fcm_project_id: "test-project".into(),
        fcm_service_account_path: "/nonexistent/sa.json".into(),
        redis_url: "redis://localhost:6379".into(),
        rate_limit_per_device: 60,
        rate_limit_per_app: 1000,
        rate_limit_window_secs: 60,
        retry_max_attempts: 3,
        retry_initial_delay_ms: 500,
        retry_max_delay_ms: 30_000,
        retry_backoff_multiplier: 2.0,
        delivery_receipt_enabled: true,
        delivery_receipt_ttl_secs: 86400,
        metrics_path: "/metrics".into(),
    };

    let client = crate::apns::ApnsClient::new(&config);
    let result = client.generate_token();
    assert!(result.is_err(), "expected error when key file doesn't exist");
}

// =========================================================================
// FCM OAuth2 Token Generation
// =========================================================================

#[test]
fn fcm_token_generation_missing_service_account() {
    let config = Config {
        host: "0.0.0.0".into(),
        port: 3000,
        shutdown_timeout_secs: 30,
        apns_team_id: "ABC123DEF".into(),
        apns_key_id: "XYZ789ABC".into(),
        apns_cert_path: "/nonexistent/key.p8".into(),
        apns_topic: "com.example.app".into(),
        apns_environment: "production".into(),
        apns_base_url: "https://api.push.apple.com".into(),
        fcm_project_id: "test-project".into(),
        fcm_service_account_path: "/nonexistent/service-account.json".into(),
        redis_url: "redis://localhost:6379".into(),
        rate_limit_per_device: 60,
        rate_limit_per_app: 1000,
        rate_limit_window_secs: 60,
        retry_max_attempts: 3,
        retry_initial_delay_ms: 500,
        retry_max_delay_ms: 30_000,
        retry_backoff_multiplier: 2.0,
        delivery_receipt_enabled: true,
        delivery_receipt_ttl_secs: 86400,
        metrics_path: "/metrics".into(),
    };

    let client = crate::fcm::FcmClient::new(&config);
    let rt = tokio::runtime::Runtime::new().unwrap();
    // Can't easily test get_access_token as it's private, but we can test send()
    let result = rt.block_on(client.send(
        "device-token-123",
        Some("Test"),
        "Test body",
        &std::collections::HashMap::new(),
        None,
        None,
        None,
    ));
    assert!(!result.success, "expected failure when service account missing");
    assert!(result.error.is_some(), "expected error message");
}

// =========================================================================
// Push Payload Building
// =========================================================================

#[test]
fn apns_payload_with_title_and_body() {
    let mut data = std::collections::HashMap::new();
    data.insert("url".to_string(), "https://example.com".to_string());

    let payload = crate::apns::build_apns_payload(
        Some("Test Title"),
        "Test body text",
        &data,
        Some(1),
        Some("default"),
        Some("thread-1"),
        Some(true),
        Some("category-action"),
    );

    let aps = payload.get("aps").unwrap().as_object().unwrap();
    let alert = aps.get("alert").unwrap().as_object().unwrap();
    assert_eq!(alert.get("title").unwrap().as_str().unwrap(), "Test Title");
    assert_eq!(alert.get("body").unwrap().as_str().unwrap(), "Test body text");
    assert_eq!(aps.get("badge").unwrap().as_i64().unwrap(), 1);
    assert_eq!(aps.get("sound").unwrap().as_str().unwrap(), "default");
    assert_eq!(aps.get("thread-id").unwrap().as_str().unwrap(), "thread-1");
    assert_eq!(aps.get("mutable-content").unwrap().as_i64().unwrap(), 1);
    assert_eq!(aps.get("category").unwrap().as_str().unwrap(), "category-action");
    assert_eq!(payload.get("url").unwrap().as_str().unwrap(), "https://example.com");
}

#[test]
fn apns_payload_minimal() {
    let data = std::collections::HashMap::new();

    let payload = crate::apns::build_apns_payload(
        None,
        "Body only",
        &data,
        None,
        None,
        None,
        None,
        None,
    );

    let aps = payload.get("aps").unwrap().as_object().unwrap();
    let alert = aps.get("alert").unwrap().as_object().unwrap();
    assert!(alert.get("title").is_none());
    assert_eq!(alert.get("body").unwrap().as_str().unwrap(), "Body only");
    assert!(aps.get("badge").is_none());
    assert!(aps.get("sound").is_none());
}

#[test]
fn fcm_payload_build() {
    let mut data = std::collections::HashMap::new();
    data.insert("key".to_string(), "value".to_string());

    let req = crate::fcm::FcmMessageRequest::build(
        "reg-id-123",
        Some("FCM Title"),
        "FCM Body",
        &data,
        Some(3600),
        "HIGH",
        Some("collapse-1"),
    );

    assert_eq!(req.message.token, "reg-id-123");
    assert!(req.message.notification.is_some());
    let notif = req.message.notification.as_ref().unwrap();
    assert_eq!(notif.title, "FCM Title");
    assert_eq!(notif.body, "FCM Body");
    assert!(req.message.data.is_some());
    assert_eq!(req.message.data.as_ref().unwrap().get("key").unwrap(), "value");
    assert!(req.message.android.is_some());
}

#[test]
fn fcm_payload_without_optional_fields() {
    let data = std::collections::HashMap::new();

    let req = crate::fcm::FcmMessageRequest::build(
        "reg-id-456",
        None,
        "Body only",
        &data,
        None,
        "NORMAL",
        None,
    );

    assert_eq!(req.message.token, "reg-id-456");
    assert!(req.message.notification.is_none());
    assert!(req.message.data.is_none());
}

// =========================================================================
// Rate Limiting Per Device
// =========================================================================

#[test]
fn rate_limiter_allows_within_limit() {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        let config = Config {
            host: "0.0.0.0".into(),
            port: 3000,
            shutdown_timeout_secs: 30,
            apns_team_id: "ABC".into(),
            apns_key_id: "XYZ".into(),
            apns_cert_path: "/tmp/key.p8".into(),
            apns_topic: "com.test.app".into(),
            apns_environment: "production".into(),
            apns_base_url: "https://api.push.apple.com".into(),
            fcm_project_id: "proj".into(),
            fcm_service_account_path: "/tmp/sa.json".into(),
            redis_url: "redis://localhost:6379".into(),
            rate_limit_per_device: 5,
            rate_limit_per_app: 100,
            rate_limit_window_secs: 60,
            retry_max_attempts: 3,
            retry_initial_delay_ms: 500,
            retry_max_delay_ms: 30_000,
            retry_backoff_multiplier: 2.0,
            delivery_receipt_enabled: true,
            delivery_receipt_ttl_secs: 86400,
            metrics_path: "/metrics".into(),
        };

        let limiter = RateLimiter::new(&config);

        // Should allow up to 5 requests
        for i in 0..5 {
            let allowed = limiter.check_device("token-1").await;
            assert!(allowed, "request {} should be allowed", i + 1);
        }

        // 6th request should be denied
        let allowed = limiter.check_device("token-1").await;
        assert!(!allowed, "6th request should be rate-limited");
    });
}

#[test]
fn rate_limiter_independent_per_device() {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        let config = Config {
            host: "0.0.0.0".into(),
            port: 3000,
            shutdown_timeout_secs: 30,
            apns_team_id: "ABC".into(),
            apns_key_id: "XYZ".into(),
            apns_cert_path: "/tmp/key.p8".into(),
            apns_topic: "com.test.app".into(),
            apns_environment: "production".into(),
            apns_base_url: "https://api.push.apple.com".into(),
            fcm_project_id: "proj".into(),
            fcm_service_account_path: "/tmp/sa.json".into(),
            redis_url: "redis://localhost:6379".into(),
            rate_limit_per_device: 2,
            rate_limit_per_app: 100,
            rate_limit_window_secs: 60,
            retry_max_attempts: 3,
            retry_initial_delay_ms: 500,
            retry_max_delay_ms: 30_000,
            retry_backoff_multiplier: 2.0,
            delivery_receipt_enabled: true,
            delivery_receipt_ttl_secs: 86400,
            metrics_path: "/metrics".into(),
        };

        let limiter = RateLimiter::new(&config);

        // Exhaust token-1's limit
        assert!(limiter.check_device("token-1").await);
        assert!(limiter.check_device("token-1").await);
        assert!(!limiter.check_device("token-1").await);

        // token-2 should still be allowed
        assert!(limiter.check_device("token-2").await);
    });
}

#[test]
fn rate_limiter_app_limit() {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        let config = Config {
            host: "0.0.0.0".into(),
            port: 3000,
            shutdown_timeout_secs: 30,
            apns_team_id: "ABC".into(),
            apns_key_id: "XYZ".into(),
            apns_cert_path: "/tmp/key.p8".into(),
            apns_topic: "com.test.app".into(),
            apns_environment: "production".into(),
            apns_base_url: "https://api.push.apple.com".into(),
            fcm_project_id: "proj".into(),
            fcm_service_account_path: "/tmp/sa.json".into(),
            redis_url: "redis://localhost:6379".into(),
            rate_limit_per_device: 100,
            rate_limit_per_app: 3,
            rate_limit_window_secs: 60,
            retry_max_attempts: 3,
            retry_initial_delay_ms: 500,
            retry_max_delay_ms: 30_000,
            retry_backoff_multiplier: 2.0,
            delivery_receipt_enabled: true,
            delivery_receipt_ttl_secs: 86400,
            metrics_path: "/metrics".into(),
        };

        let limiter = RateLimiter::new(&config);

        assert!(limiter.check_app("app-1").await);
        assert!(limiter.check_app("app-1").await);
        assert!(limiter.check_app("app-1").await);
        assert!(!limiter.check_app("app-1").await);
    });
}

// =========================================================================
// Delivery Retry Logic
// =========================================================================

#[test]
fn retry_succeeds_on_first_attempt() {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        let policy = RetryPolicy {
            max_attempts: 3,
            initial_delay_ms: 10,
            max_delay_ms: 100,
            backoff_multiplier: 2.0,
        };

        let result = policy.run(|attempt| async move {
            Ok::<_, String>("success")
        }).await;

        assert_eq!(result.unwrap(), "success");
    });
}

#[test]
fn retry_succeeds_after_failures() {
    use std::sync::atomic::{AtomicU32, Ordering};

    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        let policy = RetryPolicy {
            max_attempts: 3,
            initial_delay_ms: 10,
            max_delay_ms: 100,
            backoff_multiplier: 2.0,
        };

        let attempt_count = Arc::new(AtomicU32::new(0));

        let result = policy.run({
            let attempt_count = attempt_count.clone();
            move |attempt| {
                let attempt_count = attempt_count.clone();
                async move {
                    attempt_count.fetch_add(1, Ordering::SeqCst);
                    if attempt < 2 {
                        Err::<String, String>("transient".to_string())
                    } else {
                        Ok::<_, String>("finally".to_string())
                    }
                }
            }
        }).await;

        assert_eq!(result.unwrap(), "finally");
        assert_eq!(attempt_count.load(Ordering::SeqCst), 3);
    });
}

#[test]
fn retry_exhausts_all_attempts() {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        let policy = RetryPolicy {
            max_attempts: 2,
            initial_delay_ms: 10,
            max_delay_ms: 100,
            backoff_multiplier: 2.0,
        };

        let result = policy.run(|attempt| async move {
            Err::<String, _>(format!("error-{}", attempt))
        }).await;

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "error-2");
    });
}

#[test]
fn retry_delay_increases_with_backoff() {
    let policy = RetryPolicy {
        max_attempts: 5,
        initial_delay_ms: 100,
        max_delay_ms: 1000,
        backoff_multiplier: 2.0,
    };

    use std::time::Duration;
    assert_eq!(policy.delay_for_attempt(0), Duration::from_millis(100));
    assert_eq!(policy.delay_for_attempt(1), Duration::from_millis(200));
    assert_eq!(policy.delay_for_attempt(2), Duration::from_millis(400));
    assert_eq!(policy.delay_for_attempt(3), Duration::from_millis(800));
    // Should cap at max_delay_ms
    assert_eq!(policy.delay_for_attempt(4), Duration::from_millis(1000));
}

#[test]
fn retry_delay_caps_at_max() {
    let policy = RetryPolicy {
        max_attempts: 10,
        initial_delay_ms: 100,
        max_delay_ms: 500,
        backoff_multiplier: 2.0,
    };

    use std::time::Duration;
    // 100 * 2^3 = 800 > 500, so should cap
    assert_eq!(policy.delay_for_attempt(3), Duration::from_millis(500));
    assert_eq!(policy.delay_for_attempt(9), Duration::from_millis(500));
}

#[test]
fn retry_policy_from_config() {
    let config = Config {
        host: "0.0.0.0".into(),
        port: 3000,
        shutdown_timeout_secs: 30,
        apns_team_id: "ABC".into(),
        apns_key_id: "XYZ".into(),
        apns_cert_path: "/tmp/key.p8".into(),
        apns_topic: "com.test.app".into(),
        apns_environment: "production".into(),
        apns_base_url: "https://api.push.apple.com".into(),
        fcm_project_id: "proj".into(),
        fcm_service_account_path: "/tmp/sa.json".into(),
        redis_url: "redis://localhost:6379".into(),
        rate_limit_per_device: 60,
        rate_limit_per_app: 1000,
        rate_limit_window_secs: 60,
        retry_max_attempts: 5,
        retry_initial_delay_ms: 200,
        retry_max_delay_ms: 10_000,
        retry_backoff_multiplier: 1.5,
        delivery_receipt_enabled: true,
        delivery_receipt_ttl_secs: 86400,
        metrics_path: "/metrics".into(),
    };

    let policy = RetryPolicy::from_config(&config);
    assert_eq!(policy.max_attempts, 5);
    assert_eq!(policy.initial_delay_ms, 200);
    assert_eq!(policy.max_delay_ms, 10_000);
    assert_eq!(policy.backoff_multiplier, 1.5);
}

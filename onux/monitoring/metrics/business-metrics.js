/**
 * Cinacoin Production Monitoring - Business Metrics Instrumentation
 * 
 * This module provides Prometheus metrics for business KPIs.
 * Integrate into auth-service, user-service, and api-gateway.
 */

// Metrics registry - compatible with prom-client for Node.js
class BusinessMetrics {
  constructor(client) {
    this.client = client || require('prom-client');
    this.register = new this.client.Registry();
    
    // Default metrics
    this.client.collectDefaultMetrics({ register: this.register });
    
    this._initCounters();
    this._initHistograms();
    this._initGauges();
  }

  _initCounters() {
    // User Registration Counter
    this.userRegistrations = new this.client.Counter({
      name: 'user_registrations_total',
      help: 'Total number of user registrations',
      labelNames: ['method', 'provider', 'status'],
      registers: [this.register]
    });

    // Login Attempts Counter
    this.loginAttempts = new this.client.Counter({
      name: 'auth_login_attempts_total',
      help: 'Total number of login attempts',
      labelNames: ['method', 'provider', 'source'],
      registers: [this.register]
    });

    // Login Successes Counter
    this.loginSuccesses = new this.client.Counter({
      name: 'auth_login_successes_total',
      help: 'Total number of successful logins',
      labelNames: ['method', 'provider'],
      registers: [this.register]
    });

    // Login Failures Counter
    this.loginFailures = new this.client.Counter({
      name: 'auth_login_failures_total',
      help: 'Total number of failed login attempts',
      labelNames: ['method', 'reason', 'ip'],
      registers: [this.register]
    });

    // API Calls Counter
    this.apiCalls = new this.client.Counter({
      name: 'http_requests_total',
      help: 'Total HTTP requests',
      labelNames: ['method', 'endpoint', 'status', 'service'],
      registers: [this.register]
    });

    // UserOp Submissions
    this.userOpSubmissions = new this.client.Counter({
      name: 'userop_submissions_total',
      help: 'Total UserOp submissions to bundler',
      labelNames: ['chain', 'status'],
      registers: [this.register]
    });

    // UserOp Submission Failures
    this.userOpFailures = new this.client.Counter({
      name: 'userop_submission_failures_total',
      help: 'Total failed UserOp submissions',
      labelNames: ['chain', 'reason'],
      registers: [this.register]
    });

    // RPC Requests
    this.rpcRequests = new this.client.Counter({
      name: 'rpc_requests_total',
      help: 'Total RPC proxy requests',
      labelNames: ['method', 'chain', 'status'],
      registers: [this.register]
    });

    // Encryption Operations
    this.encryptionOps = new this.client.Counter({
      name: 'encryption_operations_total',
      help: 'Total encryption/decryption operations',
      labelNames: ['operation', 'status'],
      registers: [this.register]
    });
  }

  _initHistograms() {
    // HTTP Request Duration
    this.httpDuration = new this.client.Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'endpoint', 'service'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.register]
    });

    // Database Query Duration
    this.dbDuration = new this.client.Histogram({
      name: 'db_query_duration_seconds',
      help: 'Database query duration in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
      registers: [this.register]
    });

    // Blockchain Transaction Duration
    this.blockchainDuration = new this.client.Histogram({
      name: 'blockchain_transaction_duration_seconds',
      help: 'Blockchain transaction duration in seconds',
      labelNames: ['operation', 'chain'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
      registers: [this.register]
    });

    // Encryption Duration
    this.encryptionDuration = new this.client.Histogram({
      name: 'encryption_duration_seconds',
      help: 'Encryption/decryption operation duration',
      labelNames: ['operation'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1],
      registers: [this.register]
    });
  }

  _initGauges() {
    // Active Users
    this.activeUsers = new this.client.Gauge({
      name: 'active_users_current',
      help: 'Number of currently active users',
      labelNames: ['service'],
      registers: [this.register]
    });

    // Active Sessions
    this.activeSessions = new this.client.Gauge({
      name: 'active_sessions_current',
      help: 'Number of active sessions',
      registers: [this.register]
    });

    // Pending UserOps
    this.pendingUserOps = new this.client.Gauge({
      name: 'pending_userops_current',
      help: 'Number of pending UserOp submissions',
      labelNames: ['chain'],
      registers: [this.register]
    });

    // Database Connections
    this.dbConnections = new this.client.Gauge({
      name: 'db_connections_current',
      help: 'Number of active database connections',
      labelNames: ['pool'],
      registers: [this.register]
    });
  }

  // Middleware for Express/Next.js
  middleware() {
    return async (req, res, next) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        const endpoint = req.route?.path || req.url?.split('?')[0] || 'unknown';
        
        this.apiCalls.inc({
          method: req.method,
          endpoint,
          status: res.statusCode.toString(),
          service: process.env.SERVICE_NAME || 'unknown'
        });
        
        this.httpDuration.observe(
          { method: req.method, endpoint, service: process.env.SERVICE_NAME || 'unknown' },
          duration
        );
      });
      
      next();
    };
  }

  // Metrics endpoint handler
  metricsHandler() {
    return async (req, res) => {
      res.setHeader('Content-Type', this.register.contentType);
      res.end(await this.register.metrics());
    };
  }

  // Track user registration
  trackRegistration(method, provider, status) {
    this.userRegistrations.inc({ method, provider, status });
  }

  // Track login attempt
  trackLoginAttempt(method, provider, source) {
    this.loginAttempts.inc({ method, provider, source });
  }

  // Track login success
  trackLoginSuccess(method, provider) {
    this.loginSuccesses.inc({ method, provider });
  }

  // Track login failure
  trackLoginFailure(method, reason, ip) {
    this.loginFailures.inc({ method, reason, ip });
  }

  // Track UserOp
  trackUserOpSubmission(chain, status) {
    this.userOpSubmissions.inc({ chain, status });
  }

  trackUserOpFailure(chain, reason) {
    this.userOpFailures.inc({ chain, reason });
  }

  // Track RPC request
  trackRpcRequest(method, chain, status) {
    this.rpcRequests.inc({ method, chain, status });
  }
}

module.exports = { BusinessMetrics };

/**
 * Cinacoin Sentry Integration
 * Error tracking and performance monitoring configuration
 */

const SentryConfig = {
  /**
   * Initialize Sentry for a Node.js/Next.js service
   * @param {string} dsn - Sentry DSN
   * @param {string} environment - Environment name
   * @param {string} serviceName - Service identifier
   */
  init(dsn, environment = 'production', serviceName = 'unknown') {
    if (!dsn || dsn === 'your_sentry_dsn_here') {
      console.warn('[Sentry] DSN not configured, error tracking disabled');
      return null;
    }

    // Dynamic import to avoid hard dependency
    const Sentry = require('@sentry/node');
    const { nodeProfilingIntegration } = require('@sentry/profiling-node');

    Sentry.init({
      dsn,
      environment,
      
      // Service identification
      integrations: [
        nodeProfilingIntegration(),
      ],
      
      // Performance monitoring
      tracesSampleRate: environment === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev
      profilesSampleRate: 0.1,
      
      // Release tracking
      release: process.env.APP_VERSION || process.env.npm_package_version || 'unknown',
      
      // Scrub sensitive data
      beforeSend(event) {
        // Remove sensitive headers
        if (event.request?.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
          delete event.request.headers['x-api-key'];
        }
        
        // Scrub PII from request body
        if (event.request?.data) {
          const sensitiveFields = ['password', 'privateKey', 'secret', 'token', 'encryptionKey'];
          const scrubbed = { ...event.request.data };
          sensitiveFields.forEach(field => {
            if (scrubbed[field]) scrubbed[field] = '[REDACTED]';
          });
          event.request.data = scrubbed;
        }
        
        return event;
      },
      
      // Error classification
      beforeSendTransaction(transaction) {
        // Don't send health check transactions
        if (transaction.name?.includes('/health') || transaction.name?.includes('/ready')) {
          return null;
        }
        return transaction;
      },
    });

    // Set tags for service identification
    Sentry.setTag('service', serviceName);
    Sentry.setTag('environment', environment);
    Sentry.setTag('cluster', 'cinacoin-production');

    return Sentry;
  },

  /**
   * Error classification rules for Sentry alerts
   */
  errorClassification: {
    // Critical errors - immediate alert
    critical: [
      'DatabaseConnectionError',
      'EncryptionKeyMissing',
      'PrivateKeyCompromised',
      'ServiceCrash',
      'OutOfMemoryError',
    ],
    // Warning errors - batched alert
    warning: [
      'AuthenticationError',
      'RateLimitExceeded',
      'TimeoutError',
      'ValidationError',
      'BlockchainRPCError',
    ],
    // Info errors - logged only
    info: [
      'NotFoundError',
      'DeprecatedAPIUsage',
      'ClientError',
    ],
  },

  /**
   * Get severity level for an error
   */
  getSeverity(error) {
    const errorName = error?.name || error?.constructor?.name || 'Unknown';
    
    for (const [level, errors] of Object.entries(this.errorClassification)) {
      if (errors.includes(errorName)) {
        return level;
      }
    }
    
    return 'warning'; // default
  },

  /**
   * Capture exception with classification
   */
  captureException(Sentry, error, context = {}) {
    const severity = this.getSeverity(error);
    
    Sentry.withScope(scope => {
      scope.setLevel(severity === 'critical' ? 'fatal' : severity);
      
      if (context.userId) scope.setUser({ id: context.userId });
      if (context.service) scope.setTag('service', context.service);
      if (context.operation) scope.setTag('operation', context.operation);
      if (context.chain) scope.setTag('chain', context.chain);
      
      scope.setExtras(context);
      
      Sentry.captureException(error);
    });
  },
};

module.exports = { SentryConfig };

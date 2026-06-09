interface ErrorEvent {
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  timestamp: number;
}

export function initErrorTracking() {
  window.addEventListener('error', (event) => {
    sendError({
      message: event.message,
      stack: event.error?.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    sendError({
      message: `Unhandled Promise: ${event.reason}`,
      stack: event.reason?.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
    });
  });
}

function sendError(error: ErrorEvent) {
  fetch('https://api.cinacoin.com/analytics/errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(error),
    keepalive: true,
  });
}

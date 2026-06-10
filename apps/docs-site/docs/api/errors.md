---
title: Error Codes
description: Complete error reference for Cinacoin APIs
---

# Error Codes

## HTTP Status Codes

| Code | Status | Description |
|------|--------|-------------|
| 400 | Bad Request | Invalid request parameters or body |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource does not exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |

## API Error Response Format

All API errors return a JSON object with the following structure:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Human-readable description",
    "details": {}
  }
}
```

## Common Error Codes

| Error Code | Description |
|------------|-------------|
| `INVALID_REQUEST` | The request body or parameters are invalid |
| `AUTHENTICATION_FAILED` | Authentication token is missing or invalid |
| `INSUFFICIENT_FUNDS` | Account has insufficient funds |
| `RATE_LIMIT_EXCEEDED` | Too many requests in the current window |
| `RESOURCE_NOT_FOUND` | The requested resource does not exist |
| `VALIDATION_ERROR` | Input failed validation checks |
| `INTERNAL_ERROR` | An unexpected error occurred on the server |

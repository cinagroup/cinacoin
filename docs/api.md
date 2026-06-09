# CINAcoin API Documentation

Base URL: `https://api.cinacoin.com`

## Authentication

All API requests require authentication via JWT token.

### Get Token

```bash
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": 900,
  "tokenType": "Bearer"
}
```

### Use Token

```bash
GET /users/me
Authorization: Bearer eyJhbGc...
```

### Refresh Token

```bash
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

## Endpoints

### Auth

#### Register
```bash
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "password123"
}
```

#### Login
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Current User
```bash
GET /auth/me
Authorization: Bearer <token>
```

#### Logout
```bash
POST /auth/logout
Authorization: Bearer <token>
```

### Users

#### List Users
```bash
GET /users
Authorization: Bearer <token>
```

#### Get User
```bash
GET /users/:id
Authorization: Bearer <token>
```

#### Update User
```bash
PUT /users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "displayName": "John Doe",
  "avatar": "https://..."
}
```

### Teams

#### List Teams
```bash
GET /teams
Authorization: Bearer <token>
```

#### Create Team
```bash
POST /teams
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My Team",
  "description": "Team description"
}
```

#### Get Team
```bash
GET /teams/:id
Authorization: Bearer <token>
```

### Newsletter

#### Subscribe
```bash
POST /newsletter/subscribe
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "source": "website"
}
```

#### Unsubscribe
```bash
POST /newsletter/unsubscribe
Content-Type: application/json

{
  "email": "user@example.com"
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

## Rate Limiting

- Login: 5 requests per 15 minutes
- API: 100 requests per minute
- Search: 30 requests per minute

## SDKs

### JavaScript/TypeScript

```bash
npm install @cinacoin/sdk
```

```typescript
import { CINAcoinClient } from '@cinacoin/sdk';

const client = new CINAcoinClient({
  apiKey: 'your-api-key',
});

const user = await client.auth.login('email', 'password');
```

### Python

```bash
pip install cinacoin
```

```python
from cinacoin import Client

client = Client(api_key='your-api-key')
user = client.auth.login('email', 'password')
```

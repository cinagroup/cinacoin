# Developer Guide

## Getting Started

### Installation

```bash
# Clone repository
git clone https://github.com/cinagroup/cinacoin.git
cd cinacoin

# Install dependencies
npm install
```

### Development Server

```bash
# Start all applications
npm run dev

# Start specific application
cd apps/website
npm run dev
```

## Project Structure

```
cinacoin/
├── apps/
│   ├── website/              # Main website
│   ├── backend-dashboard/    # Admin panel
│   ├── cloud-dashboard/      # Cloud console
│   ├── wallet-explorer/      # Blockchain explorer
│   ├── health-status/        # Status page
│   └── demo/                 # Demo app
├── workers/
│   ├── api-gateway/          # API router
│   ├── auth-service/         # Authentication
│   ├── user-service/         # User management
│   └── verify-service/       # DNS verification
├── packages/
│   ├── shared/               # Shared utilities
│   └── sdk/                  # JavaScript SDK
└── docs/                     # Documentation
```

## Code Style

### TypeScript

- Use strict mode
- Prefer interfaces over types
- Use explicit return types for public functions

### React

- Use functional components
- Use hooks for state management
- Follow React best practices

### CSS

- Use Tailwind CSS utilities
- Follow BEM naming for custom classes
- Use design system tokens

## Testing

### Unit Tests

```bash
npm run test
```

### Integration Tests

```bash
npm run test:integration
```

### E2E Tests

```bash
npm run test:e2e
```

## API Development

### Adding New Endpoints

1. Create route file in appropriate worker
2. Add validation with Zod
3. Implement business logic
4. Add tests
5. Update API documentation

Example:

```typescript
// workers/api-gateway/src/routes/example.ts
import { Hono } from 'hono';
import { z } from 'zod';

const example = new Hono();

const createSchema = z.object({
  name: z.string().min(1).max(100),
});

example.post('/example', async (c) => {
  const body = await c.req.json();
  const data = createSchema.parse(body);
  
  // Implementation
  const result = await c.env.DB.prepare(
    'INSERT INTO examples (name) VALUES (?)'
  ).bind(data.name).run();
  
  return c.json({ success: true, id: result.meta.last_row_id });
});

export default example;
```

### Database Queries

```typescript
// SELECT
const users = await c.env.DB.prepare(
  'SELECT * FROM users WHERE status = ?'
).bind('active').all();

// INSERT
await c.env.DB.prepare(
  'INSERT INTO users (email, username) VALUES (?, ?)'
).bind(email, username).run();

// UPDATE
await c.env.DB.prepare(
  'UPDATE users SET status = ? WHERE id = ?'
).bind('inactive', userId).run();

// DELETE
await c.env.DB.prepare(
  'DELETE FROM users WHERE id = ?'
).bind(userId).run();
```

## Frontend Development

### Adding New Pages

1. Create page component in `app/` directory
2. Add SEO metadata
3. Implement responsive design
4. Add to navigation if needed

Example:

```tsx
// apps/website/src/app/example/page.tsx
import { SEO } from '@/components/SEO';

export default function ExamplePage() {
  return (
    <>
      <SEO 
        title="Example Page"
        description="Example page description"
      />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-heading-1">Example Page</h1>
        {/* Content */}
      </div>
    </>
  );
}
```

### Using API Client

```tsx
import { api } from '@/lib/api';

export default function Component() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    api.getMe().then(setUser);
  }, []);

  return <div>{user?.username}</div>;
}
```

## Deployment

### Preview Deployments

```bash
# Deploy to preview
npx wrangler deploy --env preview
```

### Production Deployment

```bash
# Deploy to production
npx wrangler deploy
```

## Debugging

### Workers Logs

```bash
# Tail logs
npx wrangler tail

# Filter by service
npx wrangler tail --format pretty
```

### Database Queries

```bash
# Execute query
npx wrangler d1 execute cinacoin-auth --command "SELECT * FROM users"
```

## Best Practices

### Security

- Never commit secrets
- Use environment variables
- Validate all inputs
- Use parameterized queries

### Performance

- Cache frequently accessed data
- Use KV for session storage
- Optimize database queries
- Minimize bundle size

### Code Quality

- Write tests
- Use TypeScript
- Follow linting rules
- Document complex logic

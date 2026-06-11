# Angular.

> `@cinacoin/angular` — Angular adapter for CinaCoin.

## Installation.

```bash
npm install @cinacoin/angular @cinacoin/core-sdk
```

## Usage.

```typescript
import { CinaCoinModule } from '@cinacoin/angular'

@NgModule({
  imports: [
    CinaCoinModule.forRoot({
      projectId: 'your-project-id',
    }),
  ],
})
export class AppModule {}
```

## Related.

- [React](/api/react) — React adapter
- [Vue](/api/vue) — Vue adapter

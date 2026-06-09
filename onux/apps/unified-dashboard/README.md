# Unified Dashboard

A comprehensive dashboard application that provides a single pane of glass across all Cinacoin applications and services.

## Features

### 🎯 Core Features
- **Unified Overview**: Aggregate metrics from all applications in one place
- **Real-time Updates**: WebSocket-powered live data updates
- **Customizable Layout**: Drag-and-drop dashboard grid system
- **Cross-app Navigation**: Quick app switcher with Cmd+K shortcut
- **Notification Center**: Real-time notifications with filtering and categorization
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Theme Support**: Light and dark mode with system preference detection

### 📊 Dashboard Components
- **Metric Cards**: KPI overview with trend indicators
- **Charts**: Line, Area, Bar, and Pie charts powered by Recharts
- **Time Range Selector**: 1h/24h/7d/30d/90d filtering
- **Activity Feed**: Recent platform activity timeline

### 🚀 Applications
- **Backend Services**: Monitor RPC, Keys, Relay, Notify, and Push services
- **Cloud Platform**: Deployment management and infrastructure overview
- **Wallet Explorer**: Multi-chain wallet and transaction explorer
- **Analytics**: Detailed performance metrics and insights
- **Projects**: Project management and configuration
- **Team**: Team member and permission management

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with Cinacoin design tokens
- **Charts**: Recharts
- **State**: React Context + WebSocket
- **Testing**: Vitest + React Testing Library

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
# From the monorepo root
cd apps/unified-dashboard

# Install dependencies (if not already done at root)
pnpm install

# Start development server
pnpm dev
```

The dashboard will be available at `http://localhost:3000`

### Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Configure the following variables:

```env
NEXT_PUBLIC_WS_URL=ws://localhost:8787/ws
NEXT_PUBLIC_API_URL=http://localhost:8787
NEXT_PUBLIC_AUTH_URL=http://localhost:8787/auth
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
NEXT_PUBLIC_ENABLE_APP_SWITCHER=true
```

## Project Structure

```
apps/unified-dashboard/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Main dashboard page
│   │   ├── layout.tsx         # Root layout
│   │   ├── globals.css        # Global styles
│   │   ├── analytics/         # Analytics page
│   │   ├── apps/              # Application pages
│   │   │   ├── backend/
│   │   │   ├── cloud/
│   │   │   └── wallet/
│   │   ├── projects/          # Projects page
│   │   ├── team/              # Team page
│   │   ├── notifications/     # Notifications page
│   │   └── settings/          # Settings page
│   ├── components/            # Reusable components
│   │   ├── DashboardLayout.tsx
│   │   ├── GlobalHeader.tsx
│   │   ├── Sidebar.tsx
│   │   ├── AppSwitcher.tsx
│   │   ├── NotificationCenter.tsx
│   │   ├── MetricCard.tsx
│   │   ├── Charts.tsx
│   │   ├── DashboardGrid.tsx
│   │   ├── TimeRangeSelector.tsx
│   │   └── ThemeToggle.tsx
│   ├── providers/             # React Context providers
│   │   ├── index.tsx
│   │   ├── WebSocketProvider.tsx
│   │   ├── MetricsProvider.tsx
│   │   └── NotificationProvider.tsx
│   ├── lib/                   # Utilities
│   │   └── utils.ts
│   └── test/                  # Test setup
│       └── setup.ts
├── public/                    # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── vitest.config.ts
```

## Key Components

### AppSwitcher (Cmd+K)
Quick navigation across all applications. Press `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux) to open.

**Features:**
- Fuzzy search across applications
- Recent visits tracking
- Keyboard navigation (↑↓ to navigate, Enter to select)
- Category filtering

### NotificationCenter
Real-time notification system with WebSocket integration.

**Features:**
- Three categories: System, Project, Team
- Unread count badge
- Mark as read (individual or all)
- Filter by category
- Real-time push notifications

### DashboardGrid
Customizable grid layout with drag-and-drop support.

**Features:**
- Responsive grid (1-4 columns)
- Drag-and-drop reordering
- Configurable col/row spans
- Layout persistence

### Charts
Rich data visualization powered by Recharts.

**Available charts:**
- `DashboardLineChart` - Trend lines
- `DashboardAreaChart` - Area fills
- `DashboardBarChart` - Bar comparisons
- `DashboardPieChart` - Distribution views

## WebSocket Integration

The dashboard uses WebSocket for real-time updates:

```typescript
// Subscribe to metrics updates
const { subscribe } = useWebSocket();

useEffect(() => {
  const unsubscribe = subscribe("metrics", (data) => {
    console.log("Metrics update:", data);
  });
  
  return unsubscribe;
}, [subscribe]);
```

**Channels:**
- `metrics` - Metric updates
- `notifications` - New notifications

## Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

## Building for Production

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

The application is configured for static export (`output: "export"`) and can be deployed to:
- Cloudflare Pages
- Vercel
- Netlify
- Any static hosting service

## Design System

Uses the shared Cinacoin design tokens and Tailwind preset:

```typescript
import { cinacoinPreset } from "../../packages/config/tailwind-preset";
```

**Key design tokens:**
- Colors: `--cc-ink`, `--cc-canvas`, `--cc-brand`, `--cc-success`, etc.
- Spacing: Consistent 4px grid
- Radius: `--cc-radius-sm/md/lg/xl`
- Shadows: `--cc-shadow-sm/md/lg`

## Accessibility

- Skip to main content link
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus management
- Screen reader friendly
- High contrast support

## Performance

- Static export for fast loading
- Optimized bundle size
- Lazy loading for heavy components
- Efficient re-renders with React Context
- WebSocket reconnection handling

## Contributing

1. Create a feature branch
2. Make your changes
3. Add tests if applicable
4. Ensure all tests pass: `pnpm test`
5. Submit a pull request

## License

Part of the Cinacoin monorepo. See root LICENSE file.

import { logger } from '@cinacoin/logger';
import { Suspense, lazy, useEffect, Component, type ReactNode, type ErrorInfo } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';

import { SiteFooter as Footer } from './components/SiteFooter';
import { SiteHeader as Navbar } from './components/SiteHeader';
import { WalletProvider } from './contexts/WalletContext';

const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const SwapPage = lazy(() => import('./pages/SwapPage'));
const MultiChainPage = lazy(() => import('./pages/MultiChainPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const WalletConnectPage = lazy(() => import('./pages/WalletConnectPage'));
const SignMessagePage = lazy(() => import('./pages/SignMessagePage'));
const TransferPage = lazy(() =>
  import('./pages/TransferPage').then((m) => ({ default: m.TransferPage }))
);
const NFTPage = lazy(() => import('./pages/NFTPage').then((m) => ({ default: m.NFTPage })));
const BridgePage = lazy(() =>
  import('./pages/BridgePage').then((m) => ({ default: m.BridgePage }))
);
const DeFiPage = lazy(() => import('./pages/DeFiPage').then((m) => ({ default: m.DeFiPage })));

/* ── Lazy route fallback with loading spinner ── */
const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-[var(--cc-hairline)] border-t-[var(--cc-link)] rounded-sm animate-spin" />
  </div>
);

/* ── Error boundary for lazy-loaded pages ── */
class PageErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logger.error('Page load failed:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--cc-canvas-soft)] px-4">
          <div className="cc-card text-center max-w-md">
            <h2 className="cc-display-sm text-[var(--cc-error)] mb-3">Failed to load page.</h2>
            <p className="cc-body-sm text-[var(--cc-body)] mb-6">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="cc-btn-primary-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ── Scroll-to-top on route change ── */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
}

/* ── 404 fallback (SPA-level catch-all) ── */
function NotFoundFallback() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--cc-canvas-soft)] px-4">
      <div className="text-center">
        <h1 className="cc-display-xl text-[var(--cc-ink)] mb-4">404</h1>
        <p className="cc-body-lg text-[var(--cc-body)] mb-8 max-w-md">
          Page not found. The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <button onClick={() => navigate('/')} className="cc-btn-primary">
          Back to Home
        </button>
      </div>
    </div>
  );
}

function App() {
  return (
    <WalletProvider>
      <PageErrorBoundary>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main id="main-content" role="main" className="flex-1">
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/swap" element={<SwapPage />} />
                <Route path="/multichain" element={<MultiChainPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/wallet-connect" element={<WalletConnectPage />} />
                <Route path="/sign-message" element={<SignMessagePage />} />
                <Route path="/transfer" element={<TransferPage />} />
                <Route path="/nft" element={<NFTPage />} />
                <Route path="/bridge" element={<BridgePage />} />
                <Route path="/defi" element={<DeFiPage />} />
                <Route path="*" element={<NotFoundFallback />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
      </PageErrorBoundary>
    </WalletProvider>
  );
}

export default App;

import { createContext, useContext, useSyncExternalStore, useCallback, useRef, type ReactNode } from 'react';

// ─── UI Store Types ───────────────────────────────────────────────────────────

export interface UIState {
  /** Sidebar collapsed state */
  sidebarCollapsed: boolean;
  /** Mobile sidebar open state */
  mobileSidebarOpen: boolean;
  /** Global loading state */
  globalLoading: boolean;
  /** Toast notifications */
  toasts: Toast[];
  /** Modal state */
  modals: Record<string, boolean>;
  /** Theme */
  theme: 'light' | 'dark';
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export interface UIActions {
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setGlobalLoading: (loading: boolean) => void;
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  openModal: (key: string) => void;
  closeModal: (key: string) => void;
  toggleModal: (key: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
}

export type UIStore = UIState & UIActions;

// ─── Store Implementation ─────────────────────────────────────────────────────

function createUIStore(): UIStore {
  let state: UIState = {
    sidebarCollapsed: false,
    mobileSidebarOpen: false,
    globalLoading: false,
    toasts: [],
    modals: {},
    theme: 'light',
  };

  const listeners = new Set<() => void>();

  const emit = () => {
    listeners.forEach((listener) => listener());
  };

  const setState = (partial: Partial<UIState>) => {
    state = { ...state, ...partial };
    emit();
  };

  let toastCounter = 0;

  return {
    // State getters (via proxy-like access)
    get sidebarCollapsed() { return state.sidebarCollapsed; },
    get mobileSidebarOpen() { return state.mobileSidebarOpen; },
    get globalLoading() { return state.globalLoading; },
    get toasts() { return state.toasts; },
    get modals() { return state.modals; },
    get theme() { return state.theme; },

    // Actions
    toggleSidebar: () => {
      setState({ sidebarCollapsed: !state.sidebarCollapsed });
    },

    setSidebarCollapsed: (collapsed: boolean) => {
      setState({ sidebarCollapsed: collapsed });
    },

    setMobileSidebarOpen: (open: boolean) => {
      setState({ mobileSidebarOpen: open });
    },

    setGlobalLoading: (loading: boolean) => {
      setState({ globalLoading: loading });
    },

    addToast: (toast: Omit<Toast, 'id'>) => {
      const id = `toast-${++toastCounter}`;
      const newToast: Toast = { ...toast, id };
      setState({ toasts: [...state.toasts, newToast] });

      // Auto-remove after duration
      const duration = toast.duration || 5000;
      if (duration > 0) {
        setTimeout(() => {
          setState({ toasts: state.toasts.filter((t) => t.id !== id) });
        }, duration);
      }

      return id;
    },

    removeToast: (id: string) => {
      setState({ toasts: state.toasts.filter((t) => t.id !== id) });
    },

    openModal: (key: string) => {
      setState({ modals: { ...state.modals, [key]: true } });
    },

    closeModal: (key: string) => {
      setState({ modals: { ...state.modals, [key]: false } });
    },

    toggleModal: (key: string) => {
      setState({ modals: { ...state.modals, [key]: !state.modals[key] } });
    },

    setTheme: (theme: 'light' | 'dark') => {
      setState({ theme });
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', theme);
        try {
          localStorage.setItem('cc-theme', theme);
        } catch {}
      }
    },

    toggleTheme: () => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      setState({ theme: newTheme });
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', newTheme);
        try {
          localStorage.setItem('cc-theme', newTheme);
        } catch {}
      }
    },

    // Internal: subscribe for React integration
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    getSnapshot: () => state,
  } as UIStore & { subscribe: (l: () => void) => () => void; getSnapshot: () => UIState };
}

// ─── React Context ────────────────────────────────────────────────────────────

const UIStoreContext = createContext<UIStore | null>(null);

export interface UIStoreProviderProps {
  children: ReactNode;
}

/**
 * UIStoreProvider — provides global UI state management.
 *
 * Usage:
 * ```tsx
 * <UIStoreProvider>
 *   <App />
 * </UIStoreProvider>
 * ```
 */
export function UIStoreProvider({ children }: UIStoreProviderProps) {
  const storeRef = useRef<UIStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = createUIStore();
  }

  return (
    <UIStoreContext.Provider value={storeRef.current}>
      {children}
    </UIStoreContext.Provider>
  );
}

/**
 * useUIStore — hook to access UI store state and actions.
 *
 * Usage:
 * ```tsx
 * const { sidebarCollapsed, toggleSidebar } = useUIStore();
 * ```
 */
export function useUIStore(): UIStore {
  const store = useContext(UIStoreContext);
  if (!store) {
    throw new Error('useUIStore must be used within a UIStoreProvider');
  }

  // Subscribe to store changes for React reactivity
  const subscribe = useCallback(
    (callback: () => void) => {
      return (store as any).subscribe(callback);
    },
    [store]
  );

  const getSnapshot = useCallback(() => {
    return (store as any).getSnapshot();
  }, [store]);

  useSyncExternalStore(subscribe, getSnapshot);

  return store;
}

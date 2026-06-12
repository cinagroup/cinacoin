import { Hash } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--cc-canvas-soft-2)] -m-6 p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto mb-3 rounded bg-primary flex items-center justify-center">
            <Hash className="w-6 h-6 text-on-primary" aria-hidden="true" />
          </div>
          <h1 className="text-display-md font-semibold text-[var(--cc-ink)]">Sign in to CinaCoin.</h1>
          <p className="text-ink-body mt-1">Manage your projects and API keys.</p>
        </div>

        <div className="cc-card">
          <form className="space-y-4">
            <div>
              <label className="block text-body-sm font-medium text-[var(--cc-ink)] mb-1">Email</label>
              <input
                type="email"
                placeholder="developer@example.com"
                className="cc-form-input"
              />
            </div>
            <div>
              <label className="block text-body-sm font-medium text-[var(--cc-ink)] mb-1">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="cc-form-input"
              />
            </div>
            <button type="submit" className="cc-btn-primary w-full justify-center">
              Sign In
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--cc-hairline)]"></div>
            </div>
            <div className="relative flex justify-center text-body-sm">
              <span className="px-2 bg-canvas text-ink-mute">or</span>
            </div>
          </div>

          <button className="cc-btn-secondary w-full justify-center">
            Sign in with Ethereum (SIWE)
          </button>
        </div>

        <p className="text-center text-body-sm text-ink-mute mt-4">
          Don&apos;t have an account?{" "}
          <a href="#" className="text-link hover:text-link-hover font-medium">
            Create one
          </a>
        </p>
      </div>
    </div>
  );
}

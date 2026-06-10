export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas-soft-2 -m-6 p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-[48px] mb-3">🔢</div>
          <h1 className="text-[24px] font-semibold text-ink">Cinacoin Developer Portal</h1>
          <p className="text-ink-body mt-1">Sign in to manage your projects</p>
        </div>

        <div className="card">
          <form className="space-y-4">
            <div>
              <label className="block text-[14px] font-medium text-ink mb-1">Email</label>
              <input
                type="email"
                placeholder="developer@example.com"
                className="input"
              />
            </div>
            <div>
              <label className="block text-[14px] font-medium text-ink mb-1">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="input"
              />
            </div>
            <button type="submit" className="btn-primary w-full justify-center">
              Sign In
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-hairline"></div>
            </div>
            <div className="relative flex justify-center text-[14px]">
              <span className="px-2 bg-[var(--color-canvas)] text-ink-mute">or</span>
            </div>
          </div>

          <button className="btn-secondary w-full justify-center">
            🦊 Sign in with Ethereum (SIWE)
          </button>
        </div>

        <p className="text-center text-[14px] text-ink-mute mt-4">
          Don&apos;t have an account?{" "}
          <a href="#" className="text-link hover:text-link-hover font-medium">
            Create one
          </a>
        </p>
      </div>
    </div>
  );
}

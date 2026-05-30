export default function Developers() {
  return (
    <section id="developers" className="relative py-24">
      {/* Background glow */}
      <div className="absolute bottom-0 left-1/4">
        <div className="h-[400px] w-[500px] rounded-full bg-gradient-to-br from-purple-500/10 to-blue-500/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left: Text */}
          <div>
            <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
              Built for{' '}
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                developers
              </span>
            </h2>
            <p className="mt-4 text-lg text-zinc-400">
              Clean APIs, comprehensive docs, and SDKs in every major language. Get building in minutes, not days.
            </p>

            <div className="mt-8 space-y-4">
              {[
                'TypeScript, Python, Go, and Rust SDKs',
                'Interactive API playground with live examples',
                'Webhook integration for real-time events',
                'Open source on GitHub — 2K+ stars',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="mt-1 text-green-400">✓</span>
                  <span className="text-sm text-zinc-300">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex gap-4">
              <a
                href="https://docs.cinacoin.com"
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90"
              >
                Read Docs →
              </a>
              <a
                href="https://github.com/cinagroup/cinacoin"
                className="rounded-full border border-white/10 px-6 py-3 text-sm font-semibold transition-colors hover:bg-white/5"
              >
                GitHub
              </a>
            </div>
          </div>

          {/* Right: Code preview */}
          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm">
            <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
              <div className="h-2.5 w-2.5 rounded-full bg-zinc-600" />
              <div className="h-2.5 w-2.5 rounded-full bg-zinc-600" />
              <div className="h-2.5 w-2.5 rounded-full bg-zinc-600" />
              <span className="ml-2 text-xs text-zinc-500">example.ts</span>
            </div>
            <pre className="p-5 font-mono text-sm leading-relaxed">
              <code>
                <span className="text-purple-400">import</span>{' '}
                <span className="text-zinc-300">{'{ Cinacoin }'}</span>{' '}
                <span className="text-purple-400">from</span>{' '}
                <span className="text-green-400">'@cinacoin/sdk'</span>
                {'\n\n'}
                <span className="text-zinc-500">// Initialize the client</span>
                {'\n'}
                <span className="text-purple-400">const</span>{' '}
                <span className="text-blue-300">client</span>{' '}
                <span className="text-zinc-500">=</span>{' '}
                <span className="text-yellow-300">Cinacoin</span>
                <span className="text-zinc-500">.</span>
                <span className="text-yellow-300">init</span>
                <span className="text-zinc-500">({'{'}</span>
                {'\n'}
                {'  '}<span className="text-zinc-300">projectId:</span>{' '}
                <span className="text-green-400">'your-id'</span>
                <span className="text-zinc-500">,</span>
                {'\n'}
                {'  '}<span className="text-zinc-300">chains:</span>{' '}
                <span className="text-zinc-500">[</span>
                <span className="text-orange-400">1</span>
                <span className="text-zinc-500">,</span>{' '}
                <span className="text-orange-400">137</span>
                <span className="text-zinc-500">,</span>{' '}
                <span className="text-orange-400">42161</span>
                <span className="text-zinc-500">],</span>
                {'\n'}
                <span className="text-zinc-500">{'}'})</span>
                {'\n\n'}
                <span className="text-zinc-500">// Connect a wallet</span>
                {'\n'}
                <span className="text-purple-400">const</span>{' '}
                <span className="text-blue-300">session</span>{' '}
                <span className="text-zinc-500">=</span>{' '}
                <span className="text-purple-400">await</span>{' '}
                <span className="text-blue-300">client</span>
                <span className="text-zinc-500">.</span>
                <span className="text-yellow-300">connect</span>
                <span className="text-zinc-500">()</span>
                {'\n\n'}
                <span className="text-zinc-500">// Send a cross-chain transaction</span>
                {'\n'}
                <span className="text-purple-400">await</span>{' '}
                <span className="text-blue-300">client</span>
                <span className="text-zinc-500">.</span>
                <span className="text-yellow-300">transfer</span>
                <span className="text-zinc-500">({'{'}</span>
                {'\n'}
                {'  '}<span className="text-zinc-300">to:</span>{' '}
                <span className="text-green-400">'0x...'</span>
                <span className="text-zinc-500">,</span>
                {'\n'}
                {'  '}<span className="text-zinc-300">chain:</span>{' '}
                <span className="text-orange-400">137</span>
                <span className="text-zinc-500">,</span>
                {'\n'}
                <span className="text-zinc-500">{'}'})</span>
              </code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}

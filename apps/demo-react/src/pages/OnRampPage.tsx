import { OnRampWidget } from '../components/OnRampWidget'

export default function OnRampPage() {
  return (
    <section className="max-w-md mx-auto w-full py-12 px-4" aria-label="Buy crypto">
      <h1 className="cc-display-lg text-center mb-8">Buy crypto.</h1>
      <OnRampWidget />
      <p className="text-center text-caption text-[var(--cc-muted)] cc-caption mt-4">
        Powered by <span className="font-medium text-[var(--cc-body)]">Reown On-Ramp</span>
        {' · '}<span className="text-[var(--cc-warning)]/70">Demo mode — providers are illustrative</span>
      </p>
    </section>
  )
}

'use client';

/** Transaction step progress visualization. */

export interface TxStep {
  label: string;
  icon: string;
  status: 'pending' | 'active' | 'done' | 'error';
}

export default function TxProgress({ steps }: { steps: TxStep[] }) {
  const activeIdx = steps.findIndex((s) => s.status === 'active');
  const errorIdx = steps.findIndex((s) => s.status === 'error');

  return (
    <div className="mx-5 mb-5 p-4 bg-[var(--cc-canvas)]/60 rounded-md border border-[var(--cc-hairline-strong)]/30 animate-slide-up">
      <div className="space-y-3">
        {steps.map((step, i) => {
          const isDone = step.status === 'done';
          const isActive = step.status === 'active';
          const isError = step.status === 'error';
          const isLast = i === steps.length - 1;

          return (
            <div key={step.label} className="flex items-start gap-3">
              {/* Step indicator */}
              <div className="flex flex-col items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300 ${
                    isDone
                      ? 'bg-[var(--cc-success)]/20 border-[var(--cc-success)]/60 text-[var(--cc-success)]'
                      : isActive
                      ? 'bg-[var(--cc-link)]/20 border-[var(--cc-primary)]/60 text-[var(--cc-link)]'
                      : isError
                      ? 'bg-[var(--cc-error)]/20 border-red-500/60 text-[var(--cc-error)]'
                      : 'bg-[var(--cc-canvas-soft-2)] border-[var(--cc-hairline-strong)]/50 text-[var(--cc-body)]'
                  }`}
                >
                  {isDone ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isError ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : isActive ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <span className="text-xs">{step.icon}</span>
                  )}
                </div>
                {/* Connector line */}
                {!isLast && (
                  <div
                    className={`w-0.5 h-6 transition-colors duration-300 ${
                      isDone ? 'bg-[var(--cc-success)]/40' : 'bg-[var(--cc-canvas-soft-2)]/50'
                    }`}
                  />
                )}
              </div>
              {/* Step label */}
              <div className={`pt-1.5 transition-colors duration-300 ${
                isDone ? 'text-[var(--cc-success)]' : isActive ? 'text-[var(--cc-link)]' : isError ? 'text-[var(--cc-error)]' : 'text-[var(--cc-body)]'
              }`}>
                <span className="text-sm font-medium">{step.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall progress bar */}
      <div className="mt-3 pt-3 border-t border-[var(--cc-hairline-strong)]/30">
        <div className="h-2 bg-[var(--cc-canvas-soft-2)] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              errorIdx >= 0
                ? 'bg-[var(--cc-error)]'
                : steps.every((s) => s.status === 'done')
                ? 'bg-[var(--cc-success)]'
                : activeIdx >= 0
                ? 'bg-[var(--cc-link)]'
                : 'bg-[var(--cc-canvas-soft-2)]'
            }`}
            style={{
              width: errorIdx >= 0
                ? `${((errorIdx + 1) / steps.length) * 100}%`
                : steps.every((s) => s.status === 'done')
                ? '100%'
                : activeIdx >= 0
                ? `${((activeIdx + 0.5) / steps.length) * 100}%`
                : '0%',
            }}
          />
        </div>
      </div>
    </div>
  );
}

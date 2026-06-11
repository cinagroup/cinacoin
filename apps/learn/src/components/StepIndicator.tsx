interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export default function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2 mb-8" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={totalSteps} aria-label={`Step ${currentStep} of ${totalSteps}`}>
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div
          key={step}
          className="h-1 flex-1 rounded-full transition-colors"
          style={{ 
            backgroundColor: step <= currentStep ? 'var(--cc-link)' : 'var(--cc-canvas-soft-2)',
          }}
          aria-hidden="true"
        />
      ))}
      <span className="text-body-sm ml-2" style={{ color: 'var(--cc-mute)' }}>
        Step {currentStep} of {totalSteps}
      </span>
    </div>
  );
}

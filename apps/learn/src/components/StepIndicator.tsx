interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export default function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div
          key={step}
          className={`h-1 flex-1 rounded-full transition-colors ${
            step <= currentStep ? "bg-accent-blue" : "bg-bg-hover"
          }`}
        />
      ))}
      <span className="text-[14px] text-text-secondary ml-2">
        Step {currentStep} of {totalSteps}
      </span>
    </div>
  );
}

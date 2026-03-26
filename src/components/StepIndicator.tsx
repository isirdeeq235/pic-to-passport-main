import { Check } from "lucide-react";

/** Step names for the passport photo maker workflow */
const STEPS = ["Upload", "Edit", "Align", "Download"];

interface StepIndicatorProps {
  currentStep: number;
}

/**
 * Horizontal progress indicator showing the 4-step passport photo workflow.
 * Completed steps show a checkmark, current step is highlighted.
 */
const StepIndicator = ({ currentStep }: StepIndicatorProps) => {
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 py-6">
      {STEPS.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <div key={step} className="flex items-center">
            {/* Step circle + label */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200 ${
                  isCompleted
                    ? "bg-accent text-accent-foreground"
                    : isCurrent
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : index + 1}
              </div>
              <span
                className={`text-xs font-medium ${
                  isCurrent ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {step}
              </span>
            </div>

            {/* Connector line between steps */}
            {index < STEPS.length - 1 && (
              <div
                className={`w-8 sm:w-16 h-0.5 mx-1 sm:mx-2 mb-6 transition-colors ${
                  index < currentStep ? "bg-accent" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StepIndicator;

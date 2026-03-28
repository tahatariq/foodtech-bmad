const DEFAULT_STAGES = ['Received', 'Preparing', 'Plating', 'Ready'];

interface CustomerProgressStepsProps {
  currentStep: 1 | 2 | 3 | 4;
  stages?: string[];
}

export function CustomerProgressSteps({
  currentStep,
  stages = DEFAULT_STAGES,
}: CustomerProgressStepsProps) {
  const currentStageLabel = stages[currentStep - 1] ?? stages[0];

  return (
    <div
      role="progressbar"
      aria-label={`Order progress: ${currentStageLabel} of ${stages.length} stages`}
      aria-valuenow={currentStep}
      aria-valuemax={stages.length}
      className="flex items-center justify-between w-full"
    >
      {stages.map((stage, i) => {
        const stepNum = i + 1;
        const isDone = stepNum < currentStep;
        const isActive = stepNum === currentStep;

        return (
          <div key={stage} className="flex items-center flex-1 last:flex-none">
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
                  ${isDone ? 'bg-green-500 text-white' : ''}
                  ${isActive ? 'bg-blue-500 text-white animate-[pulse_2s_ease-in-out_infinite] motion-reduce:animate-none' : ''}
                  ${!isDone && !isActive ? 'bg-gray-200 text-gray-500' : ''}
                `}
              >
                {isDone ? '✓' : stepNum}
              </div>
              <span
                className={`mt-1 text-xs ${isDone ? 'text-green-600 font-medium' : isActive ? 'text-blue-600 font-medium' : 'text-gray-400'}`}
              >
                {stage}
              </span>
            </div>

            {/* Connector line */}
            {stepNum < stages.length && (
              <div
                className={`flex-1 h-0.5 mx-2 ${
                  stepNum < currentStep
                    ? 'bg-green-400'
                    : 'border-t-2 border-dashed border-gray-300'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

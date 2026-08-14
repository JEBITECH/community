  const AppStepper = ({ stepData, step }: { stepData: string[], step: number }) => {
    return (
      <div className="px-4">
        <div className="flex items-center justify-between mb-6 relative">
          {stepData.map((label, index) => {
            const stepNumber = index + 1;
            const isActive = step === stepNumber;
            const isCompleted = step > stepNumber;

            return (
              <div key={index} className="flex-1 flex flex-col items-center relative mt-4">
                {/* Step Circle */}
                <div
                  className={`w-8 h-8 flex items-center justify-center rounded-full border-2 z-10 transition-colors duration-300
                  ${isCompleted
                      ? "bg-green-500 border-green-500 text-white"
                      : isActive
                        ? "border-blue-500 text-blue-500 bg-white"
                        : "border-gray-300 text-gray-400 bg-white"}
                `}
                >
                  {stepNumber}
                </div>

                {/* Step Label */}
                <span className="text-sm mt-2 text-center">{label}</span>

                {/* Connector Line */}
                {index !== stepData.length - 1 && (
                  <div
                    className={`absolute top-4 left-0 right-0 h-[2px] -z-10 transition-colors duration-300
                    ${isCompleted ? "bg-green-500" : "bg-gray-300"}
                  `}
                    style={{ transform: "translateX(50%)", width: "100%" }}
                  ></div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    )
  }

  export default AppStepper
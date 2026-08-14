
const LoadingOverlay = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
      {/* Radix style spinner */}
      <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-primary-foreground text-lg font-medium">Loading...</p>
    </div>
  );
};

export default LoadingOverlay;

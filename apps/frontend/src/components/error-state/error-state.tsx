import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  onRetry: () => void;
}

export function ErrorState({ onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex flex-col items-center justify-center gap-4 rounded-lg bg-[#FEF2F2] px-6 py-12 text-center motion-reduce:transition-none"
    >
      <h2 className="text-lg font-semibold text-[#B91C1C]">
        Having trouble connecting
      </h2>
      <p className="text-sm text-[#57534E]">
        Check your connection and try again
      </p>
      <Button onClick={onRetry} className="mt-2">
        Retry
      </Button>
    </div>
  );
}

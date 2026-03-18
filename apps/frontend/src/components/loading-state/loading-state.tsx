export function LoadingState() {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">Loading todos...</span>
      <ul className="flex flex-col gap-4">
        {[0, 1, 2].map((i) => (
          <li key={i}>
            <div className="flex min-h-[48px] items-center gap-3 rounded-lg bg-white px-3 py-3">
              <div className="size-5 shrink-0 rounded-full bg-[#E7E5E4] animate-pulse motion-reduce:animate-none" />
              <div
                className="h-4 rounded bg-[#E7E5E4] animate-pulse motion-reduce:animate-none"
                style={{ width: `${60 + i * 10}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

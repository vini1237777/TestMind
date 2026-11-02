export default function CardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="panel h-[132px] animate-pulse p-4">
          <div className="h-4 w-1/2 rounded bg-panel-2" />
          <div className="mt-3 h-3 w-5/6 rounded bg-panel-2" />
          <div className="mt-2 h-3 w-2/3 rounded bg-panel-2" />
        </div>
      ))}
    </section>
  );
}

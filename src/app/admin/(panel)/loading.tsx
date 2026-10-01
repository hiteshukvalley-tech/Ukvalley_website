/**
 * Shown inside the admin shell the moment a sidebar link is clicked, while the
 * next page's data loads. Without it the old page stays frozen on screen until
 * the server has finished every database query.
 */
export default function AdminLoading() {
  return (
    <div role="status" aria-label="Loading" className="animate-pulse">
      <div className="mb-8 flex flex-col gap-3">
        <div className="h-3 w-32 rounded bg-uk-surface-3" />
        <div className="h-8 w-64 rounded-lg bg-uk-surface-3" />
        <div className="h-4 w-96 max-w-full rounded bg-uk-surface-2" />
      </div>
      <div className="mb-4 flex gap-3">
        <div className="h-10 flex-1 rounded-lg bg-uk-surface-2" />
        <div className="h-10 w-32 rounded-lg bg-uk-surface-2" />
      </div>
      <div className="divide-y divide-uk-line rounded-2xl border border-uk-line bg-uk-card">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <div className="h-4 flex-1 rounded bg-uk-surface-2" />
            <div className="h-4 w-20 rounded bg-uk-surface-2" />
            <div className="h-8 w-24 rounded-lg bg-uk-surface-2" />
          </div>
        ))}
      </div>
    </div>
  );
}

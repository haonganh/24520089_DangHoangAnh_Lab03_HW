
export interface HitEntry {
  id: number;
  name: string;
  time: string;
}

interface HitLogProps {
  hits: HitEntry[];
  announcement: string;
}

export default function HitLog({
  hits,
  announcement,
}: HitLogProps) {
  return (
    <section aria-labelledby="hit-log-heading">
      <h3 id="hit-log-heading">Recent Drum Hits</h3>

      <output
        className="hit-status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement || 'No drum hits yet.'}
      </output>

      <ol className="hit-list" aria-live="off">
        {hits.map((hit) => (
          <li key={hit.id}>
            <strong>{hit.name}</strong>
            <span>{hit.time}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

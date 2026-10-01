/**
 * Global delivery mesh — an abstract world-arcs visualization showing
 * Ukvalley's delivery footprint (Canada · USA · Dubai · India) with
 * data flowing along the arcs toward the India HQ node.
 * Pure SVG + CSS motion; decorative, aria-hidden. Reduced-motion:
 * the shared CSS block freezes all flow/pulse animation.
 */
export function DeliveryMesh({ className }: { className?: string }) {
  // Node positions on a 560×180 viewBox — abstract globe strip, west→east.
  // `labelBelow`: every arc arrives at the HQ from above, and the Dubai arc
  // leaves its node almost vertically — so both labels sit under their
  // node, where no line can run through the text.
  const nodes = [
    { id: "ca", label: "Canada", x: 90, y: 78 },
    { id: "us", label: "USA", x: 190, y: 112 },
    { id: "dxb", label: "Dubai", x: 372, y: 128, labelBelow: true },
    { id: "in", label: "India · HQ", x: 476, y: 96, hq: true, labelBelow: true },
  ];

  // Quadratic arcs from each client node into the HQ.
  const arcs = nodes
    .filter((n) => !n.hq)
    .map((n) => `M ${n.x} ${n.y} Q ${(n.x + 476) / 2} ${Math.min(n.y, 96) - 58} 476 96`);

  return (
    <div className={className} aria-hidden>
      <svg viewBox="0 0 560 180" fill="none" className="h-full w-full">
        {/* faint world-dot backdrop */}
        {Array.from({ length: 7 }).map((_, row) =>
          Array.from({ length: 28 }).map((__, col) => (
            <circle
              key={`${row}-${col}`}
              cx={10 + col * 20}
              cy={16 + row * 24}
              r={1}
              className="fill-uk-blue/15"
            />
          ))
        )}

        {/* flowing arcs */}
        {arcs.map((d) => (
          <g key={d}>
            <path d={d} className="stroke-uk-blue/[0.18]" strokeWidth="1" />
            <path d={d} className="flow-dash stroke-uk-blue" strokeWidth="1.6" />
          </g>
        ))}

        {/* nodes */}
        {nodes.map((n) => (
          <g key={n.id}>
            {n.hq ? (
              <>
                <circle cx={n.x} cy={n.y} r={16} className="fill-uk-blue/12" />
                <circle cx={n.x} cy={n.y} r={7} className="node-pulse fill-uk-blue" />
                <circle cx={n.x} cy={n.y} r={3} className="fill-uk-yellow" />
              </>
            ) : (
              <circle cx={n.x} cy={n.y} r={4.5} className="node-pulse fill-uk-blue" style={{ animationDelay: `${nodes.indexOf(n) * 0.6}s` }} />
            )}
            <text
              x={n.x}
              // below: clear the node (HQ halo is r=16) plus the 11px glyph height
              y={n.labelBelow ? n.y + (n.hq ? 30 : 22) : n.y - 13}
              textAnchor="middle"
              className="fill-uk-heading font-heading text-[11px] font-bold max-sm:text-[17px]"
            >
              {n.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
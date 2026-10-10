import { ChevronDown, Map as MapIcon } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';

import {
  DEFAULT_MINIMAP_VIEWBOX,
  type MinimapNode,
  getMinimapConfig,
  resolveMinimapView,
} from '@chemicalluck/sim-engine/features/minimap/lib/minimap';
import { selectCurrentLocation } from '@chemicalluck/sim-engine/features/player/selectors';
import { getWorld } from '@chemicalluck/sim-engine/features/travel/lib/world';
import type { LocationNode } from '@chemicalluck/sim-engine/features/travel/types';
import { useIsMobile } from '@chemicalluck/sim-engine/hooks/use-mobile';
import { cn } from '@chemicalluck/sim-engine/lib/css';
import { useEngineSelector } from '@chemicalluck/sim-engine/state/store';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function findLocation(id: string): LocationNode | undefined {
  return getWorld().locations.find((l) => l.id === id);
}

function getAncestorChain(locationId: string): LocationNode[] {
  const chain: LocationNode[] = [];
  let current = findLocation(locationId);
  while (current) {
    chain.unshift(current);
    if (!current.parent) break;
    current = findLocation(current.parent);
  }
  return chain;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function Minimap() {
  const currentLocation = useEngineSelector(selectCurrentLocation);
  const view = resolveMinimapView(
    currentLocation.id,
    getMinimapConfig(),
    findLocation,
  );
  const nodes = view?.nodes ?? {};
  const zones = view?.zones ?? [];
  const activeId = view?.activeId;
  const breadcrumb = getAncestorChain(currentLocation.id);
  const showBreadcrumb = breadcrumb.length > 1;
  const viewBox = view?.viewBox ?? DEFAULT_MINIMAP_VIEWBOX;
  const activeNode = activeId ? nodes[activeId] : undefined;
  // Phones keep the map folded away so the story gets the screen.
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState(false);
  const showMap = !isMobile || expanded;

  // On phones the map is wider than the screen; keep the player centred.
  const scrollerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !activeNode) return;
    const [minX, , width] = viewBox.split(/[\s,]+/).map(Number);
    if (!width) return;
    const ratio = (activeNode.x - minX) / width;
    scroller.scrollLeft =
      ratio * scroller.scrollWidth - scroller.clientWidth / 2;
  }, [activeNode, viewBox, showMap]);

  const breadcrumbLine = showBreadcrumb && (
    <p className="mt-1.5 text-xs text-muted-foreground leading-none">
      {breadcrumb.map((loc, i) => (
        <span key={loc.id}>
          {i > 0 && <span className="mx-1 opacity-40">›</span>}
          <span
            className={
              i === breadcrumb.length - 1 ? 'text-foreground font-medium' : ''
            }
          >
            {loc.name}
          </span>
        </span>
      ))}
    </p>
  );

  return (
    <div>
      {isMobile && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => {
            setExpanded((e) => !e);
          }}
          className={cn(
            'flex min-h-11 w-full items-center gap-2 rounded-md border border-border px-3 text-sm text-muted-foreground active:bg-accent',
            expanded && 'mb-2',
          )}
        >
          <MapIcon className="size-4" aria-hidden="true" />
          <span className="font-medium text-foreground">
            {expanded ? 'Hide map' : 'Show map'}
          </span>
          <ChevronDown
            className={cn(
              'ml-auto size-4 transition-transform',
              expanded && 'rotate-180',
            )}
            aria-hidden="true"
          />
        </button>
      )}
      {showMap && (
        <>
          <div
            ref={scrollerRef}
            className="overflow-x-auto overscroll-x-contain rounded-md border border-border [scrollbar-width:none]"
          >
            <svg
              viewBox={viewBox}
              className="block w-full max-md:min-w-[40rem] md:max-h-[175px]"
              aria-label="World map"
            >
              {/* Zone backgrounds */}
              {zones.map((zone) => (
                <g key={zone.label}>
                  <rect
                    x={zone.x}
                    y={zone.y}
                    width={zone.width}
                    height={zone.height}
                    rx={7}
                    style={{
                      fill: 'var(--muted)',
                      stroke: 'var(--border)',
                      strokeWidth: 1,
                    }}
                  />
                  <text
                    x={zone.x + zone.width / 2}
                    y={zone.y + 15}
                    textAnchor="middle"
                    fontSize={8}
                    fontWeight="700"
                    letterSpacing="0.1em"
                    style={{ fill: 'var(--muted-foreground)' }}
                  >
                    {zone.label}
                  </text>
                </g>
              ))}

              {/* Edges */}
              {getWorld().edges.map((edge) => {
                const a = nodes[edge.nodes[0]] as MinimapNode | undefined;
                const b = nodes[edge.nodes[1]] as MinimapNode | undefined;
                // Edges to locations not on this map (another map, or no node) are skipped.
                if (!a || !b) return null;

                const touchesActive = activeId && edge.nodes.includes(activeId);

                let stroke = 'var(--foreground)';
                let strokeDasharray: string | undefined;
                if (edge.kind === 'bus') {
                  stroke = '#f97316';
                  strokeDasharray = '5 3';
                }
                if (edge.kind === 'train') {
                  stroke = '#3b82f6';
                  strokeDasharray = '8 3';
                }

                return (
                  <line
                    key={`${edge.nodes[0]}-${edge.nodes[1]}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    strokeDasharray={strokeDasharray}
                    style={{
                      stroke,
                      strokeWidth: touchesActive ? 2 : 1.5,
                      opacity: touchesActive ? 0.9 : 0.35,
                    }}
                  />
                );
              })}

              {/* Nodes */}
              {Object.entries(nodes).map(([id, { x, y, label }]) => {
                const isActive = id === activeId;
                return (
                  <g key={id}>
                    {isActive && (
                      <circle
                        cx={x}
                        cy={y}
                        r={14}
                        style={{
                          fill: 'var(--primary)',
                          fillOpacity: 0.15,
                          stroke: 'var(--primary)',
                          strokeWidth: 1.5,
                        }}
                      />
                    )}
                    <circle
                      cx={x}
                      cy={y}
                      r={isActive ? 8 : 5.5}
                      style={{
                        fill: isActive ? 'var(--primary)' : 'var(--background)',
                        stroke: isActive ? 'var(--primary)' : 'var(--border)',
                        strokeWidth: isActive ? 0 : 1.5,
                      }}
                    />
                    <text
                      x={x}
                      y={y + (isActive ? 23 : 20)}
                      textAnchor="middle"
                      fontSize={8}
                      fontWeight={isActive ? '600' : '400'}
                      style={{
                        fill: isActive
                          ? 'var(--foreground)'
                          : 'var(--muted-foreground)',
                      }}
                    >
                      {label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Legend */}
          <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <svg width="20" height="8">
                <line
                  x1="0"
                  y1="4"
                  x2="20"
                  y2="4"
                  style={{
                    stroke: 'var(--foreground)',
                    strokeWidth: 1.5,
                    opacity: 0.5,
                  }}
                />
              </svg>
              Walk
            </span>
            <span className="flex items-center gap-1">
              <svg width="20" height="8">
                <line
                  x1="0"
                  y1="4"
                  x2="20"
                  y2="4"
                  stroke="#f97316"
                  strokeWidth="1.5"
                  strokeDasharray="5 3"
                />
              </svg>
              Bus
            </span>
            <span className="flex items-center gap-1">
              <svg width="20" height="8">
                <line
                  x1="0"
                  y1="4"
                  x2="20"
                  y2="4"
                  stroke="#3b82f6"
                  strokeWidth="1.5"
                  strokeDasharray="8 3"
                />
              </svg>
              Train
            </span>
          </div>
        </>
      )}

      {/* Breadcrumb for interior locations */}
      {breadcrumbLine}
    </div>
  );
}

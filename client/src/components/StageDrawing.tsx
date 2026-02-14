import React, { useMemo } from 'react';

interface StageDrawingProps {
  opNumber: string;
  title?: string;
  description?: string;
  machinedFeatures?: string[];
  remainingStock?: string;
  fixturing?: string;
  size?: 'thumb' | 'full';
}

/**
 * Client-side SVG stage drawing generator.
 * Renders a technical engineering-style visualization of the part
 * at each machining stage — no API calls needed.
 */
export function StageDrawing({
  opNumber,
  title,
  description,
  machinedFeatures = [],
  remainingStock,
  fixturing,
  size = 'thumb',
}: StageDrawingProps) {
  const isThumb = size === 'thumb';
  const w = isThumb ? 80 : 320;
  const h = isThumb ? 60 : 240;

  // Determine operation index for progressive visualization
  const opIndex = useMemo(() => {
    const num = parseInt(opNumber.replace(/\D/g, ''), 10);
    return isNaN(num) ? 1 : Math.floor(num / 10);
  }, [opNumber]);

  // Determine if this is a non-CNC operation
  const isDeburr = /deburr|bench/i.test(description || '') || /deburr/i.test(opNumber);
  const isInspect = /inspect|cmm|fai/i.test(description || '') || /inspect/i.test(opNumber);
  const isOutside = /outside|anodize|plate|heat treat|ndt/i.test(description || '');
  const isWash = /wash|clean/i.test(description || '');
  const isCNC = !isDeburr && !isInspect && !isOutside && !isWash;

  // Feature detection from machinedFeatures text
  const hasProfile = machinedFeatures.some(f => /profile|outside|contour|perimeter/i.test(f));
  const hasPocket = machinedFeatures.some(f => /pocket|cavity|recess/i.test(f));
  const hasHoles = machinedFeatures.some(f => /hole|drill|tap|bore/i.test(f));
  const hasFace = machinedFeatures.some(f => /face|fly.?cut|surface|top|bottom/i.test(f));
  const hasChamfer = machinedFeatures.some(f => /chamfer|bevel|break.*edge/i.test(f));
  const hasSlot = machinedFeatures.some(f => /slot|groove|channel/i.test(f));
  const hasRadius = machinedFeatures.some(f => /radius|fillet|corner/i.test(f));

  // Colors
  const bgColor = '#0a0e17';
  const stockColor = '#1a2332';
  const stockStroke = '#2a3a4a';
  const machinedFill = '#0d2a3a';
  const machinedStroke = '#00d9ff';
  const featureHighlight = '#00ff41';
  const dimColor = '#4a6a7a';
  const viseColor = '#1a1a2a';
  const viseStroke = '#3a3a5a';

  // Part dimensions relative to SVG
  const partX = w * 0.2;
  const partY = h * 0.15;
  const partW = w * 0.6;
  const partH = h * 0.5;

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="rounded border border-accent/20"
      style={{ background: bgColor }}
    >
      {/* Grid pattern */}
      <defs>
        <pattern id={`grid-${opNumber}`} width={w * 0.05} height={h * 0.05} patternUnits="userSpaceOnUse">
          <path d={`M ${w * 0.05} 0 L 0 0 0 ${h * 0.05}`} fill="none" stroke="#0d1520" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width={w} height={h} fill={`url(#grid-${opNumber})`} />

      {isCNC && (
        <>
          {/* Vise / fixture at bottom */}
          <rect
            x={partX - w * 0.03}
            y={partY + partH}
            width={partW + w * 0.06}
            height={h * 0.2}
            fill={viseColor}
            stroke={viseStroke}
            strokeWidth={isThumb ? 0.5 : 1}
            rx={isThumb ? 1 : 2}
          />
          {/* Vise jaw left */}
          <rect
            x={partX - w * 0.02}
            y={partY + partH * 0.5}
            width={w * 0.04}
            height={partH * 0.5 + h * 0.2}
            fill={viseColor}
            stroke={viseStroke}
            strokeWidth={isThumb ? 0.5 : 1}
          />
          {/* Vise jaw right */}
          <rect
            x={partX + partW - w * 0.02}
            y={partY + partH * 0.5}
            width={w * 0.04}
            height={partH * 0.5 + h * 0.2}
            fill={viseColor}
            stroke={viseStroke}
            strokeWidth={isThumb ? 0.5 : 1}
          />

          {/* Raw stock block */}
          <rect
            x={partX}
            y={partY}
            width={partW}
            height={partH}
            fill={stockColor}
            stroke={stockStroke}
            strokeWidth={isThumb ? 0.5 : 1}
          />
          {/* Crosshatch on raw stock */}
          {!isThumb && (
            <g opacity={0.15}>
              {Array.from({ length: 12 }).map((_, i) => (
                <line
                  key={`hatch-${i}`}
                  x1={partX + (i * partW) / 12}
                  y1={partY}
                  x2={partX + (i * partW) / 12 + partW / 6}
                  y2={partY + partH}
                  stroke={dimColor}
                  strokeWidth={0.5}
                />
              ))}
            </g>
          )}

          {/* Machined profile */}
          {(hasProfile || opIndex >= 1) && (
            <rect
              x={partX + partW * 0.05}
              y={partY + partH * 0.05}
              width={partW * 0.9}
              height={partH * 0.9}
              fill={machinedFill}
              stroke={machinedStroke}
              strokeWidth={isThumb ? 0.5 : 1}
              strokeDasharray={isThumb ? undefined : '4 2'}
            />
          )}

          {/* Face machined (top surface highlight) */}
          {(hasFace || opIndex >= 1) && (
            <line
              x1={partX + partW * 0.05}
              y1={partY + partH * 0.05}
              x2={partX + partW * 0.95}
              y2={partY + partH * 0.05}
              stroke={featureHighlight}
              strokeWidth={isThumb ? 1 : 2}
              opacity={0.8}
            />
          )}

          {/* Pocket */}
          {(hasPocket || opIndex >= 2) && (
            <>
              <rect
                x={partX + partW * 0.25}
                y={partY + partH * 0.25}
                width={partW * 0.5}
                height={partH * 0.5}
                fill={bgColor}
                stroke={featureHighlight}
                strokeWidth={isThumb ? 0.5 : 1.5}
              />
              {/* Pocket depth lines */}
              {!isThumb && (
                <>
                  <line
                    x1={partX + partW * 0.27}
                    y1={partY + partH * 0.27}
                    x2={partX + partW * 0.73}
                    y2={partY + partH * 0.27}
                    stroke={featureHighlight}
                    strokeWidth={0.5}
                    opacity={0.4}
                  />
                  <line
                    x1={partX + partW * 0.27}
                    y1={partY + partH * 0.73}
                    x2={partX + partW * 0.73}
                    y2={partY + partH * 0.73}
                    stroke={featureHighlight}
                    strokeWidth={0.5}
                    opacity={0.4}
                  />
                </>
              )}
            </>
          )}

          {/* Holes */}
          {(hasHoles || opIndex >= 2) && (
            <>
              {[
                [partX + partW * 0.15, partY + partH * 0.15],
                [partX + partW * 0.85, partY + partH * 0.15],
                [partX + partW * 0.85, partY + partH * 0.85],
                [partX + partW * 0.15, partY + partH * 0.85],
              ].map(([cx, cy], hi) => (
                <React.Fragment key={`hole-${hi}`}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isThumb ? 2 : 6}
                    fill={bgColor}
                    stroke={featureHighlight}
                    strokeWidth={isThumb ? 0.5 : 1}
                  />
                  {!isThumb && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={3}
                      fill="none"
                      stroke={featureHighlight}
                      strokeWidth={0.5}
                      opacity={0.5}
                    />
                  )}
                </React.Fragment>
              ))}
            </>
          )}

          {/* Slot */}
          {hasSlot && (
            <rect
              x={partX + partW * 0.1}
              y={partY + partH * 0.45}
              width={partW * 0.8}
              height={partH * 0.1}
              fill={bgColor}
              stroke={featureHighlight}
              strokeWidth={isThumb ? 0.5 : 1}
              rx={isThumb ? 1 : 3}
            />
          )}

          {/* Chamfers */}
          {(hasChamfer || opIndex >= 3) && (
            <>
              <line x1={partX + partW * 0.05} y1={partY + partH * 0.05} x2={partX + partW * 0.1} y2={partY + partH * 0.1} stroke={machinedStroke} strokeWidth={isThumb ? 0.5 : 1} />
              <line x1={partX + partW * 0.95} y1={partY + partH * 0.05} x2={partX + partW * 0.9} y2={partY + partH * 0.1} stroke={machinedStroke} strokeWidth={isThumb ? 0.5 : 1} />
              <line x1={partX + partW * 0.95} y1={partY + partH * 0.95} x2={partX + partW * 0.9} y2={partY + partH * 0.9} stroke={machinedStroke} strokeWidth={isThumb ? 0.5 : 1} />
              <line x1={partX + partW * 0.05} y1={partY + partH * 0.95} x2={partX + partW * 0.1} y2={partY + partH * 0.9} stroke={machinedStroke} strokeWidth={isThumb ? 0.5 : 1} />
            </>
          )}

          {/* Dimension lines (full size only) */}
          {!isThumb && (
            <>
              {/* Width dimension */}
              <line x1={partX} y1={h * 0.9} x2={partX + partW} y2={h * 0.9} stroke={dimColor} strokeWidth={0.5} />
              <line x1={partX} y1={h * 0.88} x2={partX} y2={h * 0.92} stroke={dimColor} strokeWidth={0.5} />
              <line x1={partX + partW} y1={h * 0.88} x2={partX + partW} y2={h * 0.92} stroke={dimColor} strokeWidth={0.5} />
              {/* Height dimension */}
              <line x1={w * 0.92} y1={partY} x2={w * 0.92} y2={partY + partH} stroke={dimColor} strokeWidth={0.5} />
              <line x1={w * 0.9} y1={partY} x2={w * 0.94} y2={partY} stroke={dimColor} strokeWidth={0.5} />
              <line x1={w * 0.9} y1={partY + partH} x2={w * 0.94} y2={partY + partH} stroke={dimColor} strokeWidth={0.5} />
            </>
          )}
        </>
      )}

      {/* Non-CNC operations */}
      {isDeburr && (
        <>
          <rect x={partX} y={partY} width={partW} height={partH} fill={machinedFill} stroke={machinedStroke} strokeWidth={isThumb ? 0.5 : 1} rx={isThumb ? 1 : 3} />
          {/* Deburr marks around edges */}
          {!isThumb && Array.from({ length: 8 }).map((_, i) => (
            <circle
              key={`deburr-${i}`}
              cx={partX + (i + 1) * partW / 9}
              cy={partY + partH * 0.02}
              r={2}
              fill={featureHighlight}
              opacity={0.6}
            />
          ))}
          <text x={w / 2} y={partY + partH + h * 0.15} textAnchor="middle" fill={featureHighlight} fontSize={isThumb ? 5 : 10} fontFamily="monospace">DEBURR</text>
        </>
      )}

      {isInspect && (
        <>
          <rect x={partX} y={partY} width={partW} height={partH} fill={machinedFill} stroke={machinedStroke} strokeWidth={isThumb ? 0.5 : 1} rx={isThumb ? 1 : 3} />
          {/* CMM probe indicator */}
          <line x1={w / 2} y1={partY - h * 0.05} x2={w / 2} y2={partY + partH * 0.3} stroke="#ff6b35" strokeWidth={isThumb ? 1 : 2} />
          <circle cx={w / 2} cy={partY + partH * 0.3} r={isThumb ? 2 : 4} fill="#ff6b35" />
          <text x={w / 2} y={partY + partH + h * 0.15} textAnchor="middle" fill="#ff6b35" fontSize={isThumb ? 5 : 10} fontFamily="monospace">CMM INSPECT</text>
        </>
      )}

      {isOutside && (
        <>
          <rect x={partX} y={partY} width={partW} height={partH} fill="#1a2a1a" stroke={featureHighlight} strokeWidth={isThumb ? 0.5 : 1} rx={isThumb ? 1 : 3} />
          {/* Surface treatment gradient */}
          <rect x={partX + 2} y={partY + 2} width={partW - 4} height={partH - 4} fill="none" stroke={featureHighlight} strokeWidth={isThumb ? 0.3 : 0.5} strokeDasharray="2 2" opacity={0.5} rx={isThumb ? 0 : 2} />
          <text x={w / 2} y={partY + partH + h * 0.15} textAnchor="middle" fill={featureHighlight} fontSize={isThumb ? 5 : 10} fontFamily="monospace">OUTSIDE PROC</text>
        </>
      )}

      {isWash && (
        <>
          <rect x={partX} y={partY} width={partW} height={partH} fill={machinedFill} stroke="#4488ff" strokeWidth={isThumb ? 0.5 : 1} rx={isThumb ? 1 : 3} />
          <text x={w / 2} y={partY + partH + h * 0.15} textAnchor="middle" fill="#4488ff" fontSize={isThumb ? 5 : 10} fontFamily="monospace">WASH</text>
        </>
      )}

      {/* OP label */}
      <text
        x={isThumb ? w * 0.5 : w * 0.05}
        y={isThumb ? h * 0.95 : h * 0.08}
        textAnchor={isThumb ? 'middle' : 'start'}
        fill={machinedStroke}
        fontSize={isThumb ? 6 : 11}
        fontFamily="monospace"
        fontWeight="bold"
      >
        {opNumber}
      </text>
    </svg>
  );
}

/**
 * Full-size stage drawing with annotations
 */
export function StageDrawingFull({
  opNumber,
  title,
  description,
  machinedFeatures = [],
  remainingStock,
  fixturing,
}: StageDrawingProps) {
  return (
    <div className="flex gap-6">
      <div className="shrink-0">
        <StageDrawing
          opNumber={opNumber}
          title={title}
          description={description}
          machinedFeatures={machinedFeatures}
          remainingStock={remainingStock}
          fixturing={fixturing}
          size="full"
        />
      </div>
      <div className="space-y-3 text-xs font-mono">
        <p className="text-sm font-bold text-accent">{title || `AFTER ${opNumber}`}</p>
        <p className="text-[11px] text-foreground/80">{description}</p>
        <div className="flex gap-6">
          <div>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Machined Features</p>
            <ul className="mt-1 space-y-0.5">
              {machinedFeatures.map((f, i) => (
                <li key={i} className="text-[10px] text-green-400">• {f}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Remaining Stock</p>
            <p className="text-[10px] mt-1 text-amber-400">{remainingStock || '—'}</p>
          </div>
          {fixturing && (
            <div>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Fixturing</p>
              <p className="text-[10px] mt-1">{fixturing}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { ExecutionSession, VitalSample } from "@/lib/store";
import { formatTime } from "@/lib/fmt";

/**
 * Paper-style intraoperative anaesthesia record.
 * Modeled on the traditional anaesthesia chart used in OR practice:
 *  - Time scale across top (5-min minor ticks, 30-min major)
 *  - Fluid input + output lanes
 *  - Numeric header rows (SpO₂, Temp, EtCO₂)
 *  - Main plot: BP (∇ sys / △ dia), HR (●), Pulse (○), RR (○)
 *  - Ventilation bar with I:E + VT
 *  - Event markers row (Induction, Intubation, Incision, Closure, Emergence, +drugs)
 */

export function AnaesthesiaRecordSheet({
  session,
  startedAt,
  endedAt,
  className,
}: {
  session: ExecutionSession;
  startedAt: number;
  endedAt?: number;
  className?: string;
}) {
  // ---------- Time scale ----------
  const now = endedAt || Date.now();
  // Round start to previous 30-min boundary
  const dStart = new Date(startedAt);
  dStart.setMinutes(Math.floor(dStart.getMinutes() / 30) * 30, 0, 0);
  const chartStart = dStart.getTime();
  // End at least 3h after start, or +30 min after "now"
  const minEnd = chartStart + 3 * 60 * 60 * 1000;
  const dEnd = new Date(Math.max(minEnd, now + 30 * 60 * 1000));
  dEnd.setMinutes(Math.ceil(dEnd.getMinutes() / 30) * 30, 0, 0);
  const chartEnd = dEnd.getTime();

  const totalMin = (chartEnd - chartStart) / 60000;
  const ticks5 = Math.floor(totalMin / 5);

  // ---------- Layout constants ----------
  const pxPer5Min = 22;
  const plotW = ticks5 * pxPer5Min;
  const labelW = 130;
  const totalW = labelW + plotW + 8;

  const rowH = {
    timeHeader: 22,
    fluidIn: 26,
    fluidOut: 22,
    numericHeader: 16, // each metric
    plot: 240,
    vent: 18,
    ieVt: 18,
    markers: 24,
  };

  const headerH = rowH.timeHeader;
  const fluidInH = rowH.fluidIn;
  const fluidOutH = rowH.fluidOut;
  const numericH = 3 * rowH.numericHeader; // SpO2 / Temp / EtCO2
  const plotH = rowH.plot;
  const ventH = rowH.vent;
  const ieVtH = rowH.ieVt;
  const markersH = rowH.markers;

  const totalH =
    headerH + fluidInH + fluidOutH + numericH + plotH + ventH + ieVtH + markersH;

  // Y offsets
  const yHeaderTop = 0;
  const yFluidIn = yHeaderTop + headerH;
  const yFluidOut = yFluidIn + fluidInH;
  const yNumeric = yFluidOut + fluidOutH;
  const yPlot = yNumeric + numericH;
  const yVent = yPlot + plotH;
  const yIeVt = yVent + ventH;
  const yMarkers = yIeVt + ieVtH;

  // Time → X
  const xOf = (t: number) =>
    labelW + ((t - chartStart) / (chartEnd - chartStart)) * plotW;

  // BP scale: 20-220 mmHg → maps to plotH
  const yBp = (mmhg: number) => yPlot + plotH - ((mmhg - 20) / 200) * plotH;
  // Temp scale: 26-40 °C
  const yTemp = (c: number) => yPlot + plotH - ((c - 26) / 14) * plotH;

  // Generate time labels every 30 min
  const timeMarkers: { t: number; major: boolean; label: string }[] = [];
  for (let m = 0; m <= totalMin; m += 5) {
    const t = chartStart + m * 60000;
    const major = m % 30 === 0;
    if (major) {
      const d = new Date(t);
      timeMarkers.push({
        t,
        major,
        label: `${String(d.getHours()).padStart(2, "0")}:${String(
          d.getMinutes()
        ).padStart(2, "0")}`,
      });
    } else {
      timeMarkers.push({ t, major: false, label: "" });
    }
  }

  // Sample vitals at 5-min intervals (snap-to-closest for plotting)
  const sampledVitals: VitalSample[] = [];
  for (let m = 0; m <= totalMin; m += 5) {
    const t = chartStart + m * 60000;
    if (t > now) break;
    // Find vitals sample closest to t (within 2.5 min)
    const closest = closestSample(session.vitals, t, 2.5 * 60000);
    if (closest) sampledVitals.push({ ...closest, at: t });
  }

  // ---------- Subgroup data ----------
  const fluids = [...session.fluidsIn].sort((a, b) => a.at - b.at);
  const outputs = [...session.fluidsOut].sort((a, b) => a.at - b.at);
  const events = session.events;
  const drugs = session.drugs;
  const vent = session.ventilation;

  // ---------- Render ----------
  return (
    <div className={`overflow-x-auto ${className || ""}`}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width={totalW}
        height={totalH}
        className="block bg-white"
        style={{ minWidth: totalW }}
      >
        {/* ---------- Background grid for plot area ---------- */}
        <rect x={labelW} y={yPlot} width={plotW} height={plotH} fill="#fafbfc" />
        {/* BP gridlines every 20 mmHg */}
        {Array.from({ length: 11 }).map((_, i) => {
          const v = 20 + i * 20;
          return (
            <g key={`bpg-${i}`}>
              <line
                x1={labelW}
                x2={labelW + plotW}
                y1={yBp(v)}
                y2={yBp(v)}
                stroke={i % 2 === 0 ? "#cbd5e1" : "#e2e8f0"}
                strokeWidth={i % 2 === 0 ? 0.6 : 0.4}
              />
              <text
                x={labelW - 4}
                y={yBp(v) + 3}
                fontSize="9"
                textAnchor="end"
                fill="#475569"
              >
                {v}
              </text>
              <text
                x={labelW + plotW + 4}
                y={yBp(v) + 3}
                fontSize="9"
                fill="#475569"
              >
                {Math.round(26 + (i * 14) / 10)}
              </text>
            </g>
          );
        })}

        {/* ---------- Time scale (top) ---------- */}
        <g>
          <line x1={labelW} x2={labelW + plotW} y1={headerH} y2={headerH} stroke="#475569" />
          {timeMarkers.map((tm, i) =>
            tm.major ? (
              <g key={i}>
                <line
                  x1={xOf(tm.t)}
                  x2={xOf(tm.t)}
                  y1={0}
                  y2={totalH - markersH}
                  stroke="#cbd5e1"
                  strokeWidth={0.6}
                />
                <text
                  x={xOf(tm.t)}
                  y={14}
                  fontSize="10"
                  textAnchor="middle"
                  fill="#0f172a"
                  fontWeight={600}
                >
                  {tm.label}
                </text>
              </g>
            ) : (
              <line
                key={i}
                x1={xOf(tm.t)}
                x2={xOf(tm.t)}
                y1={headerH - 4}
                y2={headerH}
                stroke="#94a3b8"
                strokeWidth={0.4}
              />
            )
          )}
        </g>

        {/* ---------- Lane labels (left column) ---------- */}
        <g fill="#0f172a">
          <SectionLabel x={4} y={yFluidIn + fluidInH / 2 + 3} text="Fluid In (ml)" />
          <SectionLabel x={4} y={yFluidOut + fluidOutH / 2 + 3} text="Output (ml)" />
          {[
            { label: "SpO₂ (%)", y: yNumeric + rowH.numericHeader / 2 + 3 },
            { label: "Temp (°C)", y: yNumeric + 1.5 * rowH.numericHeader + 3 },
            { label: "EtCO₂", y: yNumeric + 2.5 * rowH.numericHeader + 3 },
          ].map((r) => (
            <SectionLabel key={r.label} x={4} y={r.y} text={r.label} />
          ))}
          <SectionLabel x={4} y={yPlot + plotH / 2 - 6} text="BP mmHg" />
          <SectionLabel x={4} y={yPlot + plotH / 2 + 8} text="/ Temp °C" />
          <SectionLabel x={4} y={yVent + ventH / 2 + 3} text="Ventilation" />
          <SectionLabel x={4} y={yIeVt + ieVtH / 2 + 3} text="I:E / VT" />
          <SectionLabel x={4} y={yMarkers + markersH / 2 + 3} text="Markers" />
        </g>

        {/* ---------- Lane separators ---------- */}
        {[yFluidIn, yFluidOut, yNumeric, yPlot, yVent, yIeVt, yMarkers, totalH].map(
          (y) => (
            <line key={y} x1={0} x2={totalW} y1={y} y2={y} stroke="#e2e8f0" strokeWidth={0.5} />
          )
        )}
        <line x1={labelW} x2={labelW} y1={0} y2={totalH} stroke="#94a3b8" strokeWidth={0.6} />

        {/* ---------- Fluid input markers ---------- */}
        {fluids.map((f) => {
          const x = xOf(f.at);
          return (
            <g key={f.id}>
              <line x1={x} x2={x} y1={yFluidIn + 4} y2={yFluidIn + fluidInH - 6} stroke="#0284c7" strokeWidth={1.5} />
              <circle cx={x} cy={yFluidIn + 8} r={3} fill="#0284c7" />
              <text x={x} y={yFluidIn + fluidInH - 2} fontSize="9" textAnchor="middle" fill="#0c4a6e" fontWeight={600}>
                {f.volumeMl}
              </text>
              <title>{`${f.kind} ${f.volumeMl} ml at ${formatTime(f.at)}`}</title>
            </g>
          );
        })}

        {/* ---------- Output markers ---------- */}
        {outputs.map((o) => {
          const x = xOf(o.at);
          const color = o.kind === "BloodLoss" ? "#dc2626" : "#d97706";
          return (
            <g key={o.id}>
              <circle cx={x} cy={yFluidOut + 8} r={3} fill={color} />
              <text x={x} y={yFluidOut + fluidOutH - 2} fontSize="9" textAnchor="middle" fill={color} fontWeight={600}>
                {o.volumeMl}
              </text>
              <title>{`${o.kind} ${o.volumeMl} ml`}</title>
            </g>
          );
        })}

        {/* ---------- Numeric header values ---------- */}
        {sampledVitals.map((s) => {
          const x = xOf(s.at);
          return (
            <g key={`num-${s.at}`}>
              <text x={x} y={yNumeric + 12} fontSize="9" textAnchor="middle" fill="#0284c7">
                {Math.round(s.spo2)}
              </text>
              <text x={x} y={yNumeric + 12 + rowH.numericHeader} fontSize="9" textAnchor="middle" fill="#7c3aed">
                {s.temp.toFixed(1)}
              </text>
              <text x={x} y={yNumeric + 12 + 2 * rowH.numericHeader} fontSize="9" textAnchor="middle" fill="#0d9488">
                {Math.round(s.etco2)}
              </text>
            </g>
          );
        })}

        {/* ---------- Main plot: BP, HR, Pulse, RR ---------- */}
        {/* Connecting polylines */}
        <polyline
          points={sampledVitals.map((s) => `${xOf(s.at)},${yBp(s.sysBp)}`).join(" ")}
          fill="none"
          stroke="#dc2626"
          strokeWidth={1}
          opacity={0.6}
        />
        <polyline
          points={sampledVitals.map((s) => `${xOf(s.at)},${yBp(s.diaBp)}`).join(" ")}
          fill="none"
          stroke="#dc2626"
          strokeWidth={1}
          opacity={0.6}
        />
        <polyline
          points={sampledVitals.map((s) => `${xOf(s.at)},${yBp(s.hr)}`).join(" ")}
          fill="none"
          stroke="#16a34a"
          strokeWidth={1}
          opacity={0.6}
        />
        <polyline
          points={sampledVitals.map((s) => `${xOf(s.at)},${yTemp(s.temp)}`).join(" ")}
          fill="none"
          stroke="#7c3aed"
          strokeWidth={1}
          strokeDasharray="2 2"
          opacity={0.7}
        />

        {/* Symbols */}
        {sampledVitals.map((s, i) => {
          const x = xOf(s.at);
          return (
            <g key={`pt-${i}`}>
              {/* Sys ∇ */}
              <polygon
                points={`${x - 4},${yBp(s.sysBp) - 4} ${x + 4},${yBp(s.sysBp) - 4} ${x},${yBp(s.sysBp) + 3}`}
                fill="#dc2626"
                opacity={0.85}
              />
              {/* Dia △ */}
              <polygon
                points={`${x - 4},${yBp(s.diaBp) + 4} ${x + 4},${yBp(s.diaBp) + 4} ${x},${yBp(s.diaBp) - 3}`}
                fill="#dc2626"
                opacity={0.85}
              />
              {/* HR ● */}
              <circle cx={x} cy={yBp(s.hr)} r={2.5} fill="#16a34a" />
              {/* RR ○ near bottom of plot */}
              <circle cx={x} cy={yBp(s.rr + 22)} r={2} fill="#0d9488" opacity={0.7} />
            </g>
          );
        })}

        {/* ---------- "Now" line ---------- */}
        <line
          x1={xOf(now)}
          x2={xOf(now)}
          y1={headerH}
          y2={totalH - markersH}
          stroke="#0f766e"
          strokeWidth={1.2}
          strokeDasharray="4 3"
        />
        <text
          x={xOf(now)}
          y={headerH - 4}
          fontSize="9"
          textAnchor="middle"
          fill="#0f766e"
          fontWeight={700}
        >
          {endedAt ? "END" : "NOW"}
        </text>

        {/* ---------- Ventilation bar ---------- */}
        {vent.startedAt && (
          <g>
            <rect
              x={xOf(vent.startedAt)}
              y={yVent + 4}
              width={xOf(vent.endedAt || now) - xOf(vent.startedAt)}
              height={ventH - 8}
              fill="#dbeafe"
              stroke="#1e40af"
              strokeWidth={0.6}
            />
            {/* wavy line inside */}
            <WavyLine
              x1={xOf(vent.startedAt)}
              x2={xOf(vent.endedAt || now)}
              y={yVent + ventH / 2}
              color="#1e40af"
            />
          </g>
        )}

        {/* ---------- I:E + VT row text ---------- */}
        {vent.startedAt && (
          <g>
            <text
              x={xOf(vent.startedAt) + 4}
              y={yIeVt + ieVtH / 2 + 3}
              fontSize="10"
              fill="#1e40af"
              fontWeight={600}
            >
              I:E {vent.ieRatio} · VT {vent.tidalVolume} · RR {vent.rrSet} · FiO₂ {vent.fio2}%
            </text>
          </g>
        )}

        {/* ---------- Event markers row ---------- */}
        {events.map((e) => {
          const x = xOf(e.at);
          const cy = yMarkers + markersH / 2;
          const symbolMap: Record<string, string> = {
            Induction: "▲",
            Intubation: "⊖",
            Incision: "◆",
            Closure: "⊗",
            Emergence: "▼",
          };
          const colorMap: Record<string, string> = {
            Induction: "#7c3aed",
            Intubation: "#0284c7",
            Incision: "#dc2626",
            Closure: "#16a34a",
            Emergence: "#d97706",
          };
          return (
            <g key={e.id}>
              <line x1={x} x2={x} y1={headerH} y2={yMarkers + markersH} stroke={colorMap[e.kind]} strokeDasharray="2 3" opacity={0.45} strokeWidth={0.8} />
              <text x={x} y={cy + 5} fontSize="14" textAnchor="middle" fill={colorMap[e.kind]} fontWeight={700}>
                {symbolMap[e.kind]}
              </text>
              <text x={x} y={cy + 16} fontSize="8" textAnchor="middle" fill={colorMap[e.kind]}>
                {e.kind.slice(0, 3)}
              </text>
              <title>{`${e.kind} at ${formatTime(e.at)}${e.note ? " · " + e.note : ""}`}</title>
            </g>
          );
        })}

        {/* ---------- Drug markers (above plot, in numeric area) ---------- */}
        {drugs.map((d) => {
          const x = xOf(d.at);
          return (
            <g key={d.id}>
              <line x1={x} x2={x} y1={yNumeric - 2} y2={yPlot} stroke="#0284c7" strokeWidth={0.4} opacity={0.3} />
              <text x={x} y={yNumeric - 4} fontSize="8" fill="#0c4a6e" textAnchor="middle" fontWeight={600}>
                {d.drug.slice(0, 4)} {d.dose.split(" ")[0]}
              </text>
              <title>{`${d.drug} ${d.dose} (${d.route})`}</title>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[11px] px-2 pb-2 text-[var(--muted-foreground)]">
        <Legend symbol="∇" color="#dc2626" label="BP Sys" />
        <Legend symbol="△" color="#dc2626" label="BP Dia" />
        <Legend symbol="●" color="#16a34a" label="HR" />
        <Legend symbol="○" color="#0d9488" label="RR" />
        <Legend symbol="—" color="#7c3aed" label="Temp" />
        <Legend symbol="●" color="#0284c7" label="Fluid In" />
        <Legend symbol="●" color="#d97706" label="Output" />
        <Legend symbol="▲" color="#7c3aed" label="Induction" />
        <Legend symbol="⊖" color="#0284c7" label="Intubation" />
        <Legend symbol="◆" color="#dc2626" label="Incision" />
        <Legend symbol="⊗" color="#16a34a" label="Closure" />
        <Legend symbol="▼" color="#d97706" label="Emergence" />
      </div>
    </div>
  );
}

/* -------------------- Helpers -------------------- */

function SectionLabel({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <text x={x} y={y} fontSize="9" fill="#475569" fontWeight={600}>
      {text}
    </text>
  );
}

function Legend({ symbol, color, label }: { symbol: string; color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span style={{ color }} className="font-bold">
        {symbol}
      </span>
      {label}
    </span>
  );
}

function WavyLine({
  x1,
  x2,
  y,
  color,
}: {
  x1: number;
  x2: number;
  y: number;
  color: string;
}) {
  const width = x2 - x1;
  if (width < 4) return null;
  const cycles = Math.max(2, Math.floor(width / 14));
  const points: string[] = [];
  for (let i = 0; i <= cycles * 4; i++) {
    const t = i / (cycles * 4);
    const px = x1 + t * width;
    const py = y + Math.sin(t * Math.PI * 2 * cycles) * 3;
    points.push(`${px.toFixed(1)},${py.toFixed(1)}`);
  }
  return <polyline points={points.join(" ")} fill="none" stroke={color} strokeWidth={1} />;
}

function closestSample(
  vitals: VitalSample[],
  target: number,
  maxDeltaMs: number
): VitalSample | null {
  if (vitals.length === 0) return null;
  let best: VitalSample | null = null;
  let bestDelta = Infinity;
  for (const v of vitals) {
    const d = Math.abs(v.at - target);
    if (d < bestDelta) {
      bestDelta = d;
      best = v;
    }
  }
  if (!best || bestDelta > maxDeltaMs) return null;
  return best;
}

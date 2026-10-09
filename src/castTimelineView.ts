import type { ChroniclePanelSnapshotV1 } from "@emyrk/chronicle-panel-sdk/v1";
import {
  chooseTickStepMs,
  classColor,
  formatClock,
  lowerBound,
  spellHue,
  type CastTimelineEncounter,
  type CastTimelineLane,
} from "./castTimeline";
import { formatOffset } from "./firstCasts";

const LABEL_WIDTH = 132;
const AXIS_HEIGHT = 22;
const LANE_HEIGHT = 26;
const CHIP_HEIGHT = 18;
/** Chips are one global cooldown wide so a tight rotation tiles edge to edge. */
const GCD_SECONDS = 1.5;
const MIN_PX_PER_SECOND = 0.5;
const MAX_PX_PER_SECOND = 200;
const DEFAULT_PX_PER_SECOND = 16;
const ZOOM_STEP = 1.25;

export interface CastTimelineView {
  setEncounters(encounters: CastTimelineEncounter[]): void;
  setSnapshot(snapshot: ChroniclePanelSnapshotV1): void;
  destroy(): void;
}

interface Palette {
  background: string;
  foreground: string;
  muted: string;
  grid: string;
  stripe: string;
  light: boolean;
}

interface HoveredCast {
  lane: CastTimelineLane;
  index: number;
}

/**
 * Renders one swimlane per player on a single viewport-sized canvas. A spacer
 * element provides native scrolling; only lanes and casts inside the visible
 * window are drawn, so long fights never create per-cast DOM nodes.
 */
export function createCastTimelineView(container: HTMLElement, initialSnapshot: ChroniclePanelSnapshotV1): CastTimelineView {
  const document = container.ownerDocument;
  const view = document.defaultView!;
  let snapshot = initialSnapshot;
  let encounters: CastTimelineEncounter[] = [];
  let encounterId: string | null = null;
  let pxPerSecond = DEFAULT_PX_PER_SECOND;
  const hiddenSpells = new Set<string>();
  let hovered: HoveredCast | null = null;
  let palette: Palette | null = null;
  let frame = 0;

  container.innerHTML = `
    <header>
      <div>
        <strong>Cast Timeline</strong>
        <span class="timeline-summary"></span>
      </div>
      <div class="timeline-controls">
        <select class="timeline-encounter" aria-label="Encounter"></select>
        <button type="button" class="timeline-show-hidden" hidden></button>
        <button type="button" class="timeline-zoom-out" aria-label="Zoom out" title="Zoom out (Ctrl + wheel)">−</button>
        <button type="button" class="timeline-zoom-in" aria-label="Zoom in" title="Zoom in (Ctrl + wheel)">+</button>
        <button type="button" class="timeline-fit" title="Fit the whole fight">Fit</button>
      </div>
    </header>
    <div class="timeline-body">
      <canvas class="timeline-canvas" role="img"></canvas>
      <div class="timeline-scroll"><div class="timeline-spacer"></div></div>
      <div class="timeline-tooltip" role="tooltip" hidden></div>
      <div class="state" hidden></div>
    </div>
  `;
  const summary = container.querySelector<HTMLElement>(".timeline-summary")!;
  const select = container.querySelector<HTMLSelectElement>(".timeline-encounter")!;
  const showHidden = container.querySelector<HTMLButtonElement>(".timeline-show-hidden")!;
  const canvas = container.querySelector<HTMLCanvasElement>(".timeline-canvas")!;
  const scroller = container.querySelector<HTMLDivElement>(".timeline-scroll")!;
  const spacer = container.querySelector<HTMLDivElement>(".timeline-spacer")!;
  const tooltip = container.querySelector<HTMLDivElement>(".timeline-tooltip")!;
  const empty = container.querySelector<HTMLDivElement>(".state")!;
  const context = canvas.getContext("2d")!;

  function currentEncounter(): CastTimelineEncounter | null {
    return encounters.find((encounter) => encounter.encounterId === encounterId) ?? null;
  }

  function visibleLanes(encounter: CastTimelineEncounter): CastTimelineLane[] {
    const selected = snapshot.selection.playerIds;
    if (selected.length === 0) return encounter.lanes;
    const ids = new Set(selected);
    return encounter.lanes.filter((lane) => ids.has(lane.playerId));
  }

  /** Encounter-relative zero point plus the drawable time domain. */
  function domain(encounter: CastTimelineEncounter): { zeroMs: number; startMs: number; endMs: number } {
    const info = snapshot.instance.encounters.find((candidate) => candidate.id === encounter.encounterId);
    const parsedStart = info ? Date.parse(info.startTime) : Number.NaN;
    const parsedEnd = info ? Date.parse(info.endTime) : Number.NaN;
    const zeroMs = Number.isFinite(parsedStart) ? parsedStart : encounter.firstTimestampMs;
    let firstCast = zeroMs;
    for (const lane of encounter.lanes) if (lane.atMs.length > 0) firstCast = Math.min(firstCast, lane.atMs[0]!);
    const endMs = Math.max(encounter.lastTimestampMs, Number.isFinite(parsedEnd) ? parsedEnd : 0);
    return { zeroMs, startMs: Math.min(zeroMs, firstCast), endMs: Math.max(endMs, zeroMs + 1000) };
  }

  function chipWidth(): number {
    return Math.min(40, Math.max(3, GCD_SECONDS * pxPerSecond - 2));
  }

  function readPalette(): Palette {
    const style = view.getComputedStyle(container);
    const light = snapshot.theme.mode === "light";
    const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
    const foreground = read("--foreground", light ? "#18181b" : "#f4f4f5");
    return {
      background: read("--card", light ? "#ffffff" : "#111318"),
      foreground,
      muted: read("--muted-foreground", light ? "#71717a" : "#a1a1aa"),
      grid: light ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.07)",
      stripe: light ? "rgba(0, 0, 0, 0.025)" : "rgba(255, 255, 255, 0.025)",
      light,
    };
  }

  function scheduleDraw(): void {
    if (frame) return;
    frame = view.requestAnimationFrame(() => {
      frame = 0;
      draw();
    });
  }

  function layout(): void {
    const encounter = currentEncounter();
    if (!encounter) {
      spacer.style.width = "0px";
      spacer.style.height = "0px";
      return;
    }
    const { startMs, endMs } = domain(encounter);
    spacer.style.width = `${Math.ceil(LABEL_WIDTH + ((endMs - startMs) / 1000) * pxPerSecond + chipWidth() + 24)}px`;
    spacer.style.height = `${AXIS_HEIGHT + visibleLanes(encounter).length * LANE_HEIGHT}px`;
  }

  function renderControls(): void {
    const encounter = currentEncounter();
    select.hidden = encounters.length < 2;
    select.replaceChildren(...encounters.map((candidate) => {
      const option = document.createElement("option");
      option.value = candidate.encounterId;
      option.textContent = snapshot.instance.encounters.find((info) => info.id === candidate.encounterId)?.name ?? candidate.encounterId;
      option.selected = candidate.encounterId === encounterId;
      return option;
    }));
    showHidden.hidden = hiddenSpells.size === 0;
    showHidden.textContent = `Show ${hiddenSpells.size} hidden`;
    showHidden.title = "Restore spells hidden by clicking their casts";

    if (!encounter) {
      summary.textContent = "";
      empty.textContent = "No player casts in the selected encounters.";
      empty.hidden = false;
      canvas.setAttribute("aria-label", "No player casts");
      return;
    }
    const lanes = visibleLanes(encounter);
    const { startMs, endMs } = domain(encounter);
    summary.textContent = `${lanes.length} player(s) · ${formatClock(endMs - startMs)}`;
    empty.textContent = "No casts from the selected players in this encounter.";
    empty.hidden = lanes.length > 0;
    canvas.setAttribute("aria-label", `Cast timeline for ${lanes.length} player(s)`);
  }

  function draw(): void {
    const width = scroller.clientWidth;
    const height = scroller.clientHeight;
    const ratio = view.devicePixelRatio || 1;
    if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }
    palette ??= readPalette();
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.fillStyle = palette.background;
    context.fillRect(0, 0, width, height);

    const encounter = currentEncounter();
    if (!encounter || width === 0 || height === 0) return;
    const lanes = visibleLanes(encounter);
    const { zeroMs, startMs } = domain(encounter);
    const scrollLeft = scroller.scrollLeft;
    const scrollTop = scroller.scrollTop;
    const chip = chipWidth();
    const xFor = (atMs: number) => LABEL_WIDTH + ((atMs - startMs) / 1000) * pxPerSecond - scrollLeft;
    const timeAt = (x: number) => startMs + ((x - LABEL_WIDTH + scrollLeft) / pxPerSecond) * 1000;
    const windowStartMs = timeAt(LABEL_WIDTH - chip);
    const windowEndMs = timeAt(width);
    const cutoff = snapshot.sync.enabled ? snapshot.sync.timestampMs : null;

    // Grid lines aligned to encounter-relative ticks.
    const stepMs = chooseTickStepMs(pxPerSecond);
    const firstTick = zeroMs + Math.ceil((timeAt(LABEL_WIDTH) - zeroMs) / stepMs) * stepMs;
    context.fillStyle = palette.grid;
    for (let tick = firstTick; tick <= windowEndMs; tick += stepMs) {
      context.fillRect(Math.round(xFor(tick)), AXIS_HEIGHT, 1, height - AXIS_HEIGHT);
    }

    const firstLane = Math.max(0, Math.floor(scrollTop / LANE_HEIGHT));
    const lastLane = Math.min(lanes.length - 1, Math.floor((scrollTop + height - AXIS_HEIGHT) / LANE_HEIGHT));
    const chipTop = (LANE_HEIGHT - CHIP_HEIGHT) / 2;
    context.font = "600 10px ui-sans-serif, system-ui, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    for (let laneIndex = firstLane; laneIndex <= lastLane; laneIndex += 1) {
      const lane = lanes[laneIndex]!;
      const y = AXIS_HEIGHT + laneIndex * LANE_HEIGHT - scrollTop;
      if (laneIndex % 2 === 1) {
        context.fillStyle = palette.stripe;
        context.fillRect(LABEL_WIDTH, y, width - LABEL_WIDTH, LANE_HEIGHT);
      }
      for (let i = lowerBound(lane.atMs, windowStartMs); i < lane.atMs.length && lane.atMs[i]! <= windowEndMs; i += 1) {
        const spell = encounter.spells[lane.spell[i]!]!;
        if (hiddenSpells.has(spell.key)) continue;
        const x = xFor(lane.atMs[i]!);
        const isHovered = hovered?.lane === lane && hovered.index === i;
        context.globalAlpha = cutoff != null && lane.atMs[i]! > cutoff ? 0.25 : 1;
        context.fillStyle = `hsl(${spellHue(spell.key).toFixed(0)} 62% ${palette.light ? 46 : 58}%)`;
        context.beginPath();
        context.roundRect(x, y + chipTop, chip, CHIP_HEIGHT, Math.min(4, chip / 2));
        context.fill();
        if (isHovered) {
          context.strokeStyle = palette.foreground;
          context.lineWidth = 2;
          context.stroke();
        }
        if (chip >= 16) {
          context.fillStyle = palette.light ? "#ffffff" : "#0b0b0f";
          context.fillText(spell.label, x + chip / 2, y + LANE_HEIGHT / 2 + 0.5, chip - 2);
        }
      }
      context.globalAlpha = 1;
    }

    // Replay cursor.
    if (cutoff != null) {
      const x = xFor(cutoff);
      if (x >= LABEL_WIDTH && x <= width) {
        context.fillStyle = "#f87171";
        context.fillRect(Math.round(x) - 1, AXIS_HEIGHT, 2, height - AXIS_HEIGHT);
      }
    }

    // Sticky time axis.
    context.fillStyle = palette.background;
    context.fillRect(0, 0, width, AXIS_HEIGHT);
    context.fillStyle = palette.grid;
    context.fillRect(0, AXIS_HEIGHT - 1, width, 1);
    context.fillStyle = palette.muted;
    context.textAlign = "left";
    context.font = "11px ui-sans-serif, system-ui, sans-serif";
    for (let tick = firstTick; tick <= windowEndMs; tick += stepMs) {
      const x = xFor(tick);
      context.fillRect(Math.round(x), AXIS_HEIGHT - 5, 1, 4);
      context.fillText(formatClock(tick - zeroMs), x + 3, AXIS_HEIGHT / 2);
    }

    // Sticky player labels.
    context.fillStyle = palette.background;
    context.fillRect(0, AXIS_HEIGHT, LABEL_WIDTH, height - AXIS_HEIGHT);
    context.fillStyle = palette.grid;
    context.fillRect(LABEL_WIDTH - 1, 0, 1, height);
    context.font = "600 12px ui-sans-serif, system-ui, sans-serif";
    for (let laneIndex = firstLane; laneIndex <= lastLane; laneIndex += 1) {
      const lane = lanes[laneIndex]!;
      const y = AXIS_HEIGHT + laneIndex * LANE_HEIGHT - scrollTop + LANE_HEIGHT / 2;
      if (y < AXIS_HEIGHT) continue;
      let color = classColor(lane.playerClass) ?? palette.foreground;
      // Priest and rogue colors are unreadable on light backgrounds.
      if (palette.light && (color === "#ffffff" || color === "#fff468")) color = palette.foreground;
      context.fillStyle = color;
      context.fillText(lane.name, 10, y, LABEL_WIDTH - 20);
    }
    context.fillStyle = palette.background;
    context.fillRect(0, 0, LABEL_WIDTH - 1, AXIS_HEIGHT - 1);
  }

  function hitTest(event: MouseEvent): HoveredCast | null {
    const encounter = currentEncounter();
    if (!encounter) return null;
    const rect = scroller.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (x < LABEL_WIDTH || y < AXIS_HEIGHT || x > scroller.clientWidth || y > scroller.clientHeight) return null;
    const laneOffset = y - AXIS_HEIGHT + scroller.scrollTop;
    const lane = visibleLanes(encounter)[Math.floor(laneOffset / LANE_HEIGHT)];
    if (!lane) return null;
    const withinLane = laneOffset % LANE_HEIGHT;
    const chipTop = (LANE_HEIGHT - CHIP_HEIGHT) / 2;
    if (withinLane < chipTop || withinLane > chipTop + CHIP_HEIGHT) return null;
    const { startMs } = domain(encounter);
    const atMs = startMs + ((x - LABEL_WIDTH + scroller.scrollLeft) / pxPerSecond) * 1000;
    const chipMs = (chipWidth() / pxPerSecond) * 1000;
    // Later casts are drawn on top, so prefer the latest chip under the pointer.
    for (let i = lowerBound(lane.atMs, atMs + 0.001) - 1; i >= 0 && lane.atMs[i]! >= atMs - chipMs; i -= 1) {
      if (!hiddenSpells.has(encounter.spells[lane.spell[i]!]!.key)) return { lane, index: i };
    }
    return null;
  }

  function showTooltip(event: MouseEvent, hit: HoveredCast): void {
    const encounter = currentEncounter()!;
    const spell = encounter.spells[hit.lane.spell[hit.index]!]!;
    const targetId = hit.lane.target[hit.index];
    const targetName = targetId
      ? snapshot.instance.units[targetId]?.name ?? snapshot.instance.players[targetId]?.name ?? targetId
      : null;
    tooltip.replaceChildren();
    const title = document.createElement("strong");
    title.textContent = spell.name;
    const detail = document.createElement("span");
    detail.textContent = `${hit.lane.name} · ${formatOffset(hit.lane.atMs[hit.index]! - domain(encounter).zeroMs)}${targetName ? ` → ${targetName}` : ""}`;
    const hint = document.createElement("span");
    hint.className = "timeline-tooltip-hint";
    hint.textContent = `${spell.id ? `Spell ${spell.id} · ` : ""}click to hide`;
    tooltip.append(title, detail, hint);
    tooltip.hidden = false;
    const body = scroller.parentElement!.getBoundingClientRect();
    const left = Math.min(event.clientX - body.left + 12, body.width - tooltip.offsetWidth - 4);
    const top = event.clientY - body.top + 16 + tooltip.offsetHeight > body.height
      ? event.clientY - body.top - tooltip.offsetHeight - 8
      : event.clientY - body.top + 16;
    tooltip.style.left = `${Math.max(4, left)}px`;
    tooltip.style.top = `${Math.max(4, top)}px`;
  }

  function hideTooltip(): void {
    tooltip.hidden = true;
    if (hovered) {
      hovered = null;
      scheduleDraw();
    }
  }

  /** Zooms while keeping the time under `anchorX` fixed on screen. */
  function zoomTo(next: number, anchorX = LABEL_WIDTH + (scroller.clientWidth - LABEL_WIDTH) / 2): void {
    const clamped = Math.min(MAX_PX_PER_SECOND, Math.max(MIN_PX_PER_SECOND, next));
    if (clamped === pxPerSecond) return;
    const anchorSeconds = (anchorX - LABEL_WIDTH + scroller.scrollLeft) / pxPerSecond;
    pxPerSecond = clamped;
    layout();
    scroller.scrollLeft = anchorSeconds * pxPerSecond - (anchorX - LABEL_WIDTH);
    hideTooltip();
    scheduleDraw();
  }

  function fit(): void {
    const encounter = currentEncounter();
    if (!encounter) return;
    const { startMs, endMs } = domain(encounter);
    const available = scroller.clientWidth - LABEL_WIDTH - 16;
    if (available <= 0) return;
    pxPerSecond = Math.min(MAX_PX_PER_SECOND, Math.max(MIN_PX_PER_SECOND, available / ((endMs - startMs) / 1000)));
    layout();
    scroller.scrollLeft = 0;
    scheduleDraw();
  }

  /** While replay plays, keep the cursor on screen without fighting manual scrolling when paused. */
  function followReplay(): void {
    const encounter = currentEncounter();
    const cutoff = snapshot.sync.timestampMs;
    if (!encounter || !snapshot.sync.enabled || !snapshot.sync.playing || cutoff == null) return;
    const { startMs } = domain(encounter);
    const x = LABEL_WIDTH + ((cutoff - startMs) / 1000) * pxPerSecond - scroller.scrollLeft;
    const track = scroller.clientWidth - LABEL_WIDTH;
    if (x < LABEL_WIDTH || x > scroller.clientWidth - 24) {
      scroller.scrollLeft = ((cutoff - startMs) / 1000) * pxPerSecond - track * 0.25;
    }
  }

  const onScroll = () => {
    hideTooltip();
    scheduleDraw();
  };
  const onPointerMove = (event: MouseEvent) => {
    const hit = hitTest(event);
    if (hit?.lane !== hovered?.lane || hit?.index !== hovered?.index) {
      hovered = hit;
      scheduleDraw();
    }
    scroller.style.cursor = hit ? "pointer" : "";
    if (hit) showTooltip(event, hit);
    else tooltip.hidden = true;
  };
  const onClick = (event: MouseEvent) => {
    const hit = hitTest(event);
    const encounter = currentEncounter();
    if (!hit || !encounter) return;
    hiddenSpells.add(encounter.spells[hit.lane.spell[hit.index]!]!.key);
    hideTooltip();
    renderControls();
    scheduleDraw();
  };
  const onWheel = (event: WheelEvent) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    zoomTo(pxPerSecond * (event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP), event.clientX - scroller.getBoundingClientRect().left);
  };
  const onSelect = () => {
    encounterId = select.value;
    hideTooltip();
    renderControls();
    layout();
    scroller.scrollLeft = 0;
    scroller.scrollTop = 0;
    scheduleDraw();
  };
  const onShowHidden = () => {
    hiddenSpells.clear();
    renderControls();
    scheduleDraw();
  };
  const onZoomIn = () => zoomTo(pxPerSecond * ZOOM_STEP);
  const onZoomOut = () => zoomTo(pxPerSecond / ZOOM_STEP);

  scroller.addEventListener("scroll", onScroll, { passive: true });
  scroller.addEventListener("mousemove", onPointerMove);
  scroller.addEventListener("mouseleave", hideTooltip);
  scroller.addEventListener("click", onClick);
  scroller.addEventListener("wheel", onWheel, { passive: false });
  select.addEventListener("change", onSelect);
  showHidden.addEventListener("click", onShowHidden);
  const zoomIn = container.querySelector<HTMLButtonElement>(".timeline-zoom-in")!;
  const zoomOut = container.querySelector<HTMLButtonElement>(".timeline-zoom-out")!;
  const fitButton = container.querySelector<HTMLButtonElement>(".timeline-fit")!;
  zoomIn.addEventListener("click", onZoomIn);
  zoomOut.addEventListener("click", onZoomOut);
  fitButton.addEventListener("click", fit);
  const resizeObserver = new view.ResizeObserver(() => scheduleDraw());
  resizeObserver.observe(scroller);

  renderControls();

  return {
    setEncounters(next) {
      encounters = next;
      if (!encounters.some((encounter) => encounter.encounterId === encounterId)) {
        encounterId = encounters[0]?.encounterId ?? null;
        scroller.scrollLeft = 0;
        scroller.scrollTop = 0;
      }
      hovered = null;
      renderControls();
      layout();
      scheduleDraw();
    },
    setSnapshot(next) {
      const themeChanged = next.theme.mode !== snapshot.theme.mode;
      const playersChanged = next.selection.playerIds.join("\0") !== snapshot.selection.playerIds.join("\0");
      snapshot = next;
      if (themeChanged) palette = null;
      if (playersChanged) {
        hideTooltip();
        renderControls();
        layout();
      }
      followReplay();
      scheduleDraw();
    },
    destroy() {
      if (frame) view.cancelAnimationFrame(frame);
      frame = 0;
      resizeObserver.disconnect();
      scroller.removeEventListener("scroll", onScroll);
      scroller.removeEventListener("mousemove", onPointerMove);
      scroller.removeEventListener("mouseleave", hideTooltip);
      scroller.removeEventListener("click", onClick);
      scroller.removeEventListener("wheel", onWheel);
      select.removeEventListener("change", onSelect);
      showHidden.removeEventListener("click", onShowHidden);
      zoomIn.removeEventListener("click", onZoomIn);
      zoomOut.removeEventListener("click", onZoomOut);
      fitButton.removeEventListener("click", fit);
      encounters = [];
      hovered = null;
      container.replaceChildren();
    },
  };
}

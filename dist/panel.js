// src/time.ts
function formatElapsedTime(elapsedMs) {
  const safeElapsedMs = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : 0;
  const totalSeconds = Math.floor(safeElapsedMs / 1e3);
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

// node_modules/.pnpm/@emyrk+chronicle-panel-sdk@0.2.0_@bufbuild+protobuf@2.16.0/node_modules/@emyrk/chronicle-panel-sdk/dist/v1/protobuf/chronicle_pb.js
var School;
(function(School2) {
  School2[School2["Unknown"] = 0] = "Unknown";
  School2[School2["None"] = 1] = "None";
  School2[School2["Physical"] = 2] = "Physical";
  School2[School2["Holy"] = 3] = "Holy";
  School2[School2["Fire"] = 4] = "Fire";
  School2[School2["Nature"] = 5] = "Nature";
  School2[School2["Frost"] = 6] = "Frost";
  School2[School2["Shadow"] = 7] = "Shadow";
  School2[School2["Arcane"] = 8] = "Arcane";
})(School || (School = {}));
var CastAction;
(function(CastAction2) {
  CastAction2[CastAction2["ActionUnknown"] = 0] = "ActionUnknown";
  CastAction2[CastAction2["ActionCasts"] = 1] = "ActionCasts";
  CastAction2[CastAction2["ActionBeginsToCast"] = 2] = "ActionBeginsToCast";
  CastAction2[CastAction2["ActionChannels"] = 3] = "ActionChannels";
  CastAction2[CastAction2["ActionFailsCasting"] = 4] = "ActionFailsCasting";
})(CastAction || (CastAction = {}));
var AuraApplication;
(function(AuraApplication2) {
  AuraApplication2[AuraApplication2["ApplicationUnknown"] = 0] = "ApplicationUnknown";
  AuraApplication2[AuraApplication2["ApplicationGains"] = 1] = "ApplicationGains";
  AuraApplication2[AuraApplication2["ApplicationFades"] = 2] = "ApplicationFades";
  AuraApplication2[AuraApplication2["ApplicationRemoved"] = 3] = "ApplicationRemoved";
})(AuraApplication || (AuraApplication = {}));
var AuraState;
(function(AuraState2) {
  AuraState2[AuraState2["StateUnknown"] = 0] = "StateUnknown";
  AuraState2[AuraState2["StateAdded"] = 1] = "StateAdded";
  AuraState2[AuraState2["StateRemoved"] = 2] = "StateRemoved";
  AuraState2[AuraState2["StateModified"] = 3] = "StateModified";
})(AuraState || (AuraState = {}));
var AuraTransition;
(function(AuraTransition2) {
  AuraTransition2[AuraTransition2["TransitionUnknown"] = 0] = "TransitionUnknown";
  AuraTransition2[AuraTransition2["TransitionApplied"] = 1] = "TransitionApplied";
  AuraTransition2[AuraTransition2["TransitionRefreshed"] = 2] = "TransitionRefreshed";
  AuraTransition2[AuraTransition2["TransitionStackChanged"] = 3] = "TransitionStackChanged";
  AuraTransition2[AuraTransition2["TransitionRemoved"] = 4] = "TransitionRemoved";
})(AuraTransition || (AuraTransition = {}));
var DispelType;
(function(DispelType2) {
  DispelType2[DispelType2["DispelTypeNone"] = 0] = "DispelTypeNone";
  DispelType2[DispelType2["DispelTypeMagic"] = 1] = "DispelTypeMagic";
  DispelType2[DispelType2["DispelTypeCurse"] = 2] = "DispelTypeCurse";
  DispelType2[DispelType2["DispelTypeDisease"] = 3] = "DispelTypeDisease";
  DispelType2[DispelType2["DispelTypePoison"] = 4] = "DispelTypePoison";
  DispelType2[DispelType2["DispelTypeStealth"] = 5] = "DispelTypeStealth";
  DispelType2[DispelType2["DispelTypeInvisibility"] = 6] = "DispelTypeInvisibility";
})(DispelType || (DispelType = {}));
var EvidenceKind;
(function(EvidenceKind2) {
  EvidenceKind2[EvidenceKind2["EvidenceUnknown"] = 0] = "EvidenceUnknown";
  EvidenceKind2[EvidenceKind2["EvidenceDirectItem"] = 1] = "EvidenceDirectItem";
  EvidenceKind2[EvidenceKind2["EvidenceCast"] = 2] = "EvidenceCast";
  EvidenceKind2[EvidenceKind2["EvidenceAura"] = 3] = "EvidenceAura";
  EvidenceKind2[EvidenceKind2["EvidenceHeal"] = 4] = "EvidenceHeal";
  EvidenceKind2[EvidenceKind2["EvidenceResource"] = 5] = "EvidenceResource";
  EvidenceKind2[EvidenceKind2["EvidenceDamage"] = 6] = "EvidenceDamage";
  EvidenceKind2[EvidenceKind2["EvidenceActiveAtPull"] = 7] = "EvidenceActiveAtPull";
  EvidenceKind2[EvidenceKind2["EvidenceCooldown"] = 8] = "EvidenceCooldown";
  EvidenceKind2[EvidenceKind2["EvidencePreCombat"] = 9] = "EvidencePreCombat";
})(EvidenceKind || (EvidenceKind = {}));
var EvidenceConfidence;
(function(EvidenceConfidence2) {
  EvidenceConfidence2[EvidenceConfidence2["ConfidenceUnknown"] = 0] = "ConfidenceUnknown";
  EvidenceConfidence2[EvidenceConfidence2["ConfidenceDirect"] = 1] = "ConfidenceDirect";
  EvidenceConfidence2[EvidenceConfidence2["ConfidenceEffectDerived"] = 2] = "ConfidenceEffectDerived";
  EvidenceConfidence2[EvidenceConfidence2["ConfidenceAmbiguous"] = 3] = "ConfidenceAmbiguous";
  EvidenceConfidence2[EvidenceConfidence2["ConfidenceInferred"] = 4] = "ConfidenceInferred";
})(EvidenceConfidence || (EvidenceConfidence = {}));

// src/consumes.ts
var CONSUME_CATEGORIES = [
  { key: "flask", label: "Flasks" },
  { key: "potion", label: "Potions" },
  { key: "elixir", label: "Elixirs" },
  { key: "other", label: "Other" }
];
var CATEGORY_ORDER = new Map(CONSUME_CATEGORIES.map((category, index) => [category.key, index]));

// src/castTimeline.ts
function lowerBound(values, target) {
  let low = 0;
  let high = values.length;
  while (low < high) {
    const mid = low + high >>> 1;
    if (values[mid] < target) low = mid + 1;
    else high = mid;
  }
  return low;
}
function spellHue(key) {
  let hash = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) * 137.508 % 360;
}
var TICK_STEPS_SECONDS = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 1800];
function chooseTickStepMs(pxPerSecond, minSpacingPx = 64) {
  const step = TICK_STEPS_SECONDS.find((seconds) => seconds * pxPerSecond >= minSpacingPx);
  return (step ?? TICK_STEPS_SECONDS[TICK_STEPS_SECONDS.length - 1]) * 1e3;
}
function formatClock(offsetMs) {
  const safe = Number.isFinite(offsetMs) ? Math.round(offsetMs / 1e3) : 0;
  const abs = Math.abs(safe);
  return `${safe < 0 ? "-" : ""}${Math.floor(abs / 60)}:${String(abs % 60).padStart(2, "0")}`;
}
var CLASS_COLORS = {
  deathknight: "#c41e3a",
  druid: "#ff7c0a",
  hunter: "#aad372",
  mage: "#3fc7eb",
  paladin: "#f48cba",
  priest: "#ffffff",
  rogue: "#fff468",
  shaman: "#0070dd",
  warlock: "#8788ee",
  warrior: "#c69b6d"
};
function classColor(playerClass) {
  if (!playerClass) return null;
  return CLASS_COLORS[playerClass.toLowerCase().replace(/[^a-z]/g, "")] ?? null;
}

// src/firstCasts.ts
function formatOffset(offsetMs) {
  const safe = Number.isFinite(offsetMs) ? Math.round(offsetMs) : 0;
  const abs = Math.abs(safe);
  const minutes = Math.floor(abs / 6e4);
  const seconds = (abs % 6e4 / 1e3).toFixed(3).padStart(6, "0");
  return `${safe < 0 ? "-" : ""}${minutes}:${seconds}`;
}

// src/castTimelineView.ts
var LABEL_WIDTH = 132;
var AXIS_HEIGHT = 22;
var LANE_HEIGHT = 26;
var CHIP_HEIGHT = 18;
var GCD_SECONDS = 1.5;
var MIN_PX_PER_SECOND = 0.5;
var MAX_PX_PER_SECOND = 200;
var DEFAULT_PX_PER_SECOND = 16;
var ZOOM_STEP = 1.25;
function createCastTimelineView(container, initialSnapshot) {
  const document = container.ownerDocument;
  const view = document.defaultView;
  let snapshot = initialSnapshot;
  let encounters = [];
  let encounterId = null;
  let pxPerSecond = DEFAULT_PX_PER_SECOND;
  const hiddenSpells = /* @__PURE__ */ new Set();
  let hovered = null;
  let palette = null;
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
        <button type="button" class="timeline-zoom-out" aria-label="Zoom out" title="Zoom out (Ctrl + wheel)">\u2212</button>
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
  const summary = container.querySelector(".timeline-summary");
  const select = container.querySelector(".timeline-encounter");
  const showHidden = container.querySelector(".timeline-show-hidden");
  const canvas = container.querySelector(".timeline-canvas");
  const scroller = container.querySelector(".timeline-scroll");
  const spacer = container.querySelector(".timeline-spacer");
  const tooltip = container.querySelector(".timeline-tooltip");
  const empty = container.querySelector(".state");
  const context = canvas.getContext("2d");
  function currentEncounter() {
    return encounters.find((encounter) => encounter.encounterId === encounterId) ?? null;
  }
  function visibleLanes(encounter) {
    const selected = snapshot.selection.playerIds;
    if (selected.length === 0) return encounter.lanes;
    const ids = new Set(selected);
    return encounter.lanes.filter((lane) => ids.has(lane.playerId));
  }
  function domain(encounter) {
    const info = snapshot.instance.encounters.find((candidate) => candidate.id === encounter.encounterId);
    const parsedStart = info ? Date.parse(info.startTime) : Number.NaN;
    const parsedEnd = info ? Date.parse(info.endTime) : Number.NaN;
    const zeroMs = Number.isFinite(parsedStart) ? parsedStart : encounter.firstTimestampMs;
    let firstCast = zeroMs;
    for (const lane of encounter.lanes) if (lane.atMs.length > 0) firstCast = Math.min(firstCast, lane.atMs[0]);
    const endMs = Math.max(encounter.lastTimestampMs, Number.isFinite(parsedEnd) ? parsedEnd : 0);
    return { zeroMs, startMs: Math.min(zeroMs, firstCast), endMs: Math.max(endMs, zeroMs + 1e3) };
  }
  function chipWidth() {
    return Math.min(40, Math.max(3, GCD_SECONDS * pxPerSecond - 2));
  }
  function readPalette() {
    const style = view.getComputedStyle(container);
    const light = snapshot.theme.mode === "light";
    const read = (name, fallback) => style.getPropertyValue(name).trim() || fallback;
    const foreground = read("--foreground", light ? "#18181b" : "#f4f4f5");
    return {
      background: read("--card", light ? "#ffffff" : "#111318"),
      foreground,
      muted: read("--muted-foreground", light ? "#71717a" : "#a1a1aa"),
      grid: light ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.07)",
      stripe: light ? "rgba(0, 0, 0, 0.025)" : "rgba(255, 255, 255, 0.025)",
      light
    };
  }
  function scheduleDraw() {
    if (frame) return;
    frame = view.requestAnimationFrame(() => {
      frame = 0;
      draw();
    });
  }
  function layout() {
    const encounter = currentEncounter();
    if (!encounter) {
      spacer.style.width = "0px";
      spacer.style.height = "0px";
      return;
    }
    const { startMs, endMs } = domain(encounter);
    spacer.style.width = `${Math.ceil(LABEL_WIDTH + (endMs - startMs) / 1e3 * pxPerSecond + chipWidth() + 24)}px`;
    spacer.style.height = `${AXIS_HEIGHT + visibleLanes(encounter).length * LANE_HEIGHT}px`;
  }
  function renderControls() {
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
    summary.textContent = `${lanes.length} player(s) \xB7 ${formatClock(endMs - startMs)}`;
    empty.textContent = "No casts from the selected players in this encounter.";
    empty.hidden = lanes.length > 0;
    canvas.setAttribute("aria-label", `Cast timeline for ${lanes.length} player(s)`);
  }
  function draw() {
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
    const xFor = (atMs) => LABEL_WIDTH + (atMs - startMs) / 1e3 * pxPerSecond - scrollLeft;
    const timeAt = (x) => startMs + (x - LABEL_WIDTH + scrollLeft) / pxPerSecond * 1e3;
    const windowStartMs = timeAt(LABEL_WIDTH - chip);
    const windowEndMs = timeAt(width);
    const cutoff = snapshot.sync.enabled ? snapshot.sync.timestampMs : null;
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
      const lane = lanes[laneIndex];
      const y = AXIS_HEIGHT + laneIndex * LANE_HEIGHT - scrollTop;
      if (laneIndex % 2 === 1) {
        context.fillStyle = palette.stripe;
        context.fillRect(LABEL_WIDTH, y, width - LABEL_WIDTH, LANE_HEIGHT);
      }
      for (let i = lowerBound(lane.atMs, windowStartMs); i < lane.atMs.length && lane.atMs[i] <= windowEndMs; i += 1) {
        const spell = encounter.spells[lane.spell[i]];
        if (hiddenSpells.has(spell.key)) continue;
        const x = xFor(lane.atMs[i]);
        const isHovered = hovered?.lane === lane && hovered.index === i;
        context.globalAlpha = cutoff != null && lane.atMs[i] > cutoff ? 0.25 : 1;
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
    if (cutoff != null) {
      const x = xFor(cutoff);
      if (x >= LABEL_WIDTH && x <= width) {
        context.fillStyle = "#f87171";
        context.fillRect(Math.round(x) - 1, AXIS_HEIGHT, 2, height - AXIS_HEIGHT);
      }
    }
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
    context.fillStyle = palette.background;
    context.fillRect(0, AXIS_HEIGHT, LABEL_WIDTH, height - AXIS_HEIGHT);
    context.fillStyle = palette.grid;
    context.fillRect(LABEL_WIDTH - 1, 0, 1, height);
    context.font = "600 12px ui-sans-serif, system-ui, sans-serif";
    for (let laneIndex = firstLane; laneIndex <= lastLane; laneIndex += 1) {
      const lane = lanes[laneIndex];
      const y = AXIS_HEIGHT + laneIndex * LANE_HEIGHT - scrollTop + LANE_HEIGHT / 2;
      if (y < AXIS_HEIGHT) continue;
      let color = classColor(lane.playerClass) ?? palette.foreground;
      if (palette.light && (color === "#ffffff" || color === "#fff468")) color = palette.foreground;
      context.fillStyle = color;
      context.fillText(lane.name, 10, y, LABEL_WIDTH - 20);
    }
    context.fillStyle = palette.background;
    context.fillRect(0, 0, LABEL_WIDTH - 1, AXIS_HEIGHT - 1);
  }
  function hitTest(event) {
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
    const atMs = startMs + (x - LABEL_WIDTH + scroller.scrollLeft) / pxPerSecond * 1e3;
    const chipMs = chipWidth() / pxPerSecond * 1e3;
    for (let i = lowerBound(lane.atMs, atMs + 1e-3) - 1; i >= 0 && lane.atMs[i] >= atMs - chipMs; i -= 1) {
      if (!hiddenSpells.has(encounter.spells[lane.spell[i]].key)) return { lane, index: i };
    }
    return null;
  }
  function showTooltip(event, hit) {
    const encounter = currentEncounter();
    const spell = encounter.spells[hit.lane.spell[hit.index]];
    const targetId = hit.lane.target[hit.index];
    const targetName = targetId ? snapshot.instance.units[targetId]?.name ?? snapshot.instance.players[targetId]?.name ?? targetId : null;
    tooltip.replaceChildren();
    const title = document.createElement("strong");
    title.textContent = spell.name;
    const detail = document.createElement("span");
    detail.textContent = `${hit.lane.name} \xB7 ${formatOffset(hit.lane.atMs[hit.index] - domain(encounter).zeroMs)}${targetName ? ` \u2192 ${targetName}` : ""}`;
    const hint = document.createElement("span");
    hint.className = "timeline-tooltip-hint";
    hint.textContent = `${spell.id ? `Spell ${spell.id} \xB7 ` : ""}click to hide`;
    tooltip.append(title, detail, hint);
    tooltip.hidden = false;
    const body = scroller.parentElement.getBoundingClientRect();
    const left = Math.min(event.clientX - body.left + 12, body.width - tooltip.offsetWidth - 4);
    const top = event.clientY - body.top + 16 + tooltip.offsetHeight > body.height ? event.clientY - body.top - tooltip.offsetHeight - 8 : event.clientY - body.top + 16;
    tooltip.style.left = `${Math.max(4, left)}px`;
    tooltip.style.top = `${Math.max(4, top)}px`;
  }
  function hideTooltip() {
    tooltip.hidden = true;
    if (hovered) {
      hovered = null;
      scheduleDraw();
    }
  }
  function zoomTo(next, anchorX = LABEL_WIDTH + (scroller.clientWidth - LABEL_WIDTH) / 2) {
    const clamped = Math.min(MAX_PX_PER_SECOND, Math.max(MIN_PX_PER_SECOND, next));
    if (clamped === pxPerSecond) return;
    const anchorSeconds = (anchorX - LABEL_WIDTH + scroller.scrollLeft) / pxPerSecond;
    pxPerSecond = clamped;
    layout();
    scroller.scrollLeft = anchorSeconds * pxPerSecond - (anchorX - LABEL_WIDTH);
    hideTooltip();
    scheduleDraw();
  }
  function fit() {
    const encounter = currentEncounter();
    if (!encounter) return;
    const { startMs, endMs } = domain(encounter);
    const available = scroller.clientWidth - LABEL_WIDTH - 16;
    if (available <= 0) return;
    pxPerSecond = Math.min(MAX_PX_PER_SECOND, Math.max(MIN_PX_PER_SECOND, available / ((endMs - startMs) / 1e3)));
    layout();
    scroller.scrollLeft = 0;
    scheduleDraw();
  }
  function followReplay() {
    const encounter = currentEncounter();
    const cutoff = snapshot.sync.timestampMs;
    if (!encounter || !snapshot.sync.enabled || !snapshot.sync.playing || cutoff == null) return;
    const { startMs } = domain(encounter);
    const x = LABEL_WIDTH + (cutoff - startMs) / 1e3 * pxPerSecond - scroller.scrollLeft;
    const track = scroller.clientWidth - LABEL_WIDTH;
    if (x < LABEL_WIDTH || x > scroller.clientWidth - 24) {
      scroller.scrollLeft = (cutoff - startMs) / 1e3 * pxPerSecond - track * 0.25;
    }
  }
  const onScroll = () => {
    hideTooltip();
    scheduleDraw();
  };
  const onPointerMove = (event) => {
    const hit = hitTest(event);
    if (hit?.lane !== hovered?.lane || hit?.index !== hovered?.index) {
      hovered = hit;
      scheduleDraw();
    }
    scroller.style.cursor = hit ? "pointer" : "";
    if (hit) showTooltip(event, hit);
    else tooltip.hidden = true;
  };
  const onClick = (event) => {
    const hit = hitTest(event);
    const encounter = currentEncounter();
    if (!hit || !encounter) return;
    hiddenSpells.add(encounter.spells[hit.lane.spell[hit.index]].key);
    hideTooltip();
    renderControls();
    scheduleDraw();
  };
  const onWheel = (event) => {
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
  const zoomIn = container.querySelector(".timeline-zoom-in");
  const zoomOut = container.querySelector(".timeline-zoom-out");
  const fitButton = container.querySelector(".timeline-fit");
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
    }
  };
}

// src/gearRarity.ts
var GEAR_RARITIES = [
  { quality: 0, key: "poor", label: "Poor", shortLabel: "Gray" },
  { quality: 1, key: "common", label: "Common", shortLabel: "White" },
  { quality: 2, key: "uncommon", label: "Uncommon", shortLabel: "Green" },
  { quality: 3, key: "rare", label: "Rare", shortLabel: "Blue" },
  { quality: 4, key: "epic", label: "Epic", shortLabel: "Purple" },
  { quality: 5, key: "legendary", label: "Legendary", shortLabel: "Orange" },
  { quality: 6, key: "artifact", label: "Artifact", shortLabel: "Artifact" }
];
function sortGearRarityRows(rows, key, direction) {
  const multiplier = direction === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    if (key === "name") {
      const byName = a.name.localeCompare(b.name);
      if (byName !== 0) return byName * multiplier;
    } else {
      const difference = a.counts[key] - b.counts[key];
      if (difference !== 0) return difference * multiplier;
    }
    return a.name.localeCompare(b.name) || a.guid.localeCompare(b.guid);
  });
}

// node_modules/.pnpm/@emyrk+chronicle-panel-sdk@0.2.0_@bufbuild+protobuf@2.16.0/node_modules/@emyrk/chronicle-panel-sdk/dist/v1/contracts.js
var CUSTOM_PANEL_MAX_BREAKOUTS = 8;
var CUSTOM_PANEL_BREAKOUT_TITLE_MAX_LENGTH = 100;

// src/panel.ts
function formatNumber(value) {
  return new Intl.NumberFormat().format(value);
}
function parseGearSort(option) {
  const match = option?.match(/^gear-rarity:(name|poor|common|uncommon|rare|epic|legendary|artifact|unknown):(asc|desc)$/);
  if (!match) return { key: "epic", direction: "desc" };
  return { key: match[1], direction: match[2] };
}
async function mountPanel(request) {
  const { panelId, root, api } = request;
  const document = root.host.ownerDocument;
  let snapshot = request.snapshot;
  let damageRows = [];
  const damageBreakouts = /* @__PURE__ */ new Map();
  let gearRows = [];
  let gearSort = parseGearSort(snapshot.panel.option);
  let consumeRows = [];
  let castRows = [];
  let firstCastEncounters = [];
  let castTimeline = null;
  let destroyed = false;
  const app = document.createElement("div");
  app.className = "chronicle-example";
  root.append(app);
  const worker = api.workers.create();
  const streamType = panelId === "damage-summary" || panelId === "first-casts" ? "damage" : panelId === "gear-rarity" ? "combatant_info" : panelId === "consumables" ? "consume" : "spell_go";
  function renderError(message) {
    castTimeline?.destroy();
    castTimeline = null;
    app.innerHTML = "";
    const error = document.createElement("div");
    error.className = "state error";
    error.textContent = message;
    app.append(error);
  }
  function renderDamageBreakout(playerId, handle) {
    const row = damageRows.find((candidate) => candidate.playerId === playerId);
    handle.root.querySelector(".damage-breakout")?.remove();
    const breakout = document.createElement("div");
    breakout.className = "damage-breakout";
    if (!row || row.breakdown.length === 0) {
      breakout.innerHTML = '<div class="state">No damage from this player in the selected encounters.</div>';
      handle.root.append(breakout);
      return;
    }
    const total = document.createElement("div");
    total.className = "damage-breakout-total";
    total.textContent = `${formatNumber(row.amount)} total damage`;
    const table = document.createElement("div");
    table.setAttribute("role", "table");
    table.setAttribute("aria-label", `${row.name} damage breakdown`);
    table.innerHTML = '<div class="damage-breakout-row damage-breakout-heading"><span>Source</span><span>Ability</span><span>Damage</span></div>';
    for (const detail of row.breakdown) {
      const detailRow = document.createElement("div");
      detailRow.className = "damage-breakout-row";
      detailRow.innerHTML = '<span class="actor"></span><span class="ability"></span><span class="value"></span>';
      detailRow.querySelector(".actor").textContent = detail.actorName;
      detailRow.querySelector(".ability").textContent = detail.abilityName;
      detailRow.querySelector(".value").textContent = formatNumber(detail.amount);
      table.append(detailRow);
    }
    breakout.append(total, table);
    handle.root.append(breakout);
  }
  function openDamageBreakout(row, event) {
    for (const [playerId, handle2] of damageBreakouts) {
      if (!handle2.root.host.isConnected) damageBreakouts.delete(playerId);
    }
    if (damageBreakouts.has(row.playerId)) return;
    if (damageBreakouts.size >= CUSTOM_PANEL_MAX_BREAKOUTS) {
      const [oldestId, oldest] = damageBreakouts.entries().next().value;
      oldest.close();
      damageBreakouts.delete(oldestId);
    }
    let handle;
    try {
      handle = api.breakouts.open({
        title: `${row.name} damage`.slice(0, CUSTOM_PANEL_BREAKOUT_TITLE_MAX_LENGTH),
        initialPosition: { x: event.clientX + 12, y: event.clientY + 12 },
        initialSize: { width: 440, height: 320 }
      });
    } catch (error) {
      renderError(error instanceof Error ? error.message : String(error));
      return;
    }
    damageBreakouts.set(row.playerId, handle);
    renderDamageBreakout(row.playerId, handle);
  }
  function renderDamage() {
    app.innerHTML = `
      <header>
        <div>
          <strong>Damage Summary</strong>
          <span>${snapshot.selection.encounterIds.length} encounter(s)</span>
        </div>
        <span class="badge">click a player for details</span>
      </header>
      <div class="table" role="table" aria-label="Damage by player"></div>
    `;
    for (const [playerId, handle] of damageBreakouts) renderDamageBreakout(playerId, handle);
    const table = app.querySelector(".table");
    if (damageRows.length === 0) {
      table.innerHTML = '<div class="state">No player damage in the selected encounters.</div>';
      return;
    }
    const max = damageRows[0]?.amount || 1;
    for (const [index, row] of damageRows.entries()) {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "damage-row damage-row-button";
      item.setAttribute("aria-haspopup", "dialog");
      item.innerHTML = `
        <span class="rank">${index + 1}</span>
        <span class="name"></span>
        <span class="bar"><i style="width:${Math.max(2, row.amount / max * 100)}%"></i></span>
        <span class="value">${formatNumber(row.amount)}</span>
      `;
      item.querySelector(".name").textContent = row.name;
      item.addEventListener("click", (event) => openDamageBreakout(row, event));
      table.append(item);
    }
  }
  function renderGear() {
    const rows = sortGearRarityRows(gearRows, gearSort.key, gearSort.direction);
    app.innerHTML = `
      <header>
        <div>
          <strong>Gear Rarity</strong>
          <span>${rows.length} player(s)</span>
        </div>
        <span class="badge">click a column to sort</span>
      </header>
      <div class="gear-table" role="table" aria-label="Equipped item rarity by player"></div>
    `;
    const table = app.querySelector(".gear-table");
    if (rows.length === 0) {
      table.innerHTML = '<div class="state">No combatant gear snapshots were found.</div>';
      return;
    }
    const columns = [
      { key: "name", label: "Player" },
      ...GEAR_RARITIES.map((rarity) => ({ key: rarity.key, label: rarity.shortLabel, className: `rarity-${rarity.key}` })),
      { key: "unknown", label: "?", className: "rarity-unknown" }
    ];
    const header = document.createElement("div");
    header.className = "gear-row gear-heading";
    for (const column of columns) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = column.className ?? "";
      button.textContent = `${column.label}${gearSort.key === column.key ? gearSort.direction === "desc" ? " \u2193" : " \u2191" : ""}`;
      button.title = column.key === "name" ? "Sort by player name" : `Sort by ${column.label} item count`;
      button.addEventListener("click", () => {
        gearSort = {
          key: column.key,
          direction: gearSort.key === column.key ? gearSort.direction === "desc" ? "asc" : "desc" : column.key === "name" ? "asc" : "desc"
        };
        api.panel.setOption(`gear-rarity:${gearSort.key}:${gearSort.direction}`);
        renderGear();
      });
      header.append(button);
    }
    table.append(header);
    for (const row of rows) {
      const item = document.createElement("div");
      item.className = "gear-row";
      const player = document.createElement("span");
      player.className = "gear-player";
      player.textContent = row.name;
      player.title = row.heroClass || row.guid;
      item.append(player);
      for (const rarity of GEAR_RARITIES) {
        const count = document.createElement("span");
        count.className = `gear-count rarity-${rarity.key}`;
        count.textContent = String(row.counts[rarity.key]);
        count.title = `${row.name}: ${row.counts[rarity.key]} ${rarity.label}`;
        item.append(count);
      }
      const unknown = document.createElement("span");
      unknown.className = "gear-count rarity-unknown";
      unknown.textContent = String(row.counts.unknown);
      unknown.title = `${row.name}: ${row.counts.unknown} unknown`;
      item.append(unknown);
      table.append(item);
    }
  }
  function renderConsumables() {
    app.innerHTML = `
      <header>
        <div>
          <strong>Consumables</strong>
          <span>${snapshot.selection.encounterIds.length} encounter(s) \xB7 ${consumeRows.length} player(s)</span>
        </div>
        <span class="badge">uses per player</span>
      </header>
      <div class="consume-table" role="table" aria-label="Consumables used by player"></div>
    `;
    const table = app.querySelector(".consume-table");
    if (consumeRows.length === 0) {
      table.innerHTML = '<div class="state">No consumable uses in the selected encounters.</div>';
      return;
    }
    const header = document.createElement("div");
    header.className = "consume-row consume-heading";
    header.setAttribute("role", "row");
    for (const label of ["Player", ...CONSUME_CATEGORIES.map((category) => category.label), "Total"]) {
      const cell = document.createElement("span");
      cell.setAttribute("role", "columnheader");
      cell.textContent = label;
      header.append(cell);
    }
    table.append(header);
    for (const row of consumeRows) {
      const item = document.createElement("div");
      item.className = "consume-row";
      item.setAttribute("role", "row");
      const player = document.createElement("span");
      player.className = "consume-player";
      player.textContent = row.name;
      player.title = row.heroClass || row.playerId;
      item.append(player);
      for (const category of CONSUME_CATEGORIES) {
        const count = document.createElement("span");
        count.className = `consume-count consume-${category.key}${row.counts[category.key] === 0 ? " zero" : ""}`;
        count.textContent = String(row.counts[category.key]);
        item.append(count);
      }
      const total = document.createElement("span");
      total.className = "consume-count consume-total";
      total.textContent = String(row.total);
      item.append(total);
      const items = document.createElement("div");
      items.className = "consume-items";
      for (const consumable of row.items) {
        const chip = document.createElement("span");
        chip.className = `consume-chip consume-${consumable.category}`;
        chip.textContent = `${consumable.name} \xD7${consumable.count}`;
        chip.title = consumable.ambiguous ? `${consumable.name}: exact item could not be determined` : `${row.name}: ${consumable.count} \xD7 ${consumable.name}`;
        if (consumable.ambiguous) chip.classList.add("ambiguous");
        items.append(chip);
      }
      item.append(items);
      table.append(item);
    }
  }
  function renderCasts() {
    const cutoff = snapshot.sync.enabled ? snapshot.sync.timestampMs : null;
    const visible = cutoff == null ? castRows : castRows.filter((row) => row.atMs <= cutoff);
    const rows = visible.slice(-100).reverse();
    app.innerHTML = `
      <header>
        <div>
          <strong>Replay Casts</strong>
          <span>${snapshot.sync.enabled ? "following replay" : "full encounter"}</span>
        </div>
        <span class="badge ${snapshot.sync.playing ? "live" : ""}">${snapshot.sync.playing ? "playing" : "paused"}</span>
      </header>
      <div class="cast-list" role="log" aria-live="polite"></div>
    `;
    const list = app.querySelector(".cast-list");
    if (rows.length === 0) {
      list.innerHTML = '<div class="state">No casts have occurred at this replay position.</div>';
      return;
    }
    for (const row of rows) {
      const item = document.createElement("div");
      item.className = "cast-row";
      item.innerHTML = `
        <time>${formatElapsedTime(row.elapsedMs)}</time>
        <span class="caster"></span>
        <span class="spell"></span>
        <span class="target"></span>
      `;
      item.querySelector(".caster").textContent = row.casterName;
      item.querySelector(".spell").textContent = row.spellName;
      item.querySelector(".target").textContent = row.target ? `\u2192 ${snapshot.instance.units[row.target]?.name ?? row.target}` : "";
      list.append(item);
    }
  }
  function renderFirstCasts() {
    const cutoff = snapshot.sync.enabled ? snapshot.sync.timestampMs : null;
    const encountersById = new Map(snapshot.instance.encounters.map((encounter) => [encounter.id, encounter]));
    app.innerHTML = `
      <header>
        <div>
          <strong>First Casts</strong>
          <span>${firstCastEncounters.length} encounter(s)</span>
        </div>
        <span class="badge">first damage or heal</span>
      </header>
      <div class="first-cast-list" role="table" aria-label="First effective cast by player"></div>
    `;
    const list = app.querySelector(".first-cast-list");
    if (firstCastEncounters.length === 0) {
      list.innerHTML = '<div class="state">No player damage or healing in the selected encounters.</div>';
      return;
    }
    for (const encounter of firstCastEncounters) {
      const info = encountersById.get(encounter.encounterId);
      const parsedStart = info ? Date.parse(info.startTime) : Number.NaN;
      const startMs = Number.isFinite(parsedStart) ? parsedStart : encounter.firstTimestampMs;
      const heading = document.createElement("div");
      heading.className = "first-cast-encounter";
      heading.setAttribute("role", "rowgroup");
      heading.textContent = `${info?.name ?? encounter.encounterId} \xB7 ${encounter.rows.length} player(s)`;
      list.append(heading);
      for (const [index, row] of encounter.rows.entries()) {
        const item = document.createElement("div");
        item.className = `first-cast-row${cutoff != null && row.atMs > cutoff ? " pending" : ""}`;
        item.setAttribute("role", "row");
        item.innerHTML = `
          <span class="rank">${index + 1}</span>
          <time></time>
          <span class="caster"></span>
          <span class="spell"></span>
          <span class="target"></span>
        `;
        const time = item.querySelector("time");
        time.textContent = formatOffset(row.atMs - startMs);
        time.dateTime = new Date(row.atMs).toISOString();
        time.title = new Date(row.atMs).toLocaleTimeString(void 0, { hour12: false, fractionalSecondDigits: 3 });
        item.querySelector(".caster").textContent = row.name;
        const spell = item.querySelector(".spell");
        spell.textContent = row.spellName;
        spell.classList.add(row.kind);
        spell.title = `${row.kind === "heal" ? "Heal" : "Damage"}${row.spellId ? ` \xB7 spell ${row.spellId}` : ""}`;
        item.querySelector(".target").textContent = row.target ? `\u2192 ${snapshot.instance.units[row.target]?.name ?? snapshot.instance.players[row.target]?.name ?? row.target}` : "";
        list.append(item);
      }
    }
  }
  function render() {
    if (panelId === "damage-summary") renderDamage();
    else if (panelId === "first-casts") renderFirstCasts();
    else if (panelId === "gear-rarity") renderGear();
    else if (panelId === "consumables") renderConsumables();
    else renderCasts();
  }
  worker.onmessage = (event) => {
    if (destroyed) return;
    if (event.data?.type === "consume-item-ids") {
      const requestId = event.data.requestId;
      void api.gameData.getItemMetadata(event.data.itemIds).then((items) => {
        if (!destroyed) worker.postMessage({ type: "item-metadata", requestId, items });
      }).catch(() => {
      });
      return;
    }
    if (event.data?.type === "gear-item-ids") {
      const requestId = event.data.requestId;
      void api.gameData.getItemMetadata(event.data.itemIds).then((items) => {
        if (!destroyed) worker.postMessage({ type: "item-metadata", requestId, items });
      }).catch((error) => {
        if (!destroyed && error instanceof DOMException && error.name === "AbortError") return;
        if (!destroyed) renderError(error instanceof Error ? error.message : String(error));
      });
      return;
    }
    if (event.data?.type === "damage-result") damageRows = event.data.rows;
    if (event.data?.type === "first-casts-result") firstCastEncounters = event.data.encounters;
    if (event.data?.type === "cast-timeline-result") {
      castTimeline ??= createCastTimelineView(app, snapshot);
      castTimeline.setEncounters(event.data.encounters);
      return;
    }
    if (event.data?.type === "casts-result") castRows = event.data.rows;
    if (event.data?.type === "consumables-result") consumeRows = event.data.rows;
    if (event.data?.type === "gear-rarity-result") gearRows = event.data.rows;
    render();
  };
  worker.onerror = (event) => renderError(`Plugin worker failed: ${event.message}`);
  app.innerHTML = '<div class="state">Loading Chronicle event stream\u2026</div>';
  try {
    const [stream, classificationStream, healStream] = await Promise.all([
      api.events.getStream(streamType),
      panelId === "damage-summary" ? api.events.getStream("unit_classification") : Promise.resolve(null),
      panelId === "first-casts" ? api.events.getStream("heal") : Promise.resolve(null)
    ]);
    if (api.lifecycle.signal.aborted || destroyed) return { destroy() {
    } };
    const transfer = [stream.data];
    if (classificationStream) transfer.push(classificationStream.data);
    if (healStream) transfer.push(healStream.data);
    worker.postMessage(
      {
        type: "init",
        panelId,
        streamType,
        data: stream.data,
        classificationData: classificationStream?.data,
        healData: healStream?.data,
        selectedEncounterIds: snapshot.selection.encounterIds,
        players: snapshot.instance.players,
        units: snapshot.instance.units,
        sync: { enabled: snapshot.sync.enabled, timestampMs: snapshot.sync.timestampMs }
      },
      transfer
    );
  } catch (error) {
    renderError(error instanceof Error ? error.message : String(error));
  }
  return {
    update(next) {
      snapshot = next;
      worker.postMessage({
        type: "update",
        selectedEncounterIds: next.selection.encounterIds,
        sync: { enabled: next.sync.enabled, timestampMs: next.sync.timestampMs }
      });
      if (panelId === "gear-rarity") {
        gearSort = parseGearSort(next.panel.option);
        renderGear();
      } else if (panelId === "consumables") renderConsumables();
      else if (panelId === "replay-casts") renderCasts();
      else if (panelId === "first-casts") renderFirstCasts();
      else if (panelId === "cast-timeline") castTimeline?.setSnapshot(next);
    },
    destroy() {
      destroyed = true;
      for (const handle of damageBreakouts.values()) handle.close();
      damageBreakouts.clear();
      castTimeline?.destroy();
      castTimeline = null;
      worker.postMessage({ type: "dispose" });
      worker.terminate();
      app.remove();
    }
  };
}
var plugin = {
  apiVersion: 1,
  mount: mountPanel
};
var panel_default = plugin;
export {
  panel_default as default
};
//# sourceMappingURL=panel.js.map

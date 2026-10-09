import type { EncounterPayload } from "@emyrk/chronicle-panel-sdk/v1/events";
import type { SpellGo } from "@emyrk/chronicle-panel-sdk/v1/protobuf";

export interface CastTimelinePlayer {
  name: string;
  class?: string;
  class_name?: string;
}

export interface CastTimelineSpell {
  id: number | null;
  name: string;
  /** Stable identity across encounters, used for colors and hiding. */
  key: string;
  /** Short chip label, unique within the encounter where possible. */
  label: string;
}

/**
 * One player's casts in one encounter, stored as parallel arrays so large
 * fights stay compact when posted from the worker.
 */
export interface CastTimelineLane {
  playerId: string;
  name: string;
  playerClass: string | null;
  /** Absolute cast timestamps in ascending order. */
  atMs: number[];
  /** Index into the encounter's `spells` table for each cast. */
  spell: number[];
  /** Target GUID for each cast, or an empty string. */
  target: string[];
}

export interface CastTimelineEncounter {
  encounterId: string;
  firstTimestampMs: number;
  lastTimestampMs: number;
  spells: CastTimelineSpell[];
  lanes: CastTimelineLane[];
}

interface PendingCast {
  atMs: number;
  index: number;
  spell: number;
  target: string;
}

interface EncounterState {
  firstTimestampMs: number;
  lastTimestampMs: number;
  spells: CastTimelineSpell[];
  spellIndex: Map<string, number>;
  casts: Map<string, PendingCast[]>;
}

function spellFor(cast: SpellGo): CastTimelineSpell {
  const id = cast.spellData?.id || null;
  const name = cast.spellData?.name || (cast.itemID ? `Item ${cast.itemID}` : "Unknown spell");
  return { id, name, key: id != null ? `id:${id}` : `name:${name}`, label: abbreviateSpell(name) };
}

/**
 * Groups successful player casts (`spell_go`) by encounter and player. Pet
 * and guardian casts are excluded because a rotation belongs to the player.
 * Lanes are ordered by class, then name, so same-class rotations sit together.
 */
export function buildCastTimelines(
  payloads: EncounterPayload<SpellGo>[],
  players: Record<string, CastTimelinePlayer>,
): CastTimelineEncounter[] {
  const encounters = new Map<string, EncounterState>();

  for (const payload of payloads) {
    let encounter = encounters.get(payload.encounterId);
    if (!encounter) {
      encounter = {
        firstTimestampMs: payload.firstTimestampMs,
        lastTimestampMs: payload.firstTimestampMs,
        spells: [],
        spellIndex: new Map(),
        casts: new Map(),
      };
      encounters.set(payload.encounterId, encounter);
    }
    encounter.firstTimestampMs = Math.min(encounter.firstTimestampMs, payload.firstTimestampMs);

    for (const cast of payload.events) {
      const atMs = payload.firstTimestampMs + Number(cast.meta?.offsetMilli ?? 0n);
      encounter.lastTimestampMs = Math.max(encounter.lastTimestampMs, atMs);
      // Synthetic events were not cast in the log.
      if (cast.meta?.isSynthetic) continue;
      if (!cast.caster || !players[cast.caster]) continue;

      const spell = spellFor(cast);
      let spellIndex = encounter.spellIndex.get(spell.key);
      if (spellIndex === undefined) {
        spellIndex = encounter.spells.length;
        encounter.spells.push(spell);
        encounter.spellIndex.set(spell.key, spellIndex);
      }

      let casts = encounter.casts.get(cast.caster);
      if (!casts) {
        casts = [];
        encounter.casts.set(cast.caster, casts);
      }
      casts.push({ atMs, index: cast.meta?.index ?? 0, spell: spellIndex, target: cast.target ?? "" });
    }
  }

  return [...encounters.entries()]
    .map(([encounterId, encounter]) => ({
      encounterId,
      firstTimestampMs: encounter.firstTimestampMs,
      lastTimestampMs: encounter.lastTimestampMs,
      spells: disambiguateLabels(encounter.spells),
      lanes: [...encounter.casts.entries()]
        .map(([playerId, casts]): CastTimelineLane => {
          casts.sort((a, b) => a.atMs - b.atMs || a.index - b.index);
          const player = players[playerId]!;
          return {
            playerId,
            name: player.name,
            playerClass: player.class_name || player.class || null,
            atMs: casts.map((cast) => cast.atMs),
            spell: casts.map((cast) => cast.spell),
            target: casts.map((cast) => cast.target),
          };
        })
        .sort((a, b) => (a.playerClass ?? "~").localeCompare(b.playerClass ?? "~") || a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.firstTimestampMs - b.firstTimestampMs);
}

/** First index whose value is `>= target` in an ascending array. */
export function lowerBound(values: readonly number[], target: number): number {
  let low = 0;
  let high = values.length;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (values[mid]! < target) low = mid + 1;
    else high = mid;
  }
  return low;
}

/** Deterministic hue for a spell so it keeps one color across players and fights. */
export function spellHue(key: string): number {
  let hash = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  // Golden-angle spacing spreads neighbouring hashes around the wheel.
  return ((hash >>> 0) * 137.508) % 360;
}

/** Short chip label: initials of multi-word names, else the first two letters. */
export function abbreviateSpell(name: string): string {
  const words = name.match(/[A-Za-z0-9]+/g) ?? [];
  if (words.length === 0) return "?";
  if (words.length === 1) {
    const word = words[0]!;
    return word.charAt(0).toUpperCase() + word.slice(1, 2).toLowerCase();
  }
  return words.slice(0, 2).map((word) => word.charAt(0).toUpperCase()).join("");
}

/** Longer label used when two spells in one encounter share an abbreviation. */
function extendedLabel(name: string): string {
  const words = name.match(/[A-Za-z0-9]+/g) ?? [];
  if (words.length < 2) return (words[0] ?? "?").slice(0, 3);
  const [first, second] = words as [string, string];
  return first.charAt(0).toUpperCase() + first.charAt(1).toLowerCase() + second.charAt(0).toUpperCase();
}

function disambiguateLabels(spells: CastTimelineSpell[]): CastTimelineSpell[] {
  const namesByLabel = new Map<string, Set<string>>();
  for (const spell of spells) {
    const names = namesByLabel.get(spell.label) ?? new Set<string>();
    names.add(spell.name);
    namesByLabel.set(spell.label, names);
  }
  for (const spell of spells) {
    if (namesByLabel.get(spell.label)!.size > 1) spell.label = extendedLabel(spell.name);
  }
  return spells;
}

const TICK_STEPS_SECONDS = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 1800];

/** Smallest axis tick step that leaves at least `minSpacingPx` between labels. */
export function chooseTickStepMs(pxPerSecond: number, minSpacingPx = 64): number {
  const step = TICK_STEPS_SECONDS.find((seconds) => seconds * pxPerSecond >= minSpacingPx);
  return (step ?? TICK_STEPS_SECONDS[TICK_STEPS_SECONDS.length - 1]!) * 1000;
}

/** Formats an encounter-relative offset as `m:ss`, keeping the sign. */
export function formatClock(offsetMs: number): string {
  const safe = Number.isFinite(offsetMs) ? Math.round(offsetMs / 1000) : 0;
  const abs = Math.abs(safe);
  return `${safe < 0 ? "-" : ""}${Math.floor(abs / 60)}:${String(abs % 60).padStart(2, "0")}`;
}

const CLASS_COLORS: Record<string, string> = {
  deathknight: "#c41e3a",
  druid: "#ff7c0a",
  hunter: "#aad372",
  mage: "#3fc7eb",
  paladin: "#f48cba",
  priest: "#ffffff",
  rogue: "#fff468",
  shaman: "#0070dd",
  warlock: "#8788ee",
  warrior: "#c69b6d",
};

export function classColor(playerClass: string | null): string | null {
  if (!playerClass) return null;
  return CLASS_COLORS[playerClass.toLowerCase().replace(/[^a-z]/g, "")] ?? null;
}

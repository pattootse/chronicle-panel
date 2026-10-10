/// <reference lib="webworker" />

import { decodeEncounterPayloads, type EncounterPayload } from "@emyrk/chronicle-panel-sdk/v1/events";
import { CombatantInfoSchema, ConsumeSchema, DamageSchema, HealSchema, SpellGoSchema, UnitClassificationSchema, type CombatantInfo } from "@emyrk/chronicle-panel-sdk/v1/protobuf";
import { DamageAccumulator, resolveDamageEvents, type DamageRow, type ResolvedDamageEvent } from "./damage";
import { buildConsumeRows, collectConsumeUses, consumeItemIdsNeedingNames, type ConsumeUse } from "./consumes";
import { buildCastTimelines, type CastTimelineEncounter, type CastTimelinePlayer } from "./castTimeline";
import { buildFirstCasts, type FirstCastEncounter } from "./firstCasts";
import { buildGearRarityRows, latestGearForSelectedEncounters, uniqueGearItemIds, type GearPlayerSnapshot } from "./gearRarity";

interface InitMessage {
  type: "init";
  panelId: string;
  streamType: "damage" | "spell_go" | "combatant_info" | "consume";
  data: ArrayBuffer;
  classificationData?: ArrayBuffer;
  healData?: ArrayBuffer;
  selectedEncounterIds: string[];
  players: Record<string, CastTimelinePlayer>;
  units: Record<string, { name: string; owner?: string | null }>;
  sync: { enabled: boolean; timestampMs: number | null };
}

interface UpdateMessage {
  type: "update";
  selectedEncounterIds: string[];
  sync: { enabled: boolean; timestampMs: number | null };
}

interface ItemMetadataMessage {
  type: "item-metadata";
  requestId: number;
  items: Array<{ entry: number; name: string; quality: number }>;
}

type WorkerRequest = InitMessage | UpdateMessage | ItemMetadataMessage | { type: "dispose" };
interface CastRow {
  encounterId: string;
  atMs: number;
  elapsedMs: number;
  casterId: string;
  casterName: string;
  spellId: number | null;
  spellName: string;
  target: string | null;
}

let panelId = "";
let selected = new Set<string>();
let sync: InitMessage["sync"] = { enabled: false, timestampMs: null };
let damageEvents: ResolvedDamageEvent[] = [];
let damageAccumulator = new DamageAccumulator();
let casts: CastRow[] = [];
let firstCasts: FirstCastEncounter[] = [];
let castTimelines: CastTimelineEncounter[] = [];
let gearPayloads: EncounterPayload<CombatantInfo>[] = [];
let gearPlayers: GearPlayerSnapshot[] = [];
let gearRequestId = 0;
let gearSelectionKey = "";
let consumeUses: ConsumeUse[] = [];
let consumePlayers: InitMessage["players"] = {};
let consumeItemNames = new Map<number, string>();
let consumeRequestId = 0;

function requestGearMetadata(force = false): void {
  const selectionKey = [...selected].sort().join("\0");
  if (!force && selectionKey === gearSelectionKey) return;
  gearSelectionKey = selectionKey;
  gearPlayers = latestGearForSelectedEncounters(gearPayloads, selected);
  gearRequestId += 1;
  self.postMessage({
    type: "gear-item-ids",
    requestId: gearRequestId,
    itemIds: uniqueGearItemIds(gearPlayers),
  });
}

function publish(): void {
  if (panelId === "damage-summary") {
    const cutoff = sync.enabled ? sync.timestampMs : null;
    const rows: DamageRow[] = damageAccumulator.update(damageEvents, selected, cutoff);
    self.postMessage({ type: "damage-result", rows });
    return;
  }

  if (panelId === "gear-rarity") return;

  if (panelId === "consumables") {
    self.postMessage({
      type: "consumables-result",
      rows: buildConsumeRows(consumeUses, selected, consumeItemNames, consumePlayers),
    });
    return;
  }

  if (panelId === "first-casts") {
    self.postMessage({
      type: "first-casts-result",
      encounters: firstCasts.filter((encounter) => selected.has(encounter.encounterId)),
    });
    return;
  }

  if (panelId === "cast-timeline") {
    self.postMessage({
      type: "cast-timeline-result",
      encounters: castTimelines.filter((encounter) => selected.has(encounter.encounterId)),
    });
    return;
  }

  self.postMessage({
    type: "casts-result",
    rows: casts.filter((cast) => selected.has(cast.encounterId)),
  });
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const message = event.data;
  if (message.type === "dispose") {
    self.close();
    return;
  }
  if (message.type === "item-metadata") {
    if (panelId === "consumables") {
      if (message.requestId !== consumeRequestId) return;
      for (const item of message.items) if (item.name) consumeItemNames.set(item.entry, item.name);
      publish();
      return;
    }
    if (message.requestId === gearRequestId) {
      self.postMessage({ type: "gear-rarity-result", rows: buildGearRarityRows(gearPlayers, message.items) });
    }
    return;
  }
  if (message.type === "update") {
    const selectionChanged = message.selectedEncounterIds.length !== selected.size
      || message.selectedEncounterIds.some((id) => !selected.has(id));
    selected = new Set(message.selectedEncounterIds);
    sync = message.sync;
    if (panelId === "gear-rarity") requestGearMetadata();
    // Consumables ignore replay time; only a selection change alters the counts.
    else if (panelId === "consumables") {
      if (selectionChanged) publish();
    }
    // First casts and cast timelines ignore replay time; the views dim casts past the cursor.
    else if (panelId === "first-casts" || panelId === "cast-timeline") {
      if (selectionChanged) publish();
    }
    else publish();
    return;
  }

  panelId = message.panelId;
  selected = new Set(message.selectedEncounterIds);
  sync = message.sync;

  if (panelId === "first-casts") {
    firstCasts = buildFirstCasts(
      decodeEncounterPayloads(DamageSchema, message.data),
      message.healData ? decodeEncounterPayloads(HealSchema, message.healData) : [],
      message.players,
    );
  } else if (panelId === "consumables") {
    consumeUses = collectConsumeUses(decodeEncounterPayloads(ConsumeSchema, message.data));
    consumePlayers = message.players;
    // Names are global, so resolve every unnamed item once rather than per selection.
    const itemIds = consumeItemIdsNeedingNames(consumeUses);
    if (itemIds.length > 0) {
      consumeRequestId += 1;
      self.postMessage({ type: "consume-item-ids", requestId: consumeRequestId, itemIds });
    }
  } else if (panelId === "cast-timeline") {
    castTimelines = buildCastTimelines(decodeEncounterPayloads(SpellGoSchema, message.data), message.players);
  } else if (message.streamType === "damage") {
    damageEvents = resolveDamageEvents(
      decodeEncounterPayloads(DamageSchema, message.data),
      message.classificationData
        ? decodeEncounterPayloads(UnitClassificationSchema, message.classificationData)
        : [],
      message.players,
      message.units,
    );
    damageAccumulator = new DamageAccumulator();
  } else if (panelId === "replay-casts") {
    casts = [];
    for (const payload of decodeEncounterPayloads(SpellGoSchema, message.data)) {
      for (const cast of payload.events) {
        casts.push({
          encounterId: payload.encounterId,
          atMs: payload.firstTimestampMs + Number(cast.meta?.offsetMilli ?? 0n),
          elapsedMs: Number(cast.meta?.offsetMilli ?? 0n),
          casterId: cast.caster,
          casterName: message.players[cast.caster]?.name ?? cast.caster,
          spellId: cast.spellData?.id ?? null,
          spellName: cast.spellData?.name ?? "Unknown spell",
          target: cast.target ?? null,
        });
      }
    }
    casts.sort((a, b) => a.atMs - b.atMs);
  } else {
    gearPayloads = decodeEncounterPayloads(CombatantInfoSchema, message.data);
    requestGearMetadata(true);
    return;
  }

  publish();
};

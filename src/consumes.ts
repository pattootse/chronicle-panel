import type { EncounterPayload } from "@emyrk/chronicle-panel-sdk/v1/events";
import { EvidenceConfidence, type Consume } from "@emyrk/chronicle-panel-sdk/v1/protobuf";

export const CONSUME_CATEGORIES = [
  { key: "flask", label: "Flasks" },
  { key: "potion", label: "Potions" },
  { key: "elixir", label: "Elixirs" },
  { key: "other", label: "Other" },
] as const;

export type ConsumeCategory = typeof CONSUME_CATEGORIES[number]["key"];

/** One physical use, merged from every evidence event sharing its consumeId. */
export interface ConsumeUse {
  consumeId: string;
  encounterIds: string[];
  player: string;
  itemId: number | null;
  itemName: string | null;
  candidateItemIds: number[];
  spellId: number | null;
  spellName: string | null;
  confidence: EvidenceConfidence;
}

export interface ConsumeItemCount {
  key: string;
  name: string;
  category: ConsumeCategory;
  count: number;
  ambiguous: boolean;
}

export interface ConsumeRow {
  playerId: string;
  name: string;
  heroClass: string;
  total: number;
  counts: Record<ConsumeCategory, number>;
  items: ConsumeItemCount[];
}

// Lower is more trustworthy; Unknown sorts last.
function confidenceRank(confidence: EvidenceConfidence): number {
  return confidence === EvidenceConfidence.ConfidenceUnknown ? 99 : confidence;
}

function evidenceRank(use: Pick<ConsumeUse, "itemId" | "itemName" | "confidence">): number {
  return (use.itemId == null ? 200 : 0) + (use.itemName ? 0 : 100) + confidenceRank(use.confidence);
}

export function collectConsumeUses(payloads: EncounterPayload<Consume>[]): ConsumeUse[] {
  const uses = new Map<string, ConsumeUse>();
  for (const payload of payloads) {
    for (const event of payload.events) {
      const consumeId = event.consumeId || event.evidenceId;
      if (!consumeId || !event.player) continue;
      const itemId = event.itemId && event.itemId > 0 ? event.itemId : null;
      const candidate: ConsumeUse = {
        consumeId,
        encounterIds: [payload.encounterId],
        player: event.player,
        itemId,
        itemName: itemId != null && event.itemName ? event.itemName : null,
        candidateItemIds: event.candidateItemIds.filter((id) => id > 0),
        spellId: event.spellData?.id || null,
        spellName: event.spellData?.name || null,
        confidence: event.confidence,
      };
      const previous = uses.get(consumeId);
      if (!previous) {
        uses.set(consumeId, candidate);
        continue;
      }
      if (!previous.encounterIds.includes(payload.encounterId)) previous.encounterIds.push(payload.encounterId);
      const [best, other] = evidenceRank(candidate) < evidenceRank(previous) ? [candidate, previous] : [previous, candidate];
      uses.set(consumeId, {
        ...best,
        encounterIds: previous.encounterIds,
        spellId: best.spellId ?? other.spellId,
        spellName: best.spellName ?? other.spellName,
        candidateItemIds: best.candidateItemIds.length > 0 ? best.candidateItemIds : other.candidateItemIds,
      });
    }
  }
  return [...uses.values()];
}

/** Item IDs whose names the stream did not carry and must come from game data. */
export function consumeItemIdsNeedingNames(uses: ConsumeUse[]): number[] {
  const ids = new Set<number>();
  for (const use of uses) {
    if (use.itemId != null) {
      if (!use.itemName) ids.add(use.itemId);
    } else {
      for (const id of use.candidateItemIds) ids.add(id);
    }
  }
  return [...ids].sort((a, b) => a - b);
}

export function categorizeConsumable(name: string): ConsumeCategory {
  if (/\bflask\b/i.test(name)) return "flask";
  if (/\bpotion\b/i.test(name)) return "potion";
  if (/\belixir\b/i.test(name)) return "elixir";
  return "other";
}

function resolveItem(use: ConsumeUse, itemNames: ReadonlyMap<number, string>): Omit<ConsumeItemCount, "count"> {
  if (use.itemId != null) {
    const name = use.itemName ?? itemNames.get(use.itemId) ?? use.spellName ?? `Item ${use.itemId}`;
    return { key: `item:${use.itemId}`, name, category: categorizeConsumable(name), ambiguous: false };
  }
  const candidateNames = [...new Set(use.candidateItemIds.map((id) => itemNames.get(id)).filter((name): name is string => !!name))];
  if (candidateNames.length === 1) {
    const [name] = candidateNames;
    return { key: `name:${name}`, name, category: categorizeConsumable(name), ambiguous: false };
  }
  const name = use.spellName ?? (use.spellId ? `Spell ${use.spellId}` : "Unknown consumable");
  const categories = new Set(candidateNames.map(categorizeConsumable));
  const category = categories.size === 1 ? [...categories][0] : categorizeConsumable(name);
  return {
    key: use.spellId ? `spell:${use.spellId}` : `name:${name}`,
    name,
    category,
    ambiguous: candidateNames.length > 1 || use.candidateItemIds.length > 1,
  };
}

const CATEGORY_ORDER = new Map(CONSUME_CATEGORIES.map((category, index) => [category.key, index]));

export function buildConsumeRows(
  uses: ConsumeUse[],
  selectedEncounterIds: ReadonlySet<string>,
  itemNames: ReadonlyMap<number, string>,
  players: Record<string, { name: string; class?: string; class_name?: string }>,
): ConsumeRow[] {
  const rows = new Map<string, ConsumeRow & { byKey: Map<string, ConsumeItemCount> }>();
  for (const use of uses) {
    if (!use.encounterIds.some((id) => selectedEncounterIds.has(id))) continue;
    let row = rows.get(use.player);
    if (!row) {
      const player = players[use.player];
      row = {
        playerId: use.player,
        name: player?.name ?? use.player,
        heroClass: player?.class_name ?? player?.class ?? "",
        total: 0,
        counts: { flask: 0, potion: 0, elixir: 0, other: 0 },
        items: [],
        byKey: new Map(),
      };
      rows.set(use.player, row);
    }
    const resolved = resolveItem(use, itemNames);
    let item = row.byKey.get(resolved.key);
    if (!item) {
      item = { ...resolved, count: 0 };
      row.byKey.set(resolved.key, item);
    }
    item.count += 1;
    row.counts[item.category] += 1;
    row.total += 1;
  }
  return [...rows.values()]
    .map(({ byKey, ...row }) => ({
      ...row,
      items: [...byKey.values()].sort((a, b) =>
        CATEGORY_ORDER.get(a.category)! - CATEGORY_ORDER.get(b.category)!
        || b.count - a.count
        || a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name) || a.playerId.localeCompare(b.playerId));
}

import { create } from "@bufbuild/protobuf";
import { describe, expect, it } from "vitest";
import { ConsumeSchema, EvidenceConfidence, EvidenceKind } from "@emyrk/chronicle-panel-sdk/v1/protobuf";
import { buildConsumeRows, categorizeConsumable, collectConsumeUses, consumeItemIdsNeedingNames } from "./consumes";

function consume(index: number, fields: Partial<{
  consumeId: string;
  player: string;
  itemId: number;
  itemName: string;
  candidateItemIds: number[];
  spellId: number;
  spellName: string;
  confidence: EvidenceConfidence;
  kind: EvidenceKind;
}>) {
  return create(ConsumeSchema, {
    meta: { index, offsetMilli: BigInt(index) },
    consumeId: fields.consumeId ?? `use-${index}`,
    evidenceId: `evidence-${index}`,
    player: fields.player ?? "Player-1",
    itemId: fields.itemId,
    itemName: fields.itemName,
    candidateItemIds: fields.candidateItemIds ?? [],
    spellData: fields.spellId ? { id: fields.spellId, name: fields.spellName ?? "" } : undefined,
    kind: fields.kind ?? EvidenceKind.EvidenceDirectItem,
    confidence: fields.confidence ?? EvidenceConfidence.ConfidenceDirect,
  });
}

const players = { "Player-1": { name: "Alice", class: "Mage" }, "Player-2": { name: "Bob" } };

describe("consumable aggregation", () => {
  it("categorizes by item name", () => {
    expect(categorizeConsumable("Flask of the Titans")).toBe("flask");
    expect(categorizeConsumable("Major Mana Potion")).toBe("potion");
    expect(categorizeConsumable("Elixir of the Mongoose")).toBe("elixir");
    expect(categorizeConsumable("Dark Rune")).toBe("other");
  });

  it("merges evidence sharing a consumeId and prefers direct item evidence", () => {
    const uses = collectConsumeUses([
      {
        encounterId: "encounter-1",
        firstTimestampMs: 0,
        events: [
          consume(1, { consumeId: "a", spellId: 17531, spellName: "Restore Mana", confidence: EvidenceConfidence.ConfidenceEffectDerived, kind: EvidenceKind.EvidenceResource }),
          consume(2, { consumeId: "a", itemId: 13444, itemName: "Major Mana Potion" }),
        ],
      },
    ]);
    expect(uses).toHaveLength(1);
    expect(uses[0]).toMatchObject({ itemId: 13444, itemName: "Major Mana Potion", spellId: 17531 });
  });

  it("counts a projected use once across encounters and only for selected encounters", () => {
    const flask = (index: number) => consume(index, { consumeId: "flask", itemId: 13510, itemName: "Flask of the Titans" });
    const uses = collectConsumeUses([
      { encounterId: "encounter-1", firstTimestampMs: 0, events: [flask(1), consume(2, { itemId: 13444, itemName: "Major Mana Potion" })] },
      { encounterId: "encounter-2", firstTimestampMs: 0, events: [flask(3), consume(4, { itemId: 13444, itemName: "Major Mana Potion" })] },
    ]);

    const both = buildConsumeRows(uses, new Set(["encounter-1", "encounter-2"]), new Map(), players);
    expect(both).toHaveLength(1);
    expect(both[0]).toMatchObject({ name: "Alice", heroClass: "Mage", total: 3, counts: { flask: 1, potion: 2, elixir: 0, other: 0 } });
    expect(both[0].items.map((item) => [item.name, item.count])).toEqual([
      ["Flask of the Titans", 1],
      ["Major Mana Potion", 2],
    ]);

    const second = buildConsumeRows(uses, new Set(["encounter-2"]), new Map(), players);
    expect(second[0].total).toBe(2);
    expect(buildConsumeRows(uses, new Set(), new Map(), players)).toEqual([]);
  });

  it("resolves missing and ambiguous names from game data", () => {
    const uses = collectConsumeUses([
      {
        encounterId: "encounter-1",
        firstTimestampMs: 0,
        events: [
          consume(1, { player: "Player-2", itemId: 9206 }),
          consume(2, { player: "Player-2", candidateItemIds: [13446], spellId: 17534, spellName: "Healing Potion", confidence: EvidenceConfidence.ConfidenceAmbiguous }),
          consume(3, { player: "Player-2", candidateItemIds: [1, 2], spellId: 99, spellName: "Restore Energy", confidence: EvidenceConfidence.ConfidenceAmbiguous }),
        ],
      },
    ]);
    expect(consumeItemIdsNeedingNames(uses)).toEqual([1, 2, 9206, 13446]);

    const names = new Map([[9206, "Elixir of Giants"], [13446, "Major Healing Potion"], [1, "Mighty Rage Potion"], [2, "Great Rage Potion"]]);
    const [row] = buildConsumeRows(uses, new Set(["encounter-1"]), names, players);
    expect(row.counts).toEqual({ flask: 0, potion: 2, elixir: 1, other: 0 });
    expect(row.items).toEqual([
      { key: "name:Major Healing Potion", name: "Major Healing Potion", category: "potion", count: 1, ambiguous: false },
      { key: "spell:99", name: "Restore Energy", category: "potion", count: 1, ambiguous: true },
      { key: "item:9206", name: "Elixir of Giants", category: "elixir", count: 1, ambiguous: false },
    ]);
  });
});

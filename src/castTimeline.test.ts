import { create } from "@bufbuild/protobuf";
import { describe, expect, it } from "vitest";
import type { EncounterPayload } from "@emyrk/chronicle-panel-sdk/v1/events";
import { SpellGoSchema, type SpellGo } from "@emyrk/chronicle-panel-sdk/v1/protobuf";
import {
  abbreviateSpell,
  buildCastTimelines,
  chooseTickStepMs,
  classColor,
  formatClock,
  lowerBound,
  spellHue,
} from "./castTimeline";

const players = {
  "Player-1": { name: "Zed", class: "WARRIOR" },
  "Player-2": { name: "Amy", class: "Mage" },
  "Player-3": { name: "Bob", class: "Warrior" },
};

function spellGo(index: number, offsetMilli: number, caster: string, id: number, name: string, target = "Creature-1") {
  return create(SpellGoSchema, {
    meta: { index, offsetMilli: BigInt(offsetMilli) },
    caster,
    target,
    spellData: { id, name },
  });
}

function payload(encounterId: string, firstTimestampMs: number, events: SpellGo[]): EncounterPayload<SpellGo> {
  return { encounterId, firstTimestampMs, events } as EncounterPayload<SpellGo>;
}

describe("buildCastTimelines", () => {
  it("groups player casts into time-ordered lanes sharing one spell table", () => {
    const [encounter, ...rest] = buildCastTimelines(
      [payload("enc-1", 10_000, [
        spellGo(3, 3_000, "Player-1", 12294, "Mortal Strike"),
        spellGo(1, 1_000, "Player-1", 1680, "Whirlwind"),
        spellGo(2, 1_500, "Player-3", 12294, "Mortal Strike"),
        spellGo(4, 2_000, "Player-2", 10181, "Frostbolt"),
        spellGo(5, 2_500, "Pet-1", 17253, "Bite"),
        spellGo(6, 9_000, "Creature-1", 20691, "Cleave", "Player-1"),
      ])],
      players,
    );

    expect(rest).toHaveLength(0);
    expect(encounter!.firstTimestampMs).toBe(10_000);
    expect(encounter!.lastTimestampMs).toBe(19_000);
    // Ordered by class, then name.
    expect(encounter!.lanes.map((lane) => lane.name)).toEqual(["Amy", "Bob", "Zed"]);

    const zed = encounter!.lanes[2]!;
    expect(zed.atMs).toEqual([11_000, 13_000]);
    expect(zed.spell.map((index) => encounter!.spells[index]!.name)).toEqual(["Whirlwind", "Mortal Strike"]);
    expect(zed.target).toEqual(["Creature-1", "Creature-1"]);
    // Mortal Strike is shared between both warriors.
    expect(encounter!.lanes[1]!.spell[0]).toBe(zed.spell[1]);
    expect(encounter!.spells.map((spell) => spell.name).sort()).toEqual(["Frostbolt", "Mortal Strike", "Whirlwind"]);
  });

  it("ignores synthetic casts and breaks timestamp ties by event index", () => {
    const synthetic = spellGo(1, 0, "Player-2", 10181, "Frostbolt");
    synthetic.meta!.isSynthetic = true;
    const [encounter] = buildCastTimelines(
      [payload("enc-1", 0, [
        synthetic,
        spellGo(3, 500, "Player-2", 2, "Second"),
        spellGo(2, 500, "Player-2", 1, "First"),
      ])],
      players,
    );
    const lane = encounter!.lanes[0]!;
    expect(lane.spell.map((index) => encounter!.spells[index]!.name)).toEqual(["First", "Second"]);
  });

  it("merges payloads per encounter and orders encounters by start", () => {
    const result = buildCastTimelines(
      [
        payload("enc-2", 50_000, [spellGo(1, 0, "Player-1", 1, "A")]),
        payload("enc-1", 10_000, [spellGo(1, 0, "Player-1", 1, "A")]),
        payload("enc-1", 5_000, [spellGo(1, 100, "Player-1", 2, "B")]),
      ],
      players,
    );
    expect(result.map((encounter) => encounter.encounterId)).toEqual(["enc-1", "enc-2"]);
    expect(result[0]!.firstTimestampMs).toBe(5_000);
    expect(result[0]!.lanes[0]!.atMs).toEqual([5_100, 10_000]);
  });

  it("labels casts without spell data", () => {
    const [encounter] = buildCastTimelines(
      [payload("enc-1", 0, [create(SpellGoSchema, { meta: { index: 1 }, caster: "Player-1", itemID: 13442 })])],
      players,
    );
    expect(encounter!.spells).toEqual([{ id: null, name: "Item 13442", key: "name:Item 13442", label: "I1" }]);
  });

  it("extends labels that collide within an encounter", () => {
    const [encounter] = buildCastTimelines(
      [payload("enc-1", 0, [
        spellGo(1, 0, "Player-1", 75, "Auto Shot"),
        spellGo(2, 100, "Player-1", 19434, "Aimed Shot"),
        spellGo(3, 200, "Player-1", 12294, "Mortal Strike"),
        spellGo(4, 300, "Player-2", 12294, "Mortal Strike"),
      ])],
      players,
    );
    expect(encounter!.spells.map((spell) => spell.label)).toEqual(["AuS", "AiS", "MS"]);
  });
});

describe("timeline helpers", () => {
  it("finds lower bounds", () => {
    expect(lowerBound([], 5)).toBe(0);
    expect(lowerBound([1, 3, 3, 7], 3)).toBe(1);
    expect(lowerBound([1, 3, 3, 7], 4)).toBe(3);
    expect(lowerBound([1, 3, 3, 7], 9)).toBe(4);
  });

  it("assigns stable hues", () => {
    expect(spellHue("id:12294")).toBe(spellHue("id:12294"));
    expect(spellHue("id:12294")).not.toBe(spellHue("id:1680"));
    expect(spellHue("id:1")).toBeGreaterThanOrEqual(0);
    expect(spellHue("id:1")).toBeLessThan(360);
  });

  it("abbreviates spell names", () => {
    expect(abbreviateSpell("Mortal Strike")).toBe("MS");
    expect(abbreviateSpell("Bloodthirst")).toBe("Bl");
    expect(abbreviateSpell("Shadow Word: Pain")).toBe("SW");
    expect(abbreviateSpell("")).toBe("?");
  });

  it("chooses readable tick steps", () => {
    expect(chooseTickStepMs(100)).toBe(1_000);
    expect(chooseTickStepMs(16)).toBe(5_000);
    expect(chooseTickStepMs(1)).toBe(120_000);
    expect(chooseTickStepMs(0.001)).toBe(1_800_000);
  });

  it("formats signed clocks and class colors", () => {
    expect(formatClock(65_400)).toBe("1:05");
    expect(formatClock(-3_000)).toBe("-0:03");
    expect(classColor("Death Knight")).toBe("#c41e3a");
    expect(classColor("WARRIOR")).toBe("#c69b6d");
    expect(classColor(null)).toBeNull();
    expect(classColor("Bard")).toBeNull();
  });
});

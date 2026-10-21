"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert");

const {
  bepaalTeArchiveren,
  laatsteSpeeldatum,
} = require("../voorstellingen-archief.js");

const NU = new Date("2026-10-21T12:00:00.000Z");

function voorstelling(id, groep, datum1, extra = {}) {
  return { id, groep, datum_tijd_1: datum1, datum_tijd_2: "", ...extra };
}

describe("laatsteSpeeldatum", () => {
  it("uses the latest of both dates in PocketBase format", () => {
    assert.strictEqual(
      laatsteSpeeldatum({
        datum_tijd_1: "2026-04-24 18:00:00.000Z",
        datum_tijd_2: "2026-04-25 18:00:00.000Z",
      }).toISOString(),
      "2026-04-25T18:00:00.000Z"
    );
  });

  it("returns null without dates", () => {
    assert.strictEqual(
      laatsteSpeeldatum({ datum_tijd_1: "", datum_tijd_2: "" }),
      null
    );
  });
});

describe("bepaalTeArchiveren", () => {
  it("archives a voorstelling once 3 later ones of the same groep took place", () => {
    const lijst = [
      voorstelling("a", "tov", "2022-04-01 18:00:00.000Z"),
      voorstelling("b", "tov", "2023-04-01 18:00:00.000Z"),
      voorstelling("c", "tov", "2024-04-01 18:00:00.000Z"),
      voorstelling("d", "tov", "2025-04-01 18:00:00.000Z"),
    ];
    assert.deepStrictEqual(bepaalTeArchiveren(lijst, NU), ["a"]);
  });

  it("does not archive with only 2 later voorstellingen", () => {
    const lijst = [
      voorstelling("a", "tov", "2023-04-01 18:00:00.000Z"),
      voorstelling("b", "tov", "2024-04-01 18:00:00.000Z"),
      voorstelling("c", "tov", "2025-04-01 18:00:00.000Z"),
    ];
    assert.deepStrictEqual(bepaalTeArchiveren(lijst, NU), []);
  });

  it("does not count future voorstellingen", () => {
    const lijst = [
      voorstelling("a", "tov", "2023-04-01 18:00:00.000Z"),
      voorstelling("b", "tov", "2024-04-01 18:00:00.000Z"),
      voorstelling("c", "tov", "2025-04-01 18:00:00.000Z"),
      voorstelling("toekomst", "tov", "2027-04-01 18:00:00.000Z"),
    ];
    assert.deepStrictEqual(bepaalTeArchiveren(lijst, NU), []);
  });

  it("counts per groep", () => {
    const lijst = [
      voorstelling("tov1", "tov", "2022-04-01 18:00:00.000Z"),
      voorstelling("clo1", "clo", "2023-01-01 18:00:00.000Z"),
      voorstelling("clo2", "clo", "2023-06-01 18:00:00.000Z"),
      voorstelling("clo3", "clo", "2024-01-01 18:00:00.000Z"),
    ];
    assert.deepStrictEqual(bepaalTeArchiveren(lijst, NU), []);
  });

  it("uses datum_tijd_2 as the end of a voorstelling", () => {
    // 'a' speelt tot na 'b', dus 'b' is eigenlijk de oudere
    const lijst = [
      voorstelling("a", "tov", "2022-04-01 18:00:00.000Z", {
        datum_tijd_2: "2022-12-01 18:00:00.000Z",
      }),
      voorstelling("b", "tov", "2022-06-01 18:00:00.000Z"),
      voorstelling("c", "tov", "2024-04-01 18:00:00.000Z"),
      voorstelling("d", "tov", "2025-04-01 18:00:00.000Z"),
    ];
    assert.deepStrictEqual(bepaalTeArchiveren(lijst, NU), ["b"]);
  });

  it("skips already archived and manually restored voorstellingen", () => {
    const lijst = [
      voorstelling("oud", "tov", "2020-04-01 18:00:00.000Z", {
        gearchiveerd: true,
      }),
      voorstelling("teruggezet", "tov", "2021-04-01 18:00:00.000Z", {
        niet_auto_archiveren: true,
      }),
      voorstelling("a", "tov", "2022-04-01 18:00:00.000Z"),
      voorstelling("b", "tov", "2023-04-01 18:00:00.000Z"),
      voorstelling("c", "tov", "2024-04-01 18:00:00.000Z"),
      voorstelling("d", "tov", "2025-04-01 18:00:00.000Z"),
    ];
    assert.deepStrictEqual(bepaalTeArchiveren(lijst, NU), ["a"]);
  });

  it("ignores voorstellingen without a date", () => {
    const lijst = [
      voorstelling("leeg", "tov", ""),
      voorstelling("b", "tov", "2023-04-01 18:00:00.000Z"),
      voorstelling("c", "tov", "2024-04-01 18:00:00.000Z"),
      voorstelling("d", "tov", "2025-04-01 18:00:00.000Z"),
    ];
    assert.deepStrictEqual(bepaalTeArchiveren(lijst, NU), []);
  });
});

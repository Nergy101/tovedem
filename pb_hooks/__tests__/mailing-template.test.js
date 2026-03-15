"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert");

// Load the template module (no PocketBase deps)
const { fillReservatieTemplate } = require("../mailing-template.js");

describe("fillReservatieTemplate", () => {
  const baseData = {
    reserveerdersNaam: "Jan Jansen",
    voorstellingsNaam: "De Voorstelling",
    aantal1: 2,
    datum1: "vrijdag 24 april 2026",
    tijd1: "20:00",
    islid1: "Ja",
    isvriend1: "Nee",
    aantal2: 0,
    datum2: "",
    tijd2: "",
    islid2: "Ja",
    isvriend2: "Nee",
    reserveringid: "res123",
    guid: "guid-abc-123",
    voorstellingAfbeelding: "https://example.com/image.jpg",
  };

  it("replaces all reservation placeholders", () => {
    const template = `
      Hallo {reserveerdersNaam},
      Uw reservering voor {voorstellingsNaam}:
      Datum 1: {datum1} om {tijd1}, {aantal1} persoon(en)
      Lid: {islid1}, Vriend: {isvriend1}
      Datum 2: {datum2} om {tijd2}, {aantal2} persoon(en)
      Lid: {islid2}, Vriend: {isvriend2}
      Reservering: {reserveringid}, GUID: {guid}
      Afbeelding: {voorstellingAfbeelding}
    `;

    const result = fillReservatieTemplate(template, baseData);

    assert.ok(result.includes("Jan Jansen"));
    assert.ok(result.includes("De Voorstelling"));
    assert.ok(result.includes("vrijdag 24 april 2026"));
    assert.ok(result.includes("20:00"));
    assert.ok(result.includes("2"));
    assert.ok(result.includes("Ja"));
    assert.ok(result.includes("Nee"));
    assert.ok(result.includes("res123"));
    assert.ok(result.includes("guid-abc-123"));
    assert.ok(result.includes("https://example.com/image.jpg"));
  });

  it("replaces multiple occurrences of the same placeholder", () => {
    const template = "Hallo {reserveerdersNaam}, nogmaals {reserveerdersNaam}";
    const result = fillReservatieTemplate(template, baseData);
    assert.strictEqual(result, "Hallo Jan Jansen, nogmaals Jan Jansen");
  });

  it("replaces datum1 and tijd1 with voorstelling show times", () => {
    const template = "De voorstelling is op {datum1} om {tijd1}.";
    const result = fillReservatieTemplate(template, {
      ...baseData,
      datum1: "zaterdag 15 juni 2026",
      tijd1: "19:30",
    });
    assert.strictEqual(result, "De voorstelling is op zaterdag 15 juni 2026 om 19:30.");
  });

  it("handles empty datum2 and tijd2 when only datum1 is used", () => {
    const template = "Datum 1: {datum1} {tijd1}. Datum 2: {datum2} {tijd2}.";
    const result = fillReservatieTemplate(template, {
      ...baseData,
      datum2: "",
      tijd2: "",
    });
    assert.strictEqual(result, "Datum 1: vrijdag 24 april 2026 20:00. Datum 2:  .");
  });

  it("handles missing optional fields with empty string", () => {
    const template = "{reserveerdersNaam}|{datum2}|{tijd2}";
    const result = fillReservatieTemplate(template, {
      reserveerdersNaam: "Test",
      voorstellingsNaam: "Show",
      aantal1: 1,
      datum1: "maandag 1 jan 2026",
      tijd1: "18:00",
      islid1: "Nee",
      isvriend1: "Nee",
      aantal2: 0,
      datum2: undefined,
      tijd2: null,
      islid2: "Nee",
      isvriend2: "Nee",
      reserveringid: "r1",
      guid: "g1",
      voorstellingAfbeelding: "",
    });
    assert.strictEqual(result, "Test||");
  });

  it("preserves template text that is not a placeholder", () => {
    const template = "Hallo {reserveerdersNaam}, dit is geen {placeholder}.";
    const result = fillReservatieTemplate(template, baseData);
    assert.strictEqual(result, "Hallo Jan Jansen, dit is geen {placeholder}.");
  });

  it("handles islid and isvriend Ja/Nee correctly", () => {
    const template = "{islid1}/{isvriend1} en {islid2}/{isvriend2}";
    const result = fillReservatieTemplate(template, {
      ...baseData,
      islid1: "Ja",
      isvriend1: "Ja",
      islid2: "Nee",
      isvriend2: "Nee",
    });
    assert.strictEqual(result, "Ja/Ja en Nee/Nee");
  });
});

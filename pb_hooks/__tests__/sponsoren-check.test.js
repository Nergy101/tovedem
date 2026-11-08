"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert");

const sponsorenCheck = require("../sponsoren-check.js");

const sponsors = [
  { voornaam: "Jan", achternaam: "van der Berg", email: "jan@voorbeeld.nl" },
  { voornaam: "Anna", achternaam: "de Boer", email: "" },
];

describe("isSponsorMatch", () => {
  it("matcht bij gelijke voornaam, achternaam en e-mail (hoofdletters en spaties maken niet uit)", () => {
    assert.strictEqual(
      sponsorenCheck.isSponsorMatch(sponsors, {
        voornaam: " jan ",
        achternaam: "Van  der Berg",
        email: "JAN@voorbeeld.nl ",
      }),
      true
    );
  });

  it("matcht niet als één van de drie velden afwijkt", () => {
    const basis = {
      voornaam: "Jan",
      achternaam: "van der Berg",
      email: "jan@voorbeeld.nl",
    };
    for (const afwijking of [
      { voornaam: "Piet" },
      { achternaam: "Berg" },
      { email: "jan@ander.nl" },
    ]) {
      assert.strictEqual(
        sponsorenCheck.isSponsorMatch(sponsors, { ...basis, ...afwijking }),
        false,
        JSON.stringify(afwijking)
      );
    }
  });

  it("matcht niet bij onvolledige gegevens of een sponsor zonder e-mail", () => {
    assert.strictEqual(
      sponsorenCheck.isSponsorMatch(sponsors, {
        voornaam: "Anna",
        achternaam: "de Boer",
        email: "",
      }),
      false
    );
    assert.strictEqual(sponsorenCheck.isSponsorMatch(sponsors, null), false);
  });
});

describe("zoekSponsorMatch", () => {
  it("zoekt op e-mail in de collectie sponsoren en vergelijkt daarna exact", () => {
    const aanroepen = [];
    const app = {
      findRecordsByFilter(collection, filter, sort, limit, offset, params) {
        aanroepen.push({ collection, filter, params });
        return sponsors.map((sponsor) => ({ getString: (veld) => sponsor[veld] }));
      },
    };

    assert.strictEqual(
      sponsorenCheck.zoekSponsorMatch(app, {
        voornaam: "Jan",
        achternaam: "van der Berg",
        email: "Jan@Voorbeeld.nl",
      }),
      true
    );
    assert.deepStrictEqual(aanroepen, [
      {
        collection: "sponsoren",
        filter: "email ~ {:email}",
        params: { email: "jan@voorbeeld.nl" },
      },
    ]);
  });

  it("raakt de database niet aan bij onvolledige gegevens", () => {
    const app = {
      findRecordsByFilter() {
        throw new Error("mag niet aangeroepen worden");
      },
    };
    assert.strictEqual(
      sponsorenCheck.zoekSponsorMatch(app, { voornaam: "Jan" }),
      false
    );
  });
});

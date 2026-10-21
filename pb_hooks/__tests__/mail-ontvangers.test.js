"use strict";

const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert");

let records = {};
const warnings = [];

global.$app = {
  findFirstRecordByFilter(collection, filter, params) {
    assert.strictEqual(collection, "mail_ontvangers");
    assert.strictEqual(filter, "formulier = {:formulier}");
    const emails = records[params.formulier];
    if (emails === undefined) {
      throw new Error("sql: no rows in result set");
    }
    return { getString: () => emails };
  },
  logger() {
    return { info() {}, warn: (...args) => warnings.push(args) };
  },
};

const constants = require("../constants.js");
const mailOntvangers = require("../mail-ontvangers.js");

describe("parseOntvangers", () => {
  it("parses a JSON array and normalises the addresses", () => {
    assert.deepStrictEqual(
      mailOntvangers.parseOntvangers(
        '[" Info@Tovedem.nl ", "bestuur@tovedem.nl"]'
      ),
      ["info@tovedem.nl", "bestuur@tovedem.nl"]
    );
  });

  it("removes duplicates and invalid addresses", () => {
    assert.deepStrictEqual(
      mailOntvangers.parseOntvangers([
        "a@b.nl",
        "A@B.nl",
        "geen-email",
        "",
        null,
        42,
      ]),
      ["a@b.nl"]
    );
  });

  it("accepts comma or newline separated text", () => {
    assert.deepStrictEqual(
      mailOntvangers.parseOntvangers("a@b.nl, c@d.nl\ne@f.nl"),
      ["a@b.nl", "c@d.nl", "e@f.nl"]
    );
  });

  it("returns an empty list for empty values", () => {
    assert.deepStrictEqual(mailOntvangers.parseOntvangers(""), []);
    assert.deepStrictEqual(mailOntvangers.parseOntvangers("null"), []);
    assert.deepStrictEqual(mailOntvangers.parseOntvangers(null), []);
    assert.deepStrictEqual(mailOntvangers.parseOntvangers({}), []);
  });
});

describe("valideerInstelling", () => {
  it("accepts valid addresses and normalises them", () => {
    assert.deepStrictEqual(
      mailOntvangers.valideerInstelling(
        "contact",
        '["Info@Tovedem.nl", "bestuur@tovedem.nl", "info@tovedem.nl"]'
      ),
      { ontvangers: ["info@tovedem.nl", "bestuur@tovedem.nl"] }
    );
  });

  it("rejects an unknown formulier", () => {
    assert.match(
      mailOntvangers.valideerInstelling("onbekend", '["a@b.nl"]').fout,
      /Onbekend formulier/
    );
  });

  it("rejects invalid addresses and names them", () => {
    const { fout } = mailOntvangers.valideerInstelling(
      "sinterklaas",
      '["a@b.nl", "fout-adres"]'
    );
    assert.match(fout, /fout-adres/);
  });

  it("rejects an empty list", () => {
    assert.match(
      mailOntvangers.valideerInstelling("lid_worden", "[]").fout,
      /minimaal één/
    );
    assert.match(
      mailOntvangers.valideerInstelling("lid_worden", "").fout,
      /minimaal één/
    );
  });

  it("rejects non-array JSON", () => {
    assert.match(
      mailOntvangers.valideerInstelling("contact", '"a@b.nl"').fout,
      /Ongeldige lijst/
    );
  });
});

describe("getBeheerOntvangersMetBron", () => {
  beforeEach(() => {
    records = {};
    warnings.length = 0;
  });

  it("uses the configured addresses", () => {
    records.contact = '["info@tovedem.nl","bestuur@tovedem.nl"]';
    assert.deepStrictEqual(
      mailOntvangers.getBeheerOntvangersMetBron("contact"),
      {
        ontvangers: ["info@tovedem.nl", "bestuur@tovedem.nl"],
        bron: "ingesteld",
      }
    );
    assert.strictEqual(warnings.length, 0);
  });

  it("falls back to the default addresses when nothing is configured", () => {
    assert.deepStrictEqual(
      mailOntvangers.getBeheerOntvangersMetBron("sinterklaas"),
      { ontvangers: constants.beheerderEmails, bron: "standaard" }
    );
    assert.strictEqual(warnings.length, 1);
  });

  it("falls back to the default addresses when the list is empty or invalid", () => {
    records.lid_worden = "[]";
    records.vriend_worden = '["geen-email"]';
    assert.deepStrictEqual(
      mailOntvangers.getBeheerOntvangers("lid_worden"),
      constants.beheerderEmails
    );
    assert.deepStrictEqual(
      mailOntvangers.getBeheerOntvangers("vriend_worden"),
      constants.beheerderEmails
    );
  });

  it("keeps formulieren separate", () => {
    records.contact = '["contact@tovedem.nl"]';
    records.sinterklaas = '["sint@tovedem.nl"]';
    assert.deepStrictEqual(mailOntvangers.getBeheerOntvangers("contact"), [
      "contact@tovedem.nl",
    ]);
    assert.deepStrictEqual(mailOntvangers.getBeheerOntvangers("sinterklaas"), [
      "sint@tovedem.nl",
    ]);
  });
});

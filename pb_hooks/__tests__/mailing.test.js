"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert");

global.$app = {
  findFirstRecordByFilter() {
    throw new Error("not used in this test");
  },
  logger() {
    return { info() {} };
  },
};

const mailing = require("../mailing.js");

function createRecord(fields, props = {}) {
  return {
    ...props,
    get(name) {
      return fields[name];
    },
  };
}

describe("getReservatieMailHtml", () => {
  it("uses the PocketBase host configured for each environment", () => {
    const mailInfo = createRecord({
      inhoud: "Afbeelding: {voorstellingAfbeelding}",
    });

    const reservatie = createRecord({
      voornaam: "Jan",
      achternaam: "Jansen",
      datum_tijd_1_aantal: 2,
      datum_tijd_2_aantal: 0,
      is_lid_van_vereniging: true,
      is_vriend_van_tovedem: false,
      id: "res123",
      guid: "guid123",
    });

    const voorstelling = createRecord(
      {
        titel: "De onverwachte gast",
        datum_tijd_1: "2026-04-24 18:00:00.000Z",
        datum_tijd_2: "2026-04-25 18:00:00.000Z",
        afbeelding: "img_20260214_wa0001_x3a9o2xqbr.jpg",
        collectionId: null,
      },
      {
        collectionId: "raeh9to382z383p",
        id: "yxgn9xt3g7ya7ll",
      }
    );

    const originalOs = global.$os;
    try {
      global.$os = {
        getenv(name) {
          return name === "MAIL_IMAGE_BASE_URL"
            ? "https://tovedem.nergy.space/"
            : undefined;
        },
      };
      const developmentHtml = mailing.getReservatieMailHtml(
        mailInfo,
        reservatie,
        voorstelling
      );
      assert.ok(
        developmentHtml.includes(
          "https://tovedem.nergy.space/api/files/raeh9to382z383p/yxgn9xt3g7ya7ll/img_20260214_wa0001_x3a9o2xqbr.jpg"
        )
      );

      global.$os = {
        getenv(name) {
          return name === "MAIL_IMAGE_BASE_URL"
            ? "https://pocketbase.tovedem.nl"
            : undefined;
        },
      };
      const productionHtml = mailing.getReservatieMailHtml(
        mailInfo,
        reservatie,
        voorstelling
      );
      assert.ok(
        productionHtml.includes(
          "https://pocketbase.tovedem.nl/api/files/raeh9to382z383p/yxgn9xt3g7ya7ll/img_20260214_wa0001_x3a9o2xqbr.jpg"
        )
      );
      assert.ok(!productionHtml.includes("/null/"));
    } finally {
      global.$os = originalOs;
    }
  });
});

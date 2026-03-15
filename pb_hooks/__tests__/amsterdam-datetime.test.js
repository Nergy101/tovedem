"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert");

const {
  formatDateAmsterdam,
  formatTimeAmsterdam,
  getAmsterdamOffsetHours,
  normalizeUtcString,
  parseUtcDate,
  toUtcString,
} = require("../amsterdam-datetime.js");

describe("amsterdam-datetime", () => {
  describe("toUtcString", () => {
    it("returns plain strings unchanged", () => {
      assert.strictEqual(toUtcString("2026-04-24 18:00:00.000Z"), "2026-04-24 18:00:00.000Z");
    });

    it("extracts strings from PocketBase DateTime-like objects", () => {
      const pocketBaseDateTime = {
        string() {
          return "2026-04-24 18:00:00.000Z";
        },
      };

      assert.strictEqual(toUtcString(pocketBaseDateTime), "2026-04-24 18:00:00.000Z");
    });
  });

  describe("normalizeUtcString", () => {
    it("normalizes PocketBase datetime strings with a space separator", () => {
      assert.strictEqual(
        normalizeUtcString("2026-04-24 18:00:00.000Z"),
        "2026-04-24T18:00:00.000Z"
      );
    });

    it("treats datetimes without timezone suffix as UTC", () => {
      assert.strictEqual(normalizeUtcString("2026-04-24 18:00:00"), "2026-04-24T18:00:00Z");
    });
  });

  describe("DST offset", () => {
    it("uses CET before the DST switch", () => {
      const date = parseUtcDate("2026-03-15T18:00:00.000Z");
      assert.ok(date);
      assert.strictEqual(getAmsterdamOffsetHours(date), 1);
    });

    it("uses CEST after the DST switch", () => {
      const date = parseUtcDate("2026-04-24T18:00:00.000Z");
      assert.ok(date);
      assert.strictEqual(getAmsterdamOffsetHours(date), 2);
    });
  });

  describe("formatTimeAmsterdam", () => {
    it("shows 20:00 for the April 24 2026 voorstelling", () => {
      assert.strictEqual(formatTimeAmsterdam("2026-04-24 18:00:00.000Z"), "20:00");
    });

    it("shows 20:00 for the April 25 2026 voorstelling", () => {
      assert.strictEqual(formatTimeAmsterdam("2026-04-25 18:00:00.000Z"), "20:00");
    });

    it("shows 19:00 for a winter voorstelling at 18:00 UTC", () => {
      assert.strictEqual(formatTimeAmsterdam("2026-12-15 18:00:00.000Z"), "19:00");
    });
  });

  describe("formatDateAmsterdam", () => {
    it("formats the Dutch date with weekday for April 24 2026", () => {
      assert.strictEqual(
        formatDateAmsterdam("2026-04-24 18:00:00.000Z"),
        "vrijdag 24 april 2026"
      );
    });

    it("formats the Dutch date with weekday for April 25 2026", () => {
      assert.strictEqual(
        formatDateAmsterdam("2026-04-25 18:00:00.000Z"),
        "zaterdag 25 april 2026"
      );
    });
  });
});

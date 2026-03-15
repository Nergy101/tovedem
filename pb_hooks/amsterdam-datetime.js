"use strict";

const DUTCH_WEEKDAYS = [
  "zondag",
  "maandag",
  "dinsdag",
  "woensdag",
  "donderdag",
  "vrijdag",
  "zaterdag",
];

const DUTCH_MONTHS = [
  "januari",
  "februari",
  "maart",
  "april",
  "mei",
  "juni",
  "juli",
  "augustus",
  "september",
  "oktober",
  "november",
  "december",
];

function toUtcString(value) {
  if (value == null || value === "") return "";
  if (typeof value === "string") return value;
  if (value && typeof value.string === "function") return value.string();
  return String(value);
}

function normalizeUtcString(value) {
  const raw = toUtcString(value);
  if (!raw) return "";

  let normalized = raw.trim();
  if (!normalized) return "";

  if (normalized.length >= 11 && normalized[10] === " ") {
    normalized = normalized.slice(0, 10) + "T" + normalized.slice(11);
  }

  if (!/[zZ]$|[+-]\d{2}:\d{2}$|[+-]\d{4}$/.test(normalized)) {
    normalized += "Z";
  }

  return normalized;
}

function parseUtcDate(value) {
  const normalized = normalizeUtcString(value);
  if (!normalized) return null;

  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function lastSundayOfMonthAtUtc(year, monthIndex, hour) {
  const date = new Date(Date.UTC(year, monthIndex + 1, 0, hour, 0, 0, 0));
  date.setUTCDate(date.getUTCDate() - date.getUTCDay());
  return date.getTime();
}

function getAmsterdamOffsetHours(utcDate) {
  const year = utcDate.getUTCFullYear();
  const summerTimeStart = lastSundayOfMonthAtUtc(year, 2, 1);
  const winterTimeStart = lastSundayOfMonthAtUtc(year, 9, 1);
  const timestamp = utcDate.getTime();

  return timestamp >= summerTimeStart && timestamp < winterTimeStart ? 2 : 1;
}

function toAmsterdamParts(value) {
  const utcDate = parseUtcDate(value);
  if (!utcDate) return null;

  const offsetHours = getAmsterdamOffsetHours(utcDate);
  const localDate = new Date(utcDate.getTime() + offsetHours * 60 * 60 * 1000);

  return {
    year: localDate.getUTCFullYear(),
    monthIndex: localDate.getUTCMonth(),
    day: localDate.getUTCDate(),
    weekdayIndex: localDate.getUTCDay(),
    hour: localDate.getUTCHours(),
    minute: localDate.getUTCMinutes(),
  };
}

function formatTimeAmsterdam(value) {
  const parts = toAmsterdamParts(value);
  if (!parts) return "";

  return String(parts.hour).padStart(2, "0") + ":" + String(parts.minute).padStart(2, "0");
}

function formatDateAmsterdam(value) {
  const parts = toAmsterdamParts(value);
  if (!parts) return "";

  return (
    DUTCH_WEEKDAYS[parts.weekdayIndex] +
    " " +
    parts.day +
    " " +
    DUTCH_MONTHS[parts.monthIndex] +
    " " +
    parts.year
  );
}

module.exports = {
  formatDateAmsterdam,
  formatTimeAmsterdam,
  getAmsterdamOffsetHours,
  normalizeUtcString,
  parseUtcDate,
  toAmsterdamParts,
  toUtcString,
};

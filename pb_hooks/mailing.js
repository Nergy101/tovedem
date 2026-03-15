/**
 * Timezone used for all date/time formatting in emails.
 * All dates in PocketBase are stored as UTC, so we need to
 * convert them to Europe/Amsterdam for display in emails.
 *
 * Uses PocketBase's DateTime and Timezone (Go time package) because
 * the goja JSVM does not support Intl/toLocaleTimeString with timeZone.
 */
const TIMEZONE = "Europe/Amsterdam";

// Go time.Format returns English names; map to Dutch
const EN_TO_NL_WEEKDAY = {
  Sunday: "zondag",
  Monday: "maandag",
  Tuesday: "dinsdag",
  Wednesday: "woensdag",
  Thursday: "donderdag",
  Friday: "vrijdag",
  Saturday: "zaterdag",
};

const EN_TO_NL_MONTH = {
  January: "januari",
  February: "februari",
  March: "maart",
  April: "april",
  May: "mei",
  June: "juni",
  July: "juli",
  August: "augustus",
  September: "september",
  October: "oktober",
  November: "november",
  December: "december",
};

/**
 * Format a UTC datetime string to time only (HH:mm) in Amsterdam timezone.
 * Correctly handles DST (CET/CEST) for the specific date.
 *
 * @param {string} utcDateString - Datetime string from PocketBase (UTC, format "YYYY-MM-DD HH:mm:ss.fffZ")
 * @returns {string} Formatted time string (e.g., "20:00")
 */
function formatTimeAmsterdam(utcDateString) {
  if (!utcDateString) return "";
  const normalized = normalizeUtcString(utcDateString);
  const dt = new DateTime(normalized);
  const t = dt.time().in(new Timezone(TIMEZONE));
  const h = t.hour();
  const m = t.minute();
  return ("" + h).padStart(2, "0") + ":" + ("" + m).padStart(2, "0");
}

/**
 * Format a UTC datetime string to date only in Amsterdam timezone.
 * Correctly handles DST (CET/CEST) for the specific date.
 * Uses format() to avoid Go Month/Weekday type conversion issues in goja.
 *
 * @param {string} utcDateString - Datetime string from PocketBase (UTC, format "YYYY-MM-DD HH:mm:ss.fffZ" or "YYYY-MM-DD HH:mm:ss")
 * @returns {string} Formatted date string (e.g., "vrijdag 10 januari 2026")
 */
function formatDateAmsterdam(utcDateString) {
  if (!utcDateString) return "";
  const normalized = normalizeUtcString(utcDateString);
  const dt = new DateTime(normalized);
  const t = dt.time().in(new Timezone(TIMEZONE));
  const weekdayEn = t.format("Monday");
  const monthEn = t.format("January");
  const day = t.format("2");
  const year = t.format("2006");
  const weekdayNl = EN_TO_NL_WEEKDAY[weekdayEn] || weekdayEn;
  const monthNl = EN_TO_NL_MONTH[monthEn] || monthEn;
  return weekdayNl + " " + day + " " + monthNl + " " + year;
}

/**
 * Normalize PocketBase datetime string for correct UTC parsing.
 * PocketBase uses "YYYY-MM-DD HH:mm:ss" (space) but Go's RFC3339/ISO8601
 * expects "YYYY-MM-DDTHH:mm:ss" (T). Without T, the parser misinterprets the string.
 */
function normalizeUtcString(s) {
  if (!s || typeof s !== "string") return s;
  let trimmed = s.trim();
  // Replace space between date and time with T for valid ISO 8601
  if (trimmed.length >= 11 && trimmed[10] === " ") {
    trimmed = trimmed.slice(0, 10) + "T" + trimmed.slice(11);
  }
  if (!trimmed.endsWith("Z") && !/[+-]\d{2}:?\d{2}$/.test(trimmed)) {
    trimmed = trimmed + "Z";
  }
  return trimmed;
}

module.exports = {
  getMail: (mailName) => {
    const filter = `naam = '${mailName}'`;
    const record = $app.findFirstRecordByFilter("mails", filter);

    if (!record) {
      throw new Error($`Mail template '${mailName}' not found`);
    }

    if (record.length > 1) {
      throw new Error(`Multiple mails found with the same name: '${mailName}'`);
    }

    return record;
  },
  getReservatieMailHtml: (mailInfo, reservatie, voorstelling) => {
    const { fillReservatieTemplate } = require("./mailing-template.js");

    // Format times and dates from voorstelling (show times) using Amsterdam timezone
    const tijdOnly1 = formatTimeAmsterdam(voorstelling.get("datum_tijd_1"));
    const datumOnly1 = formatDateAmsterdam(voorstelling.get("datum_tijd_1"));
    const tijdOnly2 = formatTimeAmsterdam(voorstelling.get("datum_tijd_2"));
    const datumOnly2 = formatDateAmsterdam(voorstelling.get("datum_tijd_2"));

    const voorstellingAfbeelding = voorstelling.get("afbeelding")
      ? `https://pocketbase.nergy.space/api/files/${voorstelling.get("collectionId")}/${voorstelling.get("id")}/${voorstelling.get("afbeelding")}`
      : "";

    const data = {
      reserveerdersNaam: reservatie.get("voornaam") + " " + reservatie.get("achternaam"),
      voorstellingsNaam: voorstelling.get("titel"),
      aantal1: reservatie.get("datum_tijd_1_aantal"),
      datum1: datumOnly1,
      tijd1: tijdOnly1,
      islid1: reservatie.get("is_lid_van_vereniging") ? "Ja" : "Nee",
      isvriend1: reservatie.get("is_vriend_van_tovedem") ? "Ja" : "Nee",
      aantal2: reservatie.get("datum_tijd_2_aantal"),
      datum2: datumOnly2,
      tijd2: tijdOnly2,
      islid2: reservatie.get("is_lid_van_vereniging") ? "Ja" : "Nee",
      isvriend2: reservatie.get("is_vriend_van_tovedem") ? "Ja" : "Nee",
      reserveringid: reservatie.get("id"),
      guid: reservatie.get("guid"),
      voorstellingAfbeelding,
    };

    return fillReservatieTemplate(mailInfo.get("inhoud"), data);
  },

  getSintcommissieMailHtml: (mailInfo, verzoek) => {
    $app.logger().info("mailinfo", JSON.stringify(mailInfo));
    $app.logger().info("verzoek", JSON.stringify(verzoek));

    let mailHtml = mailInfo.get("inhoud");

    mailHtml = mailHtml.replace(/{naam}/g, verzoek.get("name"));

    return mailHtml;
  },

  getSintcommissieBeheerMailHtml: (mailInfoBeheer, verzoek) => {
    $app.logger().info("mailinfoBeheer", JSON.stringify(mailInfoBeheer));
    $app.logger().info("verzoek", JSON.stringify(verzoek));

    let mailHtml = mailInfoBeheer.get("inhoud");

    mailHtml = mailHtml.replace(/{naam}/g, verzoek.get("name"));
    mailHtml = mailHtml.replace(/{email}/g, verzoek.get("email"));
    mailHtml = mailHtml.replace(/{message}/g, verzoek.get("message"));

    return mailHtml;
  },

  getVriendWordenMailHtml: (mailInfo, verzoek) => {
    $app.logger().info("mailinfo", JSON.stringify(mailInfo));
    $app.logger().info("verzoek", JSON.stringify(verzoek));

    let mailHtml = mailInfo.get("inhoud");

    mailHtml = mailHtml.replace(/{naam}/g, verzoek.get("name"));

    return mailHtml;
  },

  getVriendWordenBeheerMailHtml: (mailInfoBeheer, verzoek) => {
    $app.logger().info("mailinfoBeheer", JSON.stringify(mailInfoBeheer));
    $app.logger().info("verzoek", JSON.stringify(verzoek));

    let mailHtml = mailInfoBeheer.get("inhoud");

    mailHtml = mailHtml.replace(/{naam}/g, verzoek.get("name"));
    mailHtml = mailHtml.replace(/{email}/g, verzoek.get("email"));
    mailHtml = mailHtml.replace(/{message}/g, verzoek.get("message"));

    return mailHtml;
  },

  getContactMailHtml: (mailInfo, verzoek) => {
    $app.logger().info("mailinfo", JSON.stringify(mailInfo));
    $app.logger().info("verzoek", JSON.stringify(verzoek));

    let mailHtml = mailInfo.get("inhoud");

    mailHtml = mailHtml.replace(/{naam}/g, verzoek.get("name"));

    return mailHtml;
  },

  getContactBeheerMailHtml: (mailInfoBeheer, verzoek) => {
    $app.logger().info("mailinfoBeheer", JSON.stringify(mailInfoBeheer));
    $app.logger().info("verzoek", JSON.stringify(verzoek));

    let mailHtml = mailInfoBeheer.get("inhoud");

    mailHtml = mailHtml.replace(/{naam}/g, verzoek.get("name"));
    mailHtml = mailHtml.replace(/{email}/g, verzoek.get("email"));
    mailHtml = mailHtml.replace(/{message}/g, verzoek.get("message"));

    return mailHtml;
  },

  getNieuweLidAanmeldingMailHtml: (mailInfo, lid) => {
    $app.logger().info("mailinfo", JSON.stringify(mailInfo));
    $app.logger().info("lid", JSON.stringify(lid));

    let mailHtml = mailInfo.get("inhoud");

    // mailHtml = mailHtml.replace(
    //   /{naam}/g,
    //   lid.get("voornaam") + " " + lid.get("achternaam")
    // );

    return mailHtml;
  },

  getNieuweLidAanmeldingBeheerMailHtml: (mailInfoBeheer, lid) => {
    $app.logger().info("mailinfoBeheer", JSON.stringify(mailInfoBeheer));
    $app.logger().info("lid", JSON.stringify(lid));

    let mailHtml = mailInfoBeheer.get("inhoud");

    // text replacements

    return mailHtml;
  },
};

const {
  formatDateAmsterdam,
  formatTimeAmsterdam,
  toUtcString,
} = require("./amsterdam-datetime.js");

function getRecordValue(record, fieldName) {
  if (!record) return null;
  if (record[fieldName] != null && record[fieldName] !== "")
    return record[fieldName];
  if (typeof record.get === "function") return record.get(fieldName);
  return null;
}

// Base URL used for file links inside mails. PocketBase's own app URL is not
// exposed to hooks, so it must come from the environment; the fallback keeps
// existing (development) behaviour when the variable is not set.
const DEFAULT_POCKETBASE_BASE_URL = "https://pocketbase.nergy.space";

function getPocketbaseBaseUrl() {
  try {
    if (typeof $os !== "undefined" && $os.getenv) {
      const url = $os.getenv("POCKETBASE_BASE_URL");
      if (url) return url.replace(/\/+$/, "");
    }
  } catch {
    // $os unavailable (e.g. in unit tests) - fall through to the default
  }
  return DEFAULT_POCKETBASE_BASE_URL;
}

// File URLs accept either the collection id or its name. Prefer the id from the
// record metadata (stable across renames); fall back to the collection name.
function getCollectionIdentifier(record) {
  return (
    getRecordValue(record, "collectionId") ||
    getRecordValue(record, "collectionName") ||
    "voorstellingen"
  );
}

module.exports = {
  getMail: (mailName) => {
    const filter = `naam = '${mailName}'`;
    const record = $app.findFirstRecordByFilter("mails", filter);

    if (!record) {
      throw new Error(`Mail template '${mailName}' not found`);
    }

    if (record.length > 1) {
      throw new Error(`Multiple mails found with the same name: '${mailName}'`);
    }

    return record;
  },
  getReservatieMailHtml: (mailInfo, reservatie, voorstelling) => {
    const { fillReservatieTemplate } = require("./mailing-template.js");

    // Ensure we have UTC strings - record.get() may return string or DateTime object.
    // Passing DateTime to new DateTime() can cause "now" to be used; toUtcString fixes that.
    const datum1Str = toUtcString(voorstelling.get("datum_tijd_1"));
    const datum2Str = toUtcString(voorstelling.get("datum_tijd_2"));

    // Format times and dates from voorstelling (show times) using Amsterdam timezone
    const tijdOnly1 = formatTimeAmsterdam(datum1Str);
    const datumOnly1 = formatDateAmsterdam(datum1Str);
    const tijdOnly2 = formatTimeAmsterdam(datum2Str);
    const datumOnly2 = formatDateAmsterdam(datum2Str);

    const afbeelding = getRecordValue(voorstelling, "afbeelding");
    const voorstellingId = getRecordValue(voorstelling, "id");

    const voorstellingAfbeelding =
      afbeelding && voorstellingId
        ? `${getPocketbaseBaseUrl()}/api/files/${getCollectionIdentifier(voorstelling)}/${voorstellingId}/${afbeelding}`
        : "";

    const data = {
      reserveerdersNaam:
        reservatie.get("voornaam") + " " + reservatie.get("achternaam"),
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
    mailHtml = mailHtml.replace(/{bericht}/g, verzoek.get("message"));

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
    mailHtml = mailHtml.replace(/{bericht}/g, verzoek.get("message"));

    return mailHtml;
  },

  getNieuweLidAanmeldingMailHtml: (mailInfo, lid) => {
    $app.logger().info("mailinfo", JSON.stringify(mailInfo));
    $app.logger().info("lid", JSON.stringify(lid));

    let mailHtml = mailInfo.get("inhoud");

    mailHtml = mailHtml.replace(
      /{naam}/g,
      lid.get("voornaam") + " " + lid.get("achternaam")
    );

    return mailHtml;
  },

  getNieuweLidAanmeldingBeheerMailHtml: (mailInfoBeheer, lid) => {
    $app.logger().info("mailinfoBeheer", JSON.stringify(mailInfoBeheer));
    $app.logger().info("lid", JSON.stringify(lid));

    let mailHtml = mailInfoBeheer.get("inhoud");

    mailHtml = mailHtml.replace(
      /{naam}/g,
      lid.get("voornaam") + " " + lid.get("achternaam")
    );
    mailHtml = mailHtml.replace(/{email}/g, lid.get("email"));
    mailHtml = mailHtml.replace(/{bericht}/g, lid.get("bericht"));

    return mailHtml;
  },
};

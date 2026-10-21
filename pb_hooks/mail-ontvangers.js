/*
 * Bepaalt naar welke adressen de "beheer"-mails van de formulieren gaan.
 * Instelbaar per formulier via de collectie `mail_ontvangers`
 * (velden: `formulier` (text, uniek), `emails` (json array met adressen)).
 * Als er niets (geldigs) is ingesteld, vallen we terug op constants.beheerderEmails
 * zodat er nooit mails verloren gaan.
 */
const constants = require("./constants.js");

const FORMULIEREN = {
  contact: "Contact formulier",
  sinterklaas: "Sinterklaas formulier",
  lid_worden: "Aanmeld formulier (lid worden)",
  vriend_worden: "Vriend worden formulier",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isGeldigEmail(email) {
  return typeof email === "string" && EMAIL_REGEX.test(email);
}

/**
 * Zet een opgeslagen waarde (array, JSON-string of komma/regel-gescheiden tekst)
 * om naar een lijst unieke, geldige e-mailadressen.
 */
function parseOntvangers(value) {
  let lijst = value;

  if (typeof lijst === "string") {
    const tekst = lijst.trim();
    if (tekst === "" || tekst === "null") return [];
    try {
      lijst = JSON.parse(tekst);
    } catch {
      lijst = tekst.split(/[,;\n]/);
    }
  }

  if (!Array.isArray(lijst)) return [];

  const uniek = [];
  for (const item of lijst) {
    if (typeof item !== "string") continue;
    const email = item.trim().toLowerCase();
    if (isGeldigEmail(email) && !uniek.includes(email)) {
      uniek.push(email);
    }
  }
  return uniek;
}

/**
 * Valideert wat er via de beheerpagina wordt opgeslagen.
 * Geeft { fout } of { ontvangers } (genormaliseerd) terug.
 */
function valideerInstelling(formulier, emailsJson) {
  if (!FORMULIEREN[formulier]) {
    return { fout: `Onbekend formulier '${formulier}'.` };
  }

  let ruw;
  try {
    ruw = JSON.parse(emailsJson || "[]");
  } catch {
    return { fout: "Ongeldige lijst met e-mailadressen." };
  }
  if (!Array.isArray(ruw)) {
    return { fout: "Ongeldige lijst met e-mailadressen." };
  }

  const ongeldig = ruw.filter(
    (email) => !isGeldigEmail(String(email || "").trim().toLowerCase())
  );
  if (ongeldig.length > 0) {
    return { fout: `Ongeldige e-mailadressen: ${ongeldig.join(", ")}` };
  }

  const ontvangers = parseOntvangers(ruw);
  if (ontvangers.length === 0) {
    return { fout: "Vul minimaal één e-mailadres in." };
  }
  return { ontvangers: ontvangers };
}

/** Geeft { ontvangers, bron } terug; bron is "ingesteld" of "standaard". */
function getBeheerOntvangersMetBron(formulier) {
  try {
    const record = $app.findFirstRecordByFilter(
      "mail_ontvangers",
      "formulier = {:formulier}",
      { formulier: formulier }
    );
    const ontvangers = parseOntvangers(record.getString("emails"));
    if (ontvangers.length > 0) {
      return { ontvangers: ontvangers, bron: "ingesteld" };
    }
    $app
      .logger()
      .warn("mail_ontvangers leeg, standaard adressen gebruikt", "formulier", formulier);
  } catch (err) {
    $app
      .logger()
      .warn(
        "mail_ontvangers niet gevonden, standaard adressen gebruikt",
        "formulier",
        formulier,
        "error",
        String(err)
      );
  }
  return { ontvangers: constants.beheerderEmails, bron: "standaard" };
}

function getBeheerOntvangers(formulier) {
  return getBeheerOntvangersMetBron(formulier).ontvangers;
}

module.exports = {
  FORMULIEREN,
  isGeldigEmail,
  parseOntvangers,
  valideerInstelling,
  getBeheerOntvangers,
  getBeheerOntvangersMetBron,
};

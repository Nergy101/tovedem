/*
 * Controleert of een voornaam + achternaam + e-mailadres op de sponsorenlijst
 * (collectie `sponsoren`) staat. Gebruikt door het openbare reserveerformulier
 * om "vriend van Tovedem" automatisch aan te vinken.
 *
 * Privacy: de sponsorenlijst zelf verlaat de server nooit; het endpoint geeft
 * alleen true/false terug en alleen bij een exacte match op alle drie de velden.
 */

function normaliseer(waarde) {
  return (typeof waarde === "string" ? waarde : "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/** True als alle drie de velden gevuld zijn; anders wordt er niet gezocht. */
function isCompleet(gegevens) {
  return (
    !!gegevens &&
    normaliseer(gegevens.voornaam) !== "" &&
    normaliseer(gegevens.achternaam) !== "" &&
    normaliseer(gegevens.email).includes("@")
  );
}

/**
 * @param sponsors array van { voornaam, achternaam, email }
 * @param gegevens { voornaam, achternaam, email } uit het formulier
 */
function isSponsorMatch(sponsors, gegevens) {
  if (!isCompleet(gegevens)) return false;
  const voornaam = normaliseer(gegevens.voornaam);
  const achternaam = normaliseer(gegevens.achternaam);
  const email = normaliseer(gegevens.email);

  return (sponsors || []).some(
    (sponsor) =>
      normaliseer(sponsor.voornaam) === voornaam &&
      normaliseer(sponsor.achternaam) === achternaam &&
      normaliseer(sponsor.email) === email
  );
}

/** Zoekt in PocketBase; alleen sponsoren met (ongeveer) hetzelfde e-mailadres worden opgehaald. */
function zoekSponsorMatch(app, gegevens) {
  if (!isCompleet(gegevens)) return false;
  const records = app.findRecordsByFilter(
    "sponsoren",
    "email ~ {:email}",
    "",
    50,
    0,
    { email: normaliseer(gegevens.email) }
  );
  const sponsors = records.map((record) => ({
    voornaam: record.getString("voornaam"),
    achternaam: record.getString("achternaam"),
    email: record.getString("email"),
  }));
  return isSponsorMatch(sponsors, gegevens);
}

module.exports = {
  normaliseer,
  isCompleet,
  isSponsorMatch,
  zoekSponsorMatch,
};

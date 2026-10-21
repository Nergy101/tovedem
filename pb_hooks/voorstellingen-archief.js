/*
 * Automatisch archiveren van voorstellingen.
 * Een voorstelling wordt gearchiveerd zodra er binnen dezelfde groep
 * AANTAL_NA_VOOR_ARCHIEF latere voorstellingen zijn geweest.
 * Voorstellingen met `niet_auto_archiveren` (handmatig teruggezet) blijven staan.
 */
const AANTAL_NA_VOOR_ARCHIEF = 3;

function parseDatum(value) {
  if (!value) return null;
  const tekst = String(value).trim();
  if (tekst === "") return null;
  const datum = new Date(tekst.replace(" ", "T"));
  return isNaN(datum.getTime()) ? null : datum;
}

/** Laatste speeldatum (datum_tijd_2 als die later is dan datum_tijd_1). */
function laatsteSpeeldatum(voorstelling) {
  const datum1 = parseDatum(voorstelling.datum_tijd_1);
  const datum2 = parseDatum(voorstelling.datum_tijd_2);
  if (datum1 && datum2) return datum2 > datum1 ? datum2 : datum1;
  return datum1 || datum2;
}

/**
 * Geeft de ids van voorstellingen die gearchiveerd moeten worden.
 * @param voorstellingen [{ id, groep, datum_tijd_1, datum_tijd_2, gearchiveerd, niet_auto_archiveren }]
 * @param nu Date
 */
function bepaalTeArchiveren(voorstellingen, nu, aantal = AANTAL_NA_VOOR_ARCHIEF) {
  const geweestPerGroep = {};

  for (const voorstelling of voorstellingen) {
    const speeldatum = laatsteSpeeldatum(voorstelling);
    if (!speeldatum || speeldatum > nu) continue;

    const groep = voorstelling.groep || "";
    if (!geweestPerGroep[groep]) geweestPerGroep[groep] = [];
    geweestPerGroep[groep].push({ voorstelling, speeldatum });
  }

  const teArchiveren = [];
  for (const groep of Object.keys(geweestPerGroep)) {
    const geweest = geweestPerGroep[groep].sort(
      (a, b) => b.speeldatum - a.speeldatum
    );
    // De nieuwste `aantal` voorstellingen blijven zichtbaar, de rest heeft er
    // minimaal `aantal` na zich gehad.
    for (const { voorstelling } of geweest.slice(aantal)) {
      if (!voorstelling.gearchiveerd && !voorstelling.niet_auto_archiveren) {
        teArchiveren.push(voorstelling.id);
      }
    }
  }
  return teArchiveren;
}

/** Archiveert in PocketBase; geeft het aantal gearchiveerde voorstellingen terug. */
function archiveerVoorstellingen() {
  const records = $app.findAllRecords("voorstellingen");
  const ids = bepaalTeArchiveren(
    records.map((record) => ({
      id: record.id,
      groep: record.getString("groep"),
      datum_tijd_1: record.getString("datum_tijd_1"),
      datum_tijd_2: record.getString("datum_tijd_2"),
      gearchiveerd: record.getBool("gearchiveerd"),
      niet_auto_archiveren: record.getBool("niet_auto_archiveren"),
    })),
    new Date()
  );

  for (const record of records) {
    if (!ids.includes(record.id)) continue;
    record.set("gearchiveerd", true);
    $app.save(record);
    $app
      .logger()
      .info("Voorstelling automatisch gearchiveerd", "id", record.id, "titel", record.getString("titel"));
  }
  return ids.length;
}

module.exports = {
  AANTAL_NA_VOOR_ARCHIEF,
  laatsteSpeeldatum,
  bepaalTeArchiveren,
  archiveerVoorstellingen,
};

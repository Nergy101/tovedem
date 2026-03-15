/**
 * Pure template replacement for reservation confirmation emails.
 * No PocketBase dependencies - can be tested in Node.js.
 *
 * @param {string} templateHtml - Mail template with {placeholder} tokens
 * @param {object} data - Values to fill in
 * @param {string} data.reserveerdersNaam
 * @param {string} data.voorstellingsNaam
 * @param {number} data.aantal1
 * @param {string} data.datum1
 * @param {string} data.tijd1
 * @param {string} data.islid1 - "Ja" or "Nee"
 * @param {string} data.isvriend1 - "Ja" or "Nee"
 * @param {number} data.aantal2
 * @param {string} data.datum2
 * @param {string} data.tijd2
 * @param {string} data.islid2 - "Ja" or "Nee"
 * @param {string} data.isvriend2 - "Ja" or "Nee"
 * @param {string} data.reserveringid
 * @param {string} data.guid
 * @param {string} data.voorstellingAfbeelding
 * @returns {string} Filled template
 */
function fillReservatieTemplate(templateHtml, data) {
  let html = templateHtml;

  html = html.replace(/{reserveerdersNaam}/g, data.reserveerdersNaam ?? "");
  html = html.replace(/{voorstellingsNaam}/g, data.voorstellingsNaam ?? "");

  html = html.replace(/{aantal1}/g, String(data.aantal1 ?? ""));
  html = html.replace(/{datum1}/g, data.datum1 ?? "");
  html = html.replace(/{tijd1}/g, data.tijd1 ?? "");
  html = html.replace(/{islid1}/g, data.islid1 ?? "");
  html = html.replace(/{isvriend1}/g, data.isvriend1 ?? "");

  html = html.replace(/{aantal2}/g, String(data.aantal2 ?? ""));
  html = html.replace(/{datum2}/g, data.datum2 ?? "");
  html = html.replace(/{tijd2}/g, data.tijd2 ?? "");
  html = html.replace(/{islid2}/g, data.islid2 ?? "");
  html = html.replace(/{isvriend2}/g, data.isvriend2 ?? "");

  html = html.replace(/{reserveringid}/g, data.reserveringid ?? "");
  html = html.replace(/{guid}/g, data.guid ?? "");
  html = html.replace(/{voorstellingAfbeelding}/g, data.voorstellingAfbeelding ?? "");

  return html;
}

module.exports = { fillReservatieTemplate };

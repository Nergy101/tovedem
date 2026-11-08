/* Openbaar endpoint voor het reserveerformulier: staat deze persoon op de sponsorenlijst?
 * Geeft alleen { match: true | false } terug, nooit gegevens van sponsoren. */
routerAdd("POST", "/api/tovedem/sponsoren/check", (e) => {
  const sponsorenCheck = require(`${__hooks}/sponsoren-check.js`);
  const body = e.requestInfo().body || {};

  try {
    const match = sponsorenCheck.zoekSponsorMatch($app, {
      voornaam: body.voornaam,
      achternaam: body.achternaam,
      email: body.email,
    });
    return e.json(200, { match: match });
  } catch (error) {
    $app.logger().error("Error in /api/tovedem/sponsoren/check:", error);
    return e.json(200, { match: false });
  }
});

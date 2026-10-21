/* Archiveer elke nacht voorstellingen waar binnen de groep 3 voorstellingen na zijn geweest */
cronAdd("voorstellingen-archiveren", "15 3 * * *", () => {
  const archief = require(`${__hooks}/voorstellingen-archief.js`);
  const aantal = archief.archiveerVoorstellingen();
  $app.logger().info("Automatisch archiveren voorstellingen klaar", "aantal", aantal);
});

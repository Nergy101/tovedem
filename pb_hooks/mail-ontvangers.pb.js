/* Valideer en normaliseer de ingestelde ontvangers bij opslaan */
onRecordCreateRequest((e) => {
  const mailOntvangers = require(`${__hooks}/mail-ontvangers.js`);
  const resultaat = mailOntvangers.valideerInstelling(
    e.record.getString("formulier"),
    e.record.getString("emails")
  );
  if (resultaat.fout) {
    throw new BadRequestError(resultaat.fout);
  }
  e.record.set("emails", resultaat.ontvangers);
  e.next();
}, "mail_ontvangers");

onRecordUpdateRequest((e) => {
  const mailOntvangers = require(`${__hooks}/mail-ontvangers.js`);
  const resultaat = mailOntvangers.valideerInstelling(
    e.record.getString("formulier"),
    e.record.getString("emails")
  );
  if (resultaat.fout) {
    throw new BadRequestError(resultaat.fout);
  }
  e.record.set("emails", resultaat.ontvangers);
  e.next();
}, "mail_ontvangers");

/* Stuur een testmail naar de ontvangers van een formulier, zodat de beheerder kan controleren dat het werkt */
routerAdd(
  "POST",
  "/api/tovedem/mail-ontvangers/{formulier}/test",
  (e) => {
    const mailOntvangers = require(`${__hooks}/mail-ontvangers.js`);

    const formulier = e.request.pathValue("formulier");
    const label = mailOntvangers.FORMULIEREN[formulier];
    if (!label) {
      throw new BadRequestError(`Onbekend formulier '${formulier}'.`);
    }

    if (!e.hasSuperuserAuth()) {
      $app.expandRecord(e.auth, ["rollen"], null);
      const rollen = (e.auth.expandedAll("rollen") || []).map((r) =>
        r.getString("rol")
      );
      if (!rollen.some((rol) => rol === "admin" || rol === "bestuur")) {
        throw new ForbiddenError("Geen rechten om een testmail te versturen.");
      }
    }

    const { ontvangers, bron } =
      mailOntvangers.getBeheerOntvangersMetBron(formulier);
    const verzondenDoor = e.auth.getString("email") || e.auth.id;

    const html = `
      <p>Dit is een <strong>testmail</strong> van de website van Tovedem.</p>
      <p>Berichten van het <strong>${label}</strong> worden doorgestuurd naar:</p>
      <ul>${ontvangers.map((email) => `<li>${email}</li>`).join("")}</ul>
      <p>${
        bron === "standaard"
          ? "Let op: er zijn nog geen adressen ingesteld, dit zijn de standaard adressen."
          : "Deze adressen zijn ingesteld via de beheerpagina."
      }</p>
      <p>Verstuurd door: ${verzondenDoor}</p>
    `;

    const message = new MailerMessage({
      from: {
        address: $app.settings().meta.senderAddress,
        name: $app.settings().meta.senderName,
      },
      to: ontvangers.map((email) => ({ address: email })),
      subject: `[TEST] Doorsturen ${label}`,
      html: html,
    });

    $app.newMailClient().send(message);
    $app
      .logger()
      .info("Testmail mail_ontvangers verstuurd", "formulier", formulier, "ontvangers", JSON.stringify(ontvangers));

    return e.json(200, { ontvangers: ontvangers, bron: bron });
  },
  $apis.requireAuth()
);

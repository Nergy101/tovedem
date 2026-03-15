/* Send an email after somebody did a reservation */
onRecordAfterCreateSuccess((e) => {
  const mailing = require(`${__hooks}/mailing.js`);

  const reservatie = e.record;
  // Fetch voorstelling by ID to ensure we have datum_tijd_1/datum_tijd_2 (show times),
  // not the reservation's created timestamp
  const voorstellingId = reservatie.get("voorstelling");
  if (!voorstellingId) {
    throw new Error("Reservatie has no voorstelling");
  }
  const voorstelling = $app.findRecordById("voorstellingen", voorstellingId);
  if (!voorstelling) {
    throw new Error("Voorstelling not found: " + voorstellingId);
  }

  const mailInfo = mailing.getMail("reservatie_confirmatie");

  const filledMailTemplate = mailing.getReservatieMailHtml(
    mailInfo,
    reservatie,
    voorstelling
  );

  const message = new MailerMessage({
    from: {
      address: $app.settings().meta.senderAddress,
      name: $app.settings().meta.senderName,
    },
    to: [{ address: e.record.get("email") }],
    subject: mailInfo.get("onderwerp"),
    html: filledMailTemplate,
  });

  $app.newMailClient().send(message);
  e.next();
}, "reserveringen");

//? Dit gingen we toch niet meer doen?

// /* Send an email after somebody updated a reservation */
// onRecordAfterUpdateSuccess((e) => {
//   const mailing = require(`${__hooks}/mailing.js`);

//   const reservatie = e.record;
//   $app.expandRecord(reservatie, ["voorstelling"], null);
//   const voorstelling = reservatie.expandedOne("voorstelling");

//   const mailInfo = mailing.getMail("reservatie_confirmatie");

//   const filledMailTemplate = mailing.getReservatieMailHtml(
//     mailInfo,
//     reservatie,
//     voorstelling
//   );

//   const message = new MailerMessage({
//     from: {
//       address: $app.settings().meta.senderAddress,
//       name: $app.settings().meta.senderName,
//     },
//     to: [{ address: e.record.get("email") }],
//     subject: mailInfo.get("onderwerp"),
//     html: filledMailTemplate,
//   });

//   $app.newMailClient().send(message);
//   e.next();
// }, "reserveringen");

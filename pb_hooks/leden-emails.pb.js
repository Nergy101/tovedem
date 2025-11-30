const constants = require("./constants.js");

/* Send an email after somebody did a nieuwe lid aanmelding */
onRecordAfterCreateSuccess((e) => {
  const mailing = require("./mailing.js");

  const lid = e.record;

  lid.expand("groep");

  const mailInfo = mailing.getMail("lid_worden");

  const filledMailTemplateForNewLid = mailing.getNieuweLidAanmeldingMailHtml(
    mailInfo,
    lid
  );

  const recipient = lid.get("email");
  $app.logger().info("recipient", JSON.stringify(recipient));

  const message = new MailerMessage({
    from: {
      address: $app.settings().meta.senderAddress,
      name: $app.settings().meta.senderName,
    },
    to: [{ address: recipient }],
    subject: mailInfo.get("onderwerp"),
    html: filledMailTemplateForNewLid,
  });

  $app.newMailClient().send(message);

  // send a mail to the beheerders, so they can check the new member registration
  const mailInfoBeheer = mailing.getMail("lid_worden_beheer");
  const filledMailTemplateBeheer = mailing.getNieuweLidAanmeldingBeheerMailHtml(
    mailInfoBeheer,
    lid
  );

  $app
    .logger()
    .info("beheerderEmails", JSON.stringify(constants.beheerderEmails));

  const messageBeheer = new MailerMessage({
    from: {
      address: $app.settings().meta.senderAddress,
      name: $app.settings().meta.senderName,
    },
    to: constants.beheerderEmails.map((email) => ({ address: email })),
    subject: mailInfoBeheer.get("onderwerp"),
    html: filledMailTemplateBeheer,
  });

  $app.newMailClient().send(messageBeheer);
}, "leden");

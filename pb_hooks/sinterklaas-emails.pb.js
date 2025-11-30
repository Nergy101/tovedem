/* Send an email after somebody did a sinterklaas verzoek */
onRecordAfterCreateSuccess((e) => {
  const constants = require(`${__hooks}/constants.js`);
  const mailing = require(`${__hooks}/mailing.js`);

  const verzoek = e.record;

  const mailInfo = mailing.getMail("sintcommissie");

  const filledMailTemplate = mailing.getSintcommissieMailHtml(
    mailInfo,
    verzoek
  );

  const recipient = verzoek.get("email");

  $app.logger().info("recipient", JSON.stringify(recipient));

  const message = new MailerMessage({
    from: {
      address: $app.settings().meta.senderAddress,
      name: $app.settings().meta.senderName,
    },
    to: [{ address: recipient }],
    subject: mailInfo.get("onderwerp"),
    html: filledMailTemplate,
  });

  $app.newMailClient().send(message);
  e.next();

  // send a mail to the sint-commissie themselves, so they can check the request
  const mailInfoBeheer = mailing.getMail("sintcommissie-beheer");
  const filledMailTemplateBeheer = mailing.getSintcommissieBeheerMailHtml(
    mailInfoBeheer,
    verzoek
  );

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
  e.next();
}, "sinterklaas_verzoeken");

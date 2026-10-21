/* Send an email after somebody did a contact verzoek */
onRecordAfterCreateSuccess((e) => {
  const mailOntvangers = require(`${__hooks}/mail-ontvangers.js`);
  const mailing = require(`${__hooks}/mailing.js`);

  const verzoek = e.record;

  const mailInfo = mailing.getMail("contact");

  const filledMailTemplate = mailing.getContactMailHtml(mailInfo, verzoek);

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

  // send a mail to the beheerders, so they can check the request
  const beheerOntvangers = mailOntvangers.getBeheerOntvangers("contact");
  const mailInfoBeheer = mailing.getMail("contact-beheer");
  const filledMailTemplateBeheer = mailing.getContactBeheerMailHtml(
    mailInfoBeheer,
    verzoek
  );

  $app.logger().info("recipient", JSON.stringify(beheerOntvangers));
  const messageBeheer = new MailerMessage({
    from: {
      address: $app.settings().meta.senderAddress,
      name: $app.settings().meta.senderName,
    },
    to: beheerOntvangers.map((email) => ({ address: email })),
    subject: mailInfoBeheer.get("onderwerp"),
    html: filledMailTemplateBeheer,
  });

  $app.newMailClient().send(messageBeheer);
  e.next();
}, "contact_verzoeken");

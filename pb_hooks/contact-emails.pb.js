const constants = require("./constants.js");

/* Send an email after somebody did a contact verzoek */
onRecordAfterCreateSuccess((e) => {
  const mailing = require("./mailing.js");

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
  const mailInfoBeheer = mailing.getMail("contact-beheer");
  const filledMailTemplateBeheer = mailing.getContactBeheerMailHtml(
    mailInfoBeheer,
    verzoek
  );

  $app.logger().info("recipient", JSON.stringify(constants.beheerderEmails));
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
}, "contact_verzoeken");

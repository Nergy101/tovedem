/* Send an email after somebody did a reservation */
onRecordAfterCreateRequest((e) => {
    const mailing = require(`${__hooks}/mailing.js`);

    const reservatie = e.record;
    $app.dao().expandRecord(e.record, ["voorstelling"], null);
    const voorstelling = e.record.expandedOne("voorstelling");

    const mailInfo = mailing.getMail("reservatie_confirmatie");

    const filledMailTemplate = mailing.getReservatieMailHtml(
        mailInfo,
        reservatie,
        voorstelling,
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
}, "reserveringen");

/* Send an email after somebody did a sinterklaas verzoek */
onRecordAfterCreateRequest((e) => {
    const mailing = require(`${__hooks}/mailing.js`);

    const verzoek = e.record;

    const mailInfo = mailing.getMail("sintcommissie");

    const filledMailTemplate = mailing.getSintcommissieMailHtml(
        mailInfo,
        verzoek,
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

    // send a mail to the sint-commissie themselves, so they can check the request
    // ...
    const mailInfoBeheer = mailing.getMail("sintcommissie-beheer");
    const filledMailTemplateBeheer = mailing.getSintcommissieBeheerMailHtml(
        mailInfo,
        verzoek,
    );

    const recipientBeheer = "ptrvlaar@gmail.com";

    $app.logger().info("recipient", JSON.stringify(recipientBeheer));

    const messageBeheer = new MailerMessage({
        from: {
            address: $app.settings().meta.senderAddress,
            name: $app.settings().meta.senderName,
        },
        to: [{ address: recipientBeheer }],
        subject: mailInfoBeheer.get("onderwerp"),
        html: filledMailTemplateBeheer,
    });

    $app.newMailClient().send(messageBeheer);


}, "sinterklaas_verzoeken");

/* Send an email after somebody did a reservation */
onRecordAfterCreateSuccess((e) => {
    const mailing = require(`${__hooks}/mailing.js`);

    const reservatie = e.record;
    $app.expandRecord(reservatie, ["voorstelling"], null);
    const voorstelling = reservatie.expandedOne("voorstelling");

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
onRecordAfterCreateSuccess((e) => {
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
        mailInfoBeheer,
        verzoek,
    );

    const recipientBeheer = "ptrvlaar@gmail.com";

    $app.logger().info("recipient", JSON.stringify({ recipientBeheer }));

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



/* Send an email after somebody did a vriend worden verzoek */
onRecordAfterCreateSuccess((e) => {
    const mailing = require(`${__hooks}/mailing.js`);

    const verzoek = e.record;

    const mailInfo = mailing.getMail("vriend_worden");

    const filledMailTemplate = mailing.getVriendWordenMailHtml(
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

    // send a mail to the vriendworden themselves, so they can check the request
    // ...
    const mailInfoBeheer = mailing.getMail("vriend_worden-beheer");
    const filledMailTemplateBeheer = mailing.getVriendWordenBeheerMailHtml(
        mailInfoBeheer,
        verzoek,
    );

    const recipientBeheer = "ptrvlaar@gmail.com";

    $app.logger().info("recipient", JSON.stringify({ recipientBeheer }));

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
}, "vriend_worden_verzoeken");

/* Send an email after somebody did a vriend worden verzoek */
onRecordAfterCreateSuccess((e) => {
    const mailing = require(`${__hooks}/mailing.js`);

    const verzoek = e.record;

    const mailInfo = mailing.getMail("contact");

    const filledMailTemplate = mailing.getContactMailHtml(
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

    // send a mail to the vriendworden themselves, so they can check the request
    // ...
    const mailInfoBeheer = mailing.getMail("contact-beheer");
    const filledMailTemplateBeheer = mailing.getContactBeheerMailHtml(
        mailInfoBeheer,
        verzoek,
    );

    const recipientBeheer = "ptrvlaar@gmail.com";

    $app.logger().info("recipient", JSON.stringify({ recipientBeheer }));

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
}, "contact_verzoeken");
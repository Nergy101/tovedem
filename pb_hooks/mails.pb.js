

/* Send an email after somebody did a reservation */
onRecordAfterCreateRequest((e) => {
    const mailing = require(`${__hooks}/mailing.js`)

    const reservatie = e.record
    $app.dao().expandRecord(e.record, ["voorstelling"], null)
    const voorstelling = e.record.expandedOne("voorstelling")

    const mailInfo = mailing.getMail("reservatie_confirmatie")

    if (!!mailInfo) {
        throw new Error("Mail template 'reservatie_confirmatie' not found")
    }

    const filledMailTemplate = mailing.getReservatieMailHtml(mailInfo, reservatie, voorstelling)

    const message = new MailerMessage({
        from: {
            address: $app.settings().meta.senderAddress,
            name: $app.settings().meta.senderName,
        },
        to: [{ address: e.record.email() }],
        subject: mailInfo.onderwerp,
        html: filledMailTemplate
    })

    $app.newMailClient().send(message)
}, "reserveringen")

/* Send an email after somebody did a sinterklaas verzoek */
onRecordAfterCreateRequest((e) => {
    const mailing = require(`${__hooks}/mailing.js`)

    const verzoek = e.record

    const mailInfo = mailing.getMail("sintcommissie")

    if (!!mailInfo) {
        throw new Error("Mail template 'sintcommissie' not found")
    }

    const filledMailTemplate = mailing.getSintcommissieMailHtml(mailInfo, verzoek)

    const message = new MailerMessage({
        from: {
            address: $app.settings().meta.senderAddress,
            name: $app.settings().meta.senderName,
        },
        to: [{ address: e.record.email() }],
        subject: mailInfo.onderwerp,
        html: filledMailTemplate
    })

    $app.newMailClient().send(message)
}, "sinterklaas_verzoeken")


/* Send an email after somebody did a sinterklaas verzoek */
onRecordAfterCreateRequest((e) => {
    const mailing = require(`${__hooks}/mailing.js`)

    const verzoek = e.record

    const mailInfo = mailing.getMail("sintcommissie")

    if (!!mailInfo) {
        throw new Error("Mail template 'sintcommissie' not found")
    }

    const filledMailTemplate = mailing.getSintcommissieMailHtml(mailInfo, verzoek)

    const message = new MailerMessage({
        from: {
            address: $app.settings().meta.senderAddress,
            name: $app.settings().meta.senderName,
        },
        to: [{ address: e.record.email() }],
        subject: mailInfo.onderwerp,
        html: filledMailTemplate
    })

    $app.newMailClient().send(message)
}, "sinterklaas_verzoeken")

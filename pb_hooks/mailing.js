module.exports = {
    getMail: (mailName) => {
        const record = $app.dao().findFirstRecordByData("mails", "naam", mailName)
    },
    getReservatieMailHtml: (mailInfo, reservatie, voorstelling) => {

        const tijdOnly1 = new Date(voorstelling.datum_tijd_1).toLocaleTimeString('nl-NL', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const datumOnly1 = new Date(voorstelling.datum_tijd_1).toLocaleDateString('nl-NL', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const tijdOnly2 = new Date(voorstelling.datum_tijd_2).toLocaleTimeString('nl-NL', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const datumOnly2 = new Date(voorstelling.datum_tijd_2).toLocaleDateString('nl-NL', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        let mailHtml = mailInfo.inhoud

        // replace all placeholders with the actual values
        mailHtml = mailHtml.replace(/{{reserveerdersNaam}}/g, reservatie.voornaam + " " + reservatie.achternaam)
        mailHtml = mailHtml.replace(/{{voorstellingsNaam}}/g,)

        mailHtml = mailHtml.replace(/{{aantal1}}/g, reservatie.datum_tijd_1_aantal)
        mailHtml = mailHtml.replace(/{{datum1}}/g, datumOnly)
        mailHtml = mailHtml.replace(/{{tijd1}}/g, tijdOnly1)
        mailHtml = mailHtml.replace(/{{islid1}}/g, reservatie.is_lid_van_vereniging ? "Ja" : "Nee")
        mailHtml = mailHtml.replace(/{{isvriend1}}/g, reservatie.is_vriend_van_tovedem ? "Ja" : "Nee")

        mailHtml = mailHtml.replace(/{{aantal2}}/g, reservatie.datum_tijd_2_aantal)
        mailHtml = mailHtml.replace(/{{datum2}}/g, datumOnly2)
        mailHtml = mailHtml.replace(/{{tijd2}}/g, tijdOnly2)
        mailHtml = mailHtml.replace(/{{islid2}}/g, reservatie.is_lid_van_vereniging ? "Ja" : "Nee")
        mailHtml = mailHtml.replace(/{{isvriend2}}/g, reservatie.is_vriend_van_tovedem ? "Ja" : "Nee")

        mailHtml = mailHtml.replace(/{{reserveringid}}/g, reservatie.id)
        mailHtml = mailHtml.replace(/{{guid}}/g, reservatie.guid)

        return mailHtml
    },
    getSintcommissieMailHtml: (mailInfo, verzoek) => {
        let mailHtml = mailInfo.inhoud

        mailHtml = mailHtml.replace(/{{naam}}/g, verzoek.name)

        return mailHtml;
    }
}
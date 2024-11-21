module.exports = {
    getMail: (mailName) => {
        const filter = `naam = '${mailName}'`;
        const record = $app.dao().findFirstRecordByFilter("mails", filter);

        if (!mailInfo) {
            throw new Error("Mail template 'sintcommissie' not found");
        }

        if (record.length > 1) {
            throw new Error(
                "Multiple mails found with the same name: " + mailName,
            );
        }

        return record;
    },
    getReservatieMailHtml: (mailInfo, reservatie, voorstelling) => {
        const tijdOnly1 = new Date(
            voorstelling.get("datum_tijd_1"),
        ).toLocaleTimeString("nl-NL", {
            hour: "2-digit",
            minute: "2-digit",
        });

        const datumOnly1 = new Date(
            voorstelling.get("datum_tijd_1"),
        ).toLocaleDateString("nl-NL", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });

        const tijdOnly2 = new Date(
            voorstelling.get("datum_tijd_2"),
        ).toLocaleTimeString("nl-NL", {
            hour: "2-digit",
            minute: "2-digit",
        });

        const datumOnly2 = new Date(
            voorstelling.get("datum_tijd_2"),
        ).toLocaleDateString("nl-NL", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });

        let mailHtml = mailInfo.get("inhoud");

        // replace all placeholders with the actual values
        mailHtml = mailHtml.replace(
            /{reserveerdersNaam}/g,
            reservatie.get("voornaam") + " " + reservatie.get("achternaam"),
        );
        mailHtml = mailHtml.replace(/{voorstellingsNaam}/g, voorstelling.get("titel"));

        mailHtml = mailHtml.replace(
            /{aantal1}/g,
            reservatie.get("datum_tijd_1_aantal"),
        );
        mailHtml = mailHtml.replace(/{datum1}/g, datumOnly);
        mailHtml = mailHtml.replace(/{tijd1}/g, tijdOnly1);
        mailHtml = mailHtml.replace(
            /{islid1}/g,
            reservatie.get("is_lid_van_vereniging") ? "Ja" : "Nee",
        );
        mailHtml = mailHtml.replace(
            /{isvriend1}/g,
            reservatie.get("is_vriend_van_tovedem") ? "Ja" : "Nee",
        );

        mailHtml = mailHtml.replace(
            /{aantal2}/g,
            reservatie.get("datum_tijd_2_aantal"),
        );
        mailHtml = mailHtml.replace(/{datum2}/g, datumOnly2);
        mailHtml = mailHtml.replace(/{tijd2}/g, tijdOnly2);
        mailHtml = mailHtml.replace(
            /{islid2}/g,
            reservatie.get("is_lid_van_vereniging") ? "Ja" : "Nee",
        );
        mailHtml = mailHtml.replace(
            /{isvriend2}/g,
            reservatie.get("is_vriend_van_tovedem") ? "Ja" : "Nee",
        );

        mailHtml = mailHtml.replace(/{reserveringid}/g, reservatie.get("id"));
        mailHtml = mailHtml.replace(/{guid}/g, reservatie.get("guid"));

        return mailHtml;
    },
    getSintcommissieMailHtml: (mailInfo, verzoek) => {
        $app.logger().info("mailinfo", JSON.stringify(mailInfo));
        $app.logger().info("verzoek", JSON.stringify(verzoek));

        let mailHtml = mailInfo.get("inhoud");

        mailHtml = mailHtml.replace(/{naam}/g, verzoek.get("name"));

        return mailHtml;
    },

    getSintcommissieBeheerMailHtml: (mailInfoBeheer, verzoek) => {
        $app.logger().info("mailinfoBeheer", JSON.stringify(Beheer));
        $app.logger().info("verzoek", JSON.stringify(verzoek));

        let mailHtml = mailInfo.get("inhoud");

        mailHtml = mailHtml.replace(/{naam}/g, verzoek.get("name"));
        mailHtml = mailHtml.replace(/{email}/g, verzoek.get("email"));
        mailHtml = mailHtml.replace(/{message}/g, verzoek.get("message"));

        return mailHtml;
    },
    
};

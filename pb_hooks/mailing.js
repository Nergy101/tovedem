const {
  formatDateAmsterdam,
  formatTimeAmsterdam,
  toUtcString,
} = require("./amsterdam-datetime.js");

module.exports = {
  getMail: (mailName) => {
    const filter = `naam = '${mailName}'`;
    const record = $app.findFirstRecordByFilter("mails", filter);

    if (!record) {
      throw new Error($`Mail template '${mailName}' not found`);
    }

    if (record.length > 1) {
      throw new Error(`Multiple mails found with the same name: '${mailName}'`);
    }

    return record;
  },
  getReservatieMailHtml: (mailInfo, reservatie, voorstelling) => {
    const { fillReservatieTemplate } = require("./mailing-template.js");

    // Ensure we have UTC strings - record.get() may return string or DateTime object.
    // Passing DateTime to new DateTime() can cause "now" to be used; toUtcString fixes that.
    const datum1Str = toUtcString(voorstelling.get("datum_tijd_1"));
    const datum2Str = toUtcString(voorstelling.get("datum_tijd_2"));

    // Format times and dates from voorstelling (show times) using Amsterdam timezone
    const tijdOnly1 = formatTimeAmsterdam(datum1Str);
    const datumOnly1 = formatDateAmsterdam(datum1Str);
    const tijdOnly2 = formatTimeAmsterdam(datum2Str);
    const datumOnly2 = formatDateAmsterdam(datum2Str);

    const voorstellingAfbeelding = voorstelling.get("afbeelding")
      ? `https://pocketbase.nergy.space/api/files/${voorstelling.get("collectionId")}/${voorstelling.get("id")}/${voorstelling.get("afbeelding")}`
      : "";

    const data = {
      reserveerdersNaam: reservatie.get("voornaam") + " " + reservatie.get("achternaam"),
      voorstellingsNaam: voorstelling.get("titel"),
      aantal1: reservatie.get("datum_tijd_1_aantal"),
      datum1: datumOnly1,
      tijd1: tijdOnly1,
      islid1: reservatie.get("is_lid_van_vereniging") ? "Ja" : "Nee",
      isvriend1: reservatie.get("is_vriend_van_tovedem") ? "Ja" : "Nee",
      aantal2: reservatie.get("datum_tijd_2_aantal"),
      datum2: datumOnly2,
      tijd2: tijdOnly2,
      islid2: reservatie.get("is_lid_van_vereniging") ? "Ja" : "Nee",
      isvriend2: reservatie.get("is_vriend_van_tovedem") ? "Ja" : "Nee",
      reserveringid: reservatie.get("id"),
      guid: reservatie.get("guid"),
      voorstellingAfbeelding,
    };

    return fillReservatieTemplate(mailInfo.get("inhoud"), data);
  },

  getSintcommissieMailHtml: (mailInfo, verzoek) => {
    $app.logger().info("mailinfo", JSON.stringify(mailInfo));
    $app.logger().info("verzoek", JSON.stringify(verzoek));

    let mailHtml = mailInfo.get("inhoud");

    mailHtml = mailHtml.replace(/{naam}/g, verzoek.get("name"));

    return mailHtml;
  },

  getSintcommissieBeheerMailHtml: (mailInfoBeheer, verzoek) => {
    $app.logger().info("mailinfoBeheer", JSON.stringify(mailInfoBeheer));
    $app.logger().info("verzoek", JSON.stringify(verzoek));

    let mailHtml = mailInfoBeheer.get("inhoud");

    mailHtml = mailHtml.replace(/{naam}/g, verzoek.get("name"));
    mailHtml = mailHtml.replace(/{email}/g, verzoek.get("email"));
    mailHtml = mailHtml.replace(/{message}/g, verzoek.get("message"));

    return mailHtml;
  },

  getVriendWordenMailHtml: (mailInfo, verzoek) => {
    $app.logger().info("mailinfo", JSON.stringify(mailInfo));
    $app.logger().info("verzoek", JSON.stringify(verzoek));

    let mailHtml = mailInfo.get("inhoud");

    mailHtml = mailHtml.replace(/{naam}/g, verzoek.get("name"));

    return mailHtml;
  },

  getVriendWordenBeheerMailHtml: (mailInfoBeheer, verzoek) => {
    $app.logger().info("mailinfoBeheer", JSON.stringify(mailInfoBeheer));
    $app.logger().info("verzoek", JSON.stringify(verzoek));

    let mailHtml = mailInfoBeheer.get("inhoud");

    mailHtml = mailHtml.replace(/{naam}/g, verzoek.get("name"));
    mailHtml = mailHtml.replace(/{email}/g, verzoek.get("email"));
    mailHtml = mailHtml.replace(/{message}/g, verzoek.get("message"));

    return mailHtml;
  },

  getContactMailHtml: (mailInfo, verzoek) => {
    $app.logger().info("mailinfo", JSON.stringify(mailInfo));
    $app.logger().info("verzoek", JSON.stringify(verzoek));

    let mailHtml = mailInfo.get("inhoud");

    mailHtml = mailHtml.replace(/{naam}/g, verzoek.get("name"));

    return mailHtml;
  },

  getContactBeheerMailHtml: (mailInfoBeheer, verzoek) => {
    $app.logger().info("mailinfoBeheer", JSON.stringify(mailInfoBeheer));
    $app.logger().info("verzoek", JSON.stringify(verzoek));

    let mailHtml = mailInfoBeheer.get("inhoud");

    mailHtml = mailHtml.replace(/{naam}/g, verzoek.get("name"));
    mailHtml = mailHtml.replace(/{email}/g, verzoek.get("email"));
    mailHtml = mailHtml.replace(/{message}/g, verzoek.get("message"));

    return mailHtml;
  },

  getNieuweLidAanmeldingMailHtml: (mailInfo, lid) => {
    $app.logger().info("mailinfo", JSON.stringify(mailInfo));
    $app.logger().info("lid", JSON.stringify(lid));

    let mailHtml = mailInfo.get("inhoud");

    // mailHtml = mailHtml.replace(
    //   /{naam}/g,
    //   lid.get("voornaam") + " " + lid.get("achternaam")
    // );

    return mailHtml;
  },

  getNieuweLidAanmeldingBeheerMailHtml: (mailInfoBeheer, lid) => {
    $app.logger().info("mailinfoBeheer", JSON.stringify(mailInfoBeheer));
    $app.logger().info("lid", JSON.stringify(lid));

    let mailHtml = mailInfoBeheer.get("inhoud");

    // text replacements

    return mailHtml;
  },
};

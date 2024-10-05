//* This script is used to send an email to the user after a reservation is made
onRecordAfterCreateRequest((e) => {
  console.log("reservering aangemaakt", JSON.stringify(e.record));

  const guid = require("uuid");
  const reserveringGuid = guid.v4();
  e.record.set("guid", reserveringGuid);
  $app.dao().saveRecord(e.record);

  //* Find all actual variable values
  const gemaakteReservering = e.record;

  const ontvangerEmail = gemaakteReservering.get("email");
  const datum1 = gemaakteReservering.get("datum1");
  const datum2 = gemaakteReservering.get("datum2");
  const datum1Aantal = gemaakteReservering.get("datum1_aantal");
  const datum2Aantal = gemaakteReservering.get("datum2_aantal");
  const voorstellingsNaam = gemaakteReservering.get("voorstelling_naam");
  const isLid = gemaakteReservering.get("is_lid");
  const isVriend = gemaakteReservering.get("is_vriend");
  const reserveerdersNaam = `${gemaakteReservering.get(
    "voornaam"
  )} ${gemaakteReservering.get("achternaam")}`;

  const reserveringid = gemaakteReservering.get("id");

  //! fix
  const datum1Tijd = gemaakteReservering.get("datum1_tijd");
  const datum2Tijd = gemaakteReservering.get("datum2_tijd");

  //* Get the Reservatie Confirmatie email template
  const email = $app
    .dao()
    .findFirstRecordByData("mails", "naam", "Reservatie Confirmatie");

  let emailHtml = email.get("inhoud");

  //* Fill in all the variables
  emailHtml.replaceAll("{reserveerdersNaam}", reserveerdersNaam);
  emailHtml.replaceAll("{voorstellingsNaam}", voorstellingsNaam);

  emailHtml.replaceAll("{datum1}", datum1);
  emailHtml.replaceAll("{datum2}", datum2);

  emailHtml.replaceAll("{tijd1}", datum1Tijd);
  emailHtml.replaceAll("{tijd2}", datum2Tijd);

  emailHtml.replaceAll("{aantal1}", datum1Aantal);
  emailHtml.replaceAll("{aantal2}", datum2Aantal);

  emailHtml.replaceAll("{islid1}", isLid);
  emailHtml.replaceAll("{isvriend1}", isVriend);
  emailHtml.replaceAll("{islid2}", isLid);
  emailHtml.replaceAll("{isvriend2}", isVriend);

  emailHtml.replaceAll("{reserveringid}", reserveringid);
  emailHtml.replaceAll("{guid}", reserveringGuid);

  //* Send the email
  sendMail(
    "Reservering bevestiging",
    ontvangerEmail,
    reserveerdersNaam,
    emailHtml
  );
}, "reserveringen");

void sendMail(subject, receiverEmailAddress, receiverName, mailHtml);
{
  //* create mailjet client
  const mailjetClient = require("node-mailjet").apiConnect(
    process.env.MJ_APIKEY_PUBLIC, // from system environment variables
    process.env.MJ_APIKEY_PRIVATE // from system environment variables
  );

  //* create the request
  const request = mailjetClient.post("send", { version: "v3.1" }).request({
    Messages: [
      {
        From: {
          Email: "tovedem@tovedem.nl",
          Name: "Tovedem",
        },
        To: [
          {
            Email: receiverEmailAddress,
            Name: receiverName,
          },
        ],
        Subject: subject,
        HtmlPart: mailHtml,
      },
    ],
  });

  //* send the request and log response
  request
    .then((result) => {
      console.log(result.body);
    })
    .catch((err) => {
      console.error(err.statusCode, err.message);
    });
}

mailjetSendMail();
{
  /**
   *
   * This call sends a message to the given recipient with vars and custom vars.
   *
   */
  const mailjet = require("node-mailjet").connect(
    {
      BASE_URL: "https://app.mailjet.com",
      NODE_ENV: "production",
      PREPROD: false,
    }.MJ_APIKEY_PUBLIC,
    {
      BASE_URL: "https://app.mailjet.com",
      NODE_ENV: "production",
      PREPROD: false,
    }.MJ_APIKEY_PRIVATE
  );

  const request = mailjet.post("send", { version: "v3.1" }).request({
    Messages: [
      {
        From: {
          Email: "tovedem@nergy.space",
          Name: "Tovedem",
        },
        To: [
          {
            Email: "passenger1@example.com",
            Name: "passenger 1",
          },
        ],
        TemplateID: 6164850,
        TemplateLanguage: true,
        Subject: "Welkom bij Tovedem",
        Variables: {
          voorstelling_1_datum: e.record.get("datum1"),
          voorstelling_1_tijd: e.record.get("datum1_tijd"),
          voorstelling_2_datum: e.record.get("datum2"),
          voorstelling_2_tijd: e.record.get("datum2_tijd"),
          voorstelling_1_aantal: e.record.get("datum1_aantal"),
          voorstelling_2_aantal: e.record.get("datum2_aantal"),
        },
      },
    ],
  });
  request
    .then((result) => {
      console.log(result.body);
    })
    .catch((err) => {
      console.log(err.statusCode);
    });
}

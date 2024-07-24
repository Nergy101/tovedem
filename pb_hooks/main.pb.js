// fires only for "users" and "members"
onRecordAfterCreateRequest((e) => {
  console.log("reservering aangemaakt", JSON.stringify(e.record));
  console.log("voornaam", JSON.stringify(e.record.get("voornaam")));

  const groepsNaam = "Tovedem";
  const voorstellingsTijd1 = "18 januari 2024 om 18:00";
  const voorstellingsTijd2 = "19 januari 2024 om 19:00";

  const html = `
    <h1> Bedankt dat je komt kijken naar ${groepsNaam}! </h1>

    <p>
      Beste ${e.record.get("voornaam")}, bedankt voor je reservatie(s).

      Hieronder kan je ze zien:
    </p>

    <ul>
      <li>Voor ${e.record.get(
        "datum_tijd_1_aantal"
      )} persoon/personen op ${voorstellingsTijd1}.</li>
      <li>Voor ${e.record.get(
        "datum_tijd_2_aantal"
      )} persoon/personen op ${voorstellingsTijd2}.</li>
    </ul>

    <p>
      Tot dan!

      Groeten,
      Tovedem De Meern
    </p>
    `;

  try {
    const message = new MailerMessage({
      from: {
        address: $app.settings().meta.senderAddress,
        name: $app.settings().meta.senderName,
      },
      to: [{ address: e.record.email() }],
      subject: "Reservering bij Tovedem",
      html: html,
    });

    $app.newMailClient().send(message);
    console.log("reserverings email verstuurd");
  } catch (err) {
    console.log("something went wrong", JSON.stringify(err));
  }
}, "reserveringen");


mailjetSendMail()
{
  /**
 *
 * This call sends a message to the given recipient with vars and custom vars.
 *
 */
const mailjet = require ('node-mailjet')
	.connect({"BASE_URL":"https://app.mailjet.com","NODE_ENV":"production","PREPROD":false}.MJ_APIKEY_PUBLIC, {"BASE_URL":"https://app.mailjet.com","NODE_ENV":"production","PREPROD":false}.MJ_APIKEY_PRIVATE)

  const request = mailjet
	.post("send", {'version': 'v3.1'})
	.request({
		"Messages":[
			{
				"From": {
					"Email": "tovedem@nergy.space",
					"Name": "Tovedem"
				},
				"To": [
					{
						"Email": "passenger1@example.com",
						"Name": "passenger 1"
					}
				],
				"TemplateID": 6164850,
				"TemplateLanguage": true,
				"Subject": "Welkom bij Tovedem",
				"Variables": {
          "voorstelling_1_datum": e.record.get("datum1"),
          "voorstelling_1_tijd": e.record.get("datum1_tijd"),
          "voorstelling_2_datum": e.record.get("datum2"),
          "voorstelling_2_tijd": e.record.get("datum2_tijd"),
          "voorstelling_1_aantal": e.record.get("datum1_aantal"),
          "voorstelling_2_aantal": e.record.get("datum2_aantal"),
        }
			}
		]
	})
request
	.then((result) => {
		console.log(result.body)
	})
	.catch((err) => {
		console.log(err.statusCode)
	})
}
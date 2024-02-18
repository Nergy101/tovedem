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

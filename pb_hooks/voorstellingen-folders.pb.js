/* Automatically create a voorstellingen_folders record when a voorstelling is created */
onRecordAfterCreateSuccess((e) => {
  const voorstelling = e.record;

  // Extract jaar from datum_tijd_1
  const datumTijd1 = voorstelling.get("datum_tijd_1");
  const jaar = new Date(datumTijd1).getFullYear();

  // Create voorstellingen_folders record
  const foldersCollection = $app.findCollectionByNameOrId(
    "voorstellingen_folders"
  );
  const newFolder = new Record(foldersCollection);

  newFolder.set("naam", voorstelling.get("titel"));
  newFolder.set("jaar", jaar);
  newFolder.set("voorstelling", voorstelling.id);

  $app.save(newFolder);
}, "voorstellingen");

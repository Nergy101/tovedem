/**
 * Importeert een mappenstructuur met foto's als (oude) voorstellingen + galerij-albums.
 *
 * Verwachte structuur:
 *   <root>/<Groep>/<Jaar>/<Maand>/<(Titel)>/*.jpg
 *
 *   In plaats van een map kunnen ook één of meer zips worden opgegeven (bv. een Google
 *   Drive-download, die bij grote mappen in delen -001.zip, -002.zip, ... komt). Alle zips
 *   worden samen uitgepakt; extra bovenliggende mappen (zoals `Takeout/Google Drive/Fotos`)
 *   worden overgeslagen: een groepmap is elke map die een jaartal-map bevat.
 *
 *   Groep  - naam uit de collectie `groepen` (bv. Tovedem, Mejoto's, Cloos); hoofdletters
 *            en leestekens worden genegeerd.
 *   Jaar   - bv. 2019
 *   Maand  - nummer (3, 03, "03 - maart") of Nederlandse naam (maart, mrt)
 *   Titel  - tekst tussen haakjes wordt als titel gebruikt, anders de hele mapnaam.
 *
 *   Ook de platte variant (zoals in de Google Drive-map) wordt herkend:
 *     <root>/<Groep> <Jaar> <maand> (<Titel>)/[Portretten|Voorstelling|...]/*.jpg
 *   Alle foto's uit de submappen komen in hetzelfde album.
 *
 *   Mappen die geen van beide vormen hebben, kunnen via --mapping <json> worden gekoppeld:
 *     { "Mejotos 2010 kerst": { "groep": "Mejoto's", "jaar": 2010, "maand": 12, "titel": "..." },
 *       "Oude rommel": { "overslaan": true } }
 *   Mappen met foto's die niet worden herkend, worden als waarschuwing gemeld.
 *
 *   Een map met .zip-bestanden wordt behandeld alsof al die zips zijn opgegeven.
 *
 * Per titel-map:
 *   1. Voorstelling aanmaken (of hergebruiken als die al bestaat) op de 1e van de maand,
 *      regie/omschrijving "-", eerste foto als poster.
 *   2. Album (voorstellingen_folders) zoeken (de pb_hook maakt die automatisch aan) of
 *      aanmaken, met jaar, naam en koppeling naar de voorstelling.
 *   3. Foto's uploaden; foto's die al in het album staan worden overgeslagen.
 *
 * Gebruik:
 *   PB_URL=https://... PB_EMAIL=... PB_PASSWORD=... node scripts/import-galerij.mjs <map|zip>... [--dry-run]
 *
 *   PB_AUTH_COLLECTION (optioneel, standaard `_superusers`) - collectie om mee in te loggen.
 */
import { execFile } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { copyFile, mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { promisify } from 'node:util';
import { DateTime } from 'luxon';
import PocketBase from 'pocketbase';
import yauzl from 'yauzl';

const execFileAsync = promisify(execFile);
const OPTIMIZT_CLI = path.join(
  path.dirname(createRequire(import.meta.url).resolve('@funboxteam/optimizt')),
  'cli.js'
);

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const FOTO_FIELDS = ['fotos', 'fotos_2', 'fotos_3', 'fotos_4', 'fotos_5'];
const FOTOS_PER_FIELD = 99; // gelijk aan folder-photo-upload-dialog
const MAX_BESTANDSGROOTTE = 5 * 1024 * 1024; // standaard maxSize van PocketBase-bestandsvelden
const MAX_TITEL = 30; // max. lengte van voorstellingen.titel
const PB_SUFFIX_REGEX = /^[a-z0-9]{10}$/; // PocketBase plakt 10 willekeurige tekens achter de naam
const VOORSTELLING_TIJD = { hour: 20, minute: 0 }; // 20:00 Amsterdam, houdt de datum in UTC op dezelfde dag

const MAANDEN = [
  ['januari', 'jan'],
  ['februari', 'feb'],
  ['maart', 'mrt', 'mar'],
  ['april', 'apr'],
  ['mei'],
  ['juni', 'jun'],
  ['juli', 'jul'],
  ['augustus', 'aug'],
  ['september', 'sep', 'sept'],
  ['oktober', 'okt', 'oct'],
  ['november', 'nov'],
  ['december', 'dec'],
];

function normalizeGroepNaam(naam) {
  return naam.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Zelfde als PocketBase' inflector.Snakecase, waarmee bestandsnamen bij opslaan worden omgezet. */
function pbSnakecase(tekst) {
  return tekst
    .split(/[\W_]+/)
    .filter(Boolean)
    .map((woord) => woord.replace(/(?<=[^A-Z])([A-Z])/g, '_$1'))
    .join('_')
    .toLowerCase();
}

/**
 * Maakt een lokale en een opgeslagen bestandsnaam vergelijkbaar: img_5311.jpg == img_5311_xtm737c7rw.jpg.
 * PocketBase zet de naam bij opslaan om naar snake_case
 * ("MeJoTo_s 2006 133.jpg" -> "me_jo_to_s_2006_133_pk3zbo0h7b.jpg"), dus dat doen we hier ook.
 */
function normalizeFilename(name) {
  const lastDotIndex = name.lastIndexOf('.');
  if (lastDotIndex === -1) return pbSnakecase(name);

  let base = name.substring(0, lastDotIndex);
  const ext = name.substring(lastDotIndex).toLowerCase();
  const lastUnderscoreIndex = base.lastIndexOf('_');
  if (lastUnderscoreIndex !== -1 && PB_SUFFIX_REGEX.test(base.substring(lastUnderscoreIndex + 1))) {
    base = base.substring(0, lastUnderscoreIndex);
  }
  return pbSnakecase(base) + ext;
}

function parseJaar(naam) {
  const match = naam.trim().match(/^(\d{4})$/);
  return match ? Number(match[1]) : null;
}

function parseMaand(naam) {
  const lower = naam.trim().toLowerCase();
  const nummer = lower.match(/^(\d{1,2})(?!\d)/);
  if (nummer) {
    const maand = Number(nummer[1]);
    return maand >= 1 && maand <= 12 ? maand : null;
  }
  const woord = lower.match(/^[a-z]+/)?.[0];
  if (!woord) return null;
  const index = MAANDEN.findIndex((namen) => namen.includes(woord));
  return index === -1 ? null : index + 1;
}

function parseTitel(naam) {
  const tussenHaakjes = naam.match(/\(([^)]*)\)?/);
  return (tussenHaakjes ? tussenHaakjes[1] : naam).trim();
}

/** Platte mapnaam zoals in de Google Drive-export: "Tovedem 2017 november (Tante van Charlie)". */
function parsePlatteMapnaam(naam) {
  const match = naam.match(/^(.+?)\s+(\d{4})\s+([^\s(]+)\s*(\(.*)$/);
  if (!match) return null;
  const [, groepNaam, jaar, maandNaam, rest] = match;
  return { groepNaam, jaar: Number(jaar), maand: parseMaand(maandNaam), titel: parseTitel(rest) };
}

async function subdirs(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && !e.name.startsWith('.') && e.name !== '__MACOSX')
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b, 'nl', { numeric: true }));
}

async function findImages(dir) {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  return entries
    .filter(
      (e) =>
        e.isFile() &&
        !e.name.startsWith('.') &&
        IMAGE_EXTENSIONS.has(path.extname(e.name).toLowerCase())
    )
    .map((e) => path.join(e.parentPath, e.name))
    .sort((a, b) => a.localeCompare(b, 'nl', { numeric: true }));
}

/** Zoekt de groepmappen: mappen die minstens één jaartal-map bevatten. */
async function findGroepPaths(dir, diepte = 0) {
  const kinderen = await subdirs(dir);
  if (kinderen.some((naam) => parseJaar(naam))) return [dir];
  if (diepte >= 5) return [];

  const gevonden = [];
  for (const kind of kinderen) {
    gevonden.push(...(await findGroepPaths(path.join(dir, kind), diepte + 1)));
  }
  return gevonden;
}

/**
 * Zoekt mappen met een platte naam "<Groep> <Jaar> <maand> (<Titel>)", of een mapnaam die
 * in de mapping staat ({ groep, jaar, maand, titel } of { overslaan: true }).
 */
async function findPlatteMappen(dir, mapping, diepte = 0) {
  const gevonden = [];
  for (const kind of await subdirs(dir)) {
    const kindPath = path.join(dir, kind);
    const gemapt = mapping[kind.trim()];
    if (gemapt?.overslaan) continue;
    const info = gemapt
      ? { groepNaam: gemapt.groep, jaar: gemapt.jaar, maand: parseMaand(String(gemapt.maand)), titel: gemapt.titel?.trim() }
      : parsePlatteMapnaam(kind);
    if (info) {
      gevonden.push({ ...info, pad: kindPath });
    } else if (diepte < 5) {
      gevonden.push(...(await findPlatteMappen(kindPath, mapping, diepte + 1)));
    }
  }
  return gevonden;
}

// Drive-mapnamen kunnen eindigen op een spatie ("Overig "), wat Windows niet toestaat.
function veiligeNaam(segment) {
  const schoon = segment.replace(/[<>:"|?*\x00-\x1f]/g, '_').replace(/[ .]+$/, '');
  return schoon || '_';
}

/** Pakt een zip streamend uit (ook zips van 2 GB+), met opgeschoonde bestandsnamen. */
async function unzip(zipPath, doelDir) {
  const zip = await new Promise((resolve, reject) =>
    yauzl.open(zipPath, { lazyEntries: true }, (error, zipfile) => (error ? reject(error) : resolve(zipfile)))
  );
  const openStream = promisify(zip.openReadStream.bind(zip));

  await new Promise((resolve, reject) => {
    zip.on('error', reject);
    zip.on('end', resolve);
    zip.on('entry', async (entry) => {
      try {
        if (!entry.fileName.endsWith('/')) {
          const doel = path.join(doelDir, ...entry.fileName.split('/').map(veiligeNaam));
          await mkdir(path.dirname(doel), { recursive: true });
          await pipeline(await openStream(entry), createWriteStream(doel));
        }
        zip.readEntry();
      } catch (error) {
        zip.close();
        reject(error);
      }
    });
    zip.readEntry();
  });
}

/** Loopt de mappenstructuur af en geeft per titel-map een import-item terug. */
async function scan(root, mapping) {
  const items = [];
  const warnings = [];

  for (const groepPath of await findGroepPaths(root)) {
    const groepDir = path.basename(groepPath);
    for (const jaarDir of await subdirs(groepPath)) {
      const jaar = parseJaar(jaarDir);
      if (!jaar) {
        warnings.push(`Overgeslagen, geen geldig jaar: ${path.join(groepDir, jaarDir)}`);
        continue;
      }
      const jaarPath = path.join(groepPath, jaarDir);
      for (const maandDir of await subdirs(jaarPath)) {
        const maand = parseMaand(maandDir);
        if (!maand) {
          warnings.push(
            `Overgeslagen, geen geldige maand: ${path.join(groepDir, jaarDir, maandDir)}`
          );
          continue;
        }
        const maandPath = path.join(jaarPath, maandDir);
        for (const titelDir of await subdirs(maandPath)) {
          const titelPath = path.join(maandPath, titelDir);
          const fotos = await findImages(titelPath);
          const titel = parseTitel(titelDir);
          if (!titel) {
            warnings.push(`Overgeslagen, lege titel: ${titelPath}`);
            continue;
          }
          items.push({ groepNaam: groepDir, jaar, maand, titel, pad: titelPath, fotos });
        }
      }
    }
  }

  const behandeld = new Set();
  for (const map of await findPlatteMappen(root, mapping)) {
    const naam = path.basename(map.pad);
    const fotos = await findImages(map.pad);
    fotos.forEach((foto) => behandeld.add(foto));
    if (!map.maand) {
      warnings.push(`Overgeslagen, geen geldige maand: ${naam}`);
    } else if (!map.titel) {
      warnings.push(`Overgeslagen, lege titel: ${naam}`);
    } else {
      items.push({ ...map, fotos });
    }
  }

  // Foto's die nergens bij horen melden, zodat een onbekende mapnaam niet ongemerkt wegvalt.
  items.flatMap((item) => item.fotos).forEach((foto) => behandeld.add(foto));
  const nietHerkend = new Map();
  for (const foto of await findImages(root)) {
    if (behandeld.has(foto)) continue;
    const mappen = path.dirname(path.relative(root, foto)).split(path.sep);
    if (mappen.some((m) => mapping[m.trim()]?.overslaan)) continue;
    const map = mappen.slice(0, 2).join(path.sep);
    nietHerkend.set(map, (nietHerkend.get(map) ?? 0) + 1);
  }
  for (const [map, aantal] of nietHerkend) {
    warnings.push(`Niet herkend (voeg toe aan --mapping): ${map} (${aantal} foto's)`);
  }

  return { items, warnings };
}

function datumVoor(jaar, maand) {
  return DateTime.fromObject(
    { year: jaar, month: maand, day: 1, ...VOORSTELLING_TIJD },
    { zone: 'Europe/Amsterdam' }
  ).toUTC();
}

function pbDate(dateTime) {
  return dateTime.toFormat("yyyy-MM-dd HH:mm:ss.SSS'Z'");
}

/**
 * Comprimeert foto's boven de PocketBase-limiet van 5 MB met optimizt (zelfde tool als
 * scripts/optimize-images.sh). Geeft een map origineel -> geoptimaliseerd pad terug; de
 * originelen blijven ongewijzigd. Optimizt schrijft plat weg op bestandsnaam, dus de foto's
 * krijgen eerst een unieke naam (submappen kunnen dezelfde namen bevatten).
 */
async function optimaliseerGroteFotos(fotos) {
  const groot = [];
  for (const foto of fotos) {
    if ((await stat(foto)).size > MAX_BESTANDSGROOTTE) groot.push(foto);
  }
  if (groot.length === 0) return { geoptimaliseerd: new Map(), opruimen: async () => {} };

  const werkDir = await mkdtemp(path.join(os.tmpdir(), 'tovedem-optimizt-'));
  const inDir = path.join(werkDir, 'in');
  const uitDir = path.join(werkDir, 'uit');
  await mkdir(inDir);
  await mkdir(uitDir);

  const uniekeNamen = groot.map((foto, i) => `${i}${path.extname(foto).toLowerCase()}`);
  await Promise.all(groot.map((foto, i) => copyFile(foto, path.join(inDir, uniekeNamen[i]))));
  console.log(`  ~ ${groot.length} foto's boven 5 MB comprimeren met optimizt`);
  await execFileAsync(process.execPath, [OPTIMIZT_CLI, '-o', uitDir, inDir], {
    maxBuffer: 64 * 1024 * 1024,
  });

  const geoptimaliseerd = new Map(groot.map((foto, i) => [foto, path.join(uitDir, uniekeNamen[i])]));

  // Tweede ronde voor wat nog te groot is: zelfde kwaliteit, maar met mozjpeg-compressie.
  const nogTeGroot = [];
  for (const [i, foto] of groot.entries()) {
    const uit = geoptimaliseerd.get(foto);
    if ((await stat(uit).catch(() => null))?.size > MAX_BESTANDSGROOTTE) nogTeGroot.push(i);
  }
  if (nogTeGroot.length > 0) {
    const sterkInDir = path.join(werkDir, 'sterk-in');
    const sterkUitDir = path.join(werkDir, 'sterk-uit');
    const config = path.join(werkDir, 'optimizt-mozjpeg.mjs');
    await mkdir(sterkInDir);
    await mkdir(sterkUitDir);
    await writeFile(config, 'export default { optimize: { jpeg: { lossy: { quality: 80, mozjpeg: true } } } };\n');
    await Promise.all(
      nogTeGroot.map((i) => copyFile(path.join(inDir, uniekeNamen[i]), path.join(sterkInDir, uniekeNamen[i])))
    );
    console.log(`  ~ ${nogTeGroot.length} foto's opnieuw met mozjpeg`);
    await execFileAsync(process.execPath, [OPTIMIZT_CLI, '-c', config, '-o', sterkUitDir, sterkInDir], {
      maxBuffer: 64 * 1024 * 1024,
    });
    for (const i of nogTeGroot) geoptimaliseerd.set(groot[i], path.join(sterkUitDir, uniekeNamen[i]));
  }

  return { geoptimaliseerd, opruimen: () => rm(werkDir, { recursive: true, force: true }) };
}

/** Leest een foto voor upload, de geoptimaliseerde versie als die er is. */
async function uploadBestand(filePath, geoptimaliseerd) {
  const data = await readFile(geoptimaliseerd.get(filePath) ?? filePath).catch(() => readFile(filePath));
  if (data.length > MAX_BESTANDSGROOTTE) {
    throw new Error(`nog ${(data.length / 1024 / 1024).toFixed(1)} MB na optimizt (max. 5 MB)`);
  }
  return { blob: new Blob([data]), naam: path.basename(filePath) };
}

/** Titel is max. MAX_TITEL tekens; de rest gaat (op een woordgrens) naar de ondertitel. */
function splitsTitel(volledig) {
  if (volledig.length <= MAX_TITEL) return { titel: volledig, ondertitel: '' };
  const woorden = volledig.split(/\s+/);
  let titel = '';
  while (woorden.length > 0 && `${titel} ${woorden[0]}`.trim().length <= MAX_TITEL) {
    titel = `${titel} ${woorden.shift()}`.trim();
  }
  if (!titel) return { titel: volledig.slice(0, MAX_TITEL), ondertitel: volledig.slice(MAX_TITEL).trim() };
  return { titel, ondertitel: woorden.join(' ') };
}

function isZelfdeTitel(voorstelling, item) {
  return voorstelling.titel.trim().toLowerCase() === splitsTitel(item.titel).titel.toLowerCase();
}

async function findOrCreateVoorstelling(pb, item, groep) {
  const datum = datumVoor(item.jaar, item.maand);
  const maandStart = datum.startOf('month').minus({ days: 1 });
  const maandEind = datum.endOf('month').plus({ days: 1 });

  // Zoek op groep + maand: eerst op titel (ook een eerdere import), anders een actieve
  // voorstelling die al via de site is aangemaakt met een echte titel en speeldatum.
  // Gearchiveerde voorstellingen met een andere titel zijn vaak test-records; die niet.
  const bestaand = await pb.collection('voorstellingen').getFullList({
    filter: pb.filter('groep = {:groep} && datum_tijd_1 >= {:van} && datum_tijd_1 <= {:tot}', {
      groep: groep.id,
      van: pbDate(maandStart),
      tot: pbDate(maandEind),
    }),
  });
  const gevonden =
    bestaand.find((v) => isZelfdeTitel(v, item)) ??
    bestaand.find((v) => !v.gearchiveerd);
  if (gevonden) {
    return { voorstelling: gevonden, nieuw: false };
  }

  const formData = new FormData();
  formData.append('groep', groep.id);
  const { titel, ondertitel } = splitsTitel(item.titel);
  formData.append('titel', titel);
  if (ondertitel) formData.append('ondertitel', ondertitel);
  formData.append('regie', '-');
  formData.append('omschrijving', '-');
  formData.append('datum_tijd_1', pbDate(datum));
  formData.append('publicatie_datum', pbDate(datum));
  // Verplichte getalvelden: PocketBase ziet 0 als leeg. Niet zichtbaar want gearchiveerd.
  formData.append('beschikbare_stoelen_datum_tijd_1', '1');
  formData.append('beschikbare_stoelen_datum_tijd_2', '0');
  formData.append('prijs_per_kaartje', '1');
  // Gearchiveerd: houdt oude voorstellingen uit agenda, groepspagina en beheer; de galerij toont ze wel.
  formData.append('gearchiveerd', 'true');
  if (item.fotos.length > 0) {
    // Liefst een foto uit een submap "Voorstelling" als poster, geen portret.
    const poster =
      item.fotos.find((foto) =>
        path.dirname(path.relative(item.pad, foto)).toLowerCase().split(path.sep).includes('voorstelling')
      ) ?? item.fotos[0];
    const { geoptimaliseerd, opruimen } = await optimaliseerGroteFotos([poster]);
    try {
      const { blob, naam } = await uploadBestand(poster, geoptimaliseerd);
      formData.append('afbeelding', blob, naam);
    } finally {
      await opruimen();
    }
  }

  const voorstelling = await pb.collection('voorstellingen').create(formData);
  return { voorstelling, nieuw: true };
}

async function findOrCreateFolder(pb, item, voorstelling) {
  // Titel van de voorstelling zelf: bij een bestaande voorstelling is dat de echte titel.
  // Bij een ingekorte titel krijgt het album (zonder lengtelimiet) de volledige titel.
  const naam = isZelfdeTitel(voorstelling, item) ? item.titel : voorstelling.titel;
  const data = { naam, jaar: item.jaar, voorstelling: voorstelling.id };

  // De pb_hook voorstellingen-folders maakt bij een nieuwe voorstelling al een album aan.
  const bestaand = await pb.collection('voorstellingen_folders').getList(1, 1, {
    filter: pb.filter('voorstelling = {:id}', { id: voorstelling.id }),
  });
  if (bestaand.items.length > 0) {
    const folder = bestaand.items[0];
    if (folder.naam !== data.naam || folder.jaar !== data.jaar) {
      return pb.collection('voorstellingen_folders').update(folder.id, data);
    }
    return folder;
  }

  return pb.collection('voorstellingen_folders').create({ ...data, fotos: [] });
}

/**
 * PocketBase plakt aan namen korter dan 3 tekens eerst 10 willekeurige tekens vast
 * ("1.jpg" -> "1f164wq5q8y_8l6vvekyji.jpg"), dus die herkennen we aan het begin.
 */
function isKorteNaamAlBekend(naam, bekend) {
  const ext = path.extname(naam);
  const base = naam.slice(0, -ext.length || undefined);
  if (base.length >= 3) return false;
  const patroon = new RegExp(`^${base}[a-z0-9]{10}${ext.replace('.', '\\.')}$`);
  return [...bekend].some((b) => patroon.test(b));
}

async function uploadFotos(pb, folder, fotos) {
  const bestaandeFotos = FOTO_FIELDS.flatMap((field) => folder[field] ?? []);
  const bekend = new Set(bestaandeFotos.map(normalizeFilename));
  const teUploaden = fotos.filter((foto) => {
    const naam = normalizeFilename(path.basename(foto));
    if (bekend.has(naam) || isKorteNaamAlBekend(naam, bekend)) return false;
    bekend.add(naam);
    return true;
  });

  let aantal = bestaandeFotos.length;
  let geupload = 0;
  const fouten = [];
  const { geoptimaliseerd, opruimen } = await optimaliseerGroteFotos(teUploaden);

  try {
    for (const foto of teUploaden) {
      const fieldIndex = Math.floor(aantal / FOTOS_PER_FIELD);
      if (fieldIndex >= FOTO_FIELDS.length) {
        fouten.push(`Album is vol (${FOTO_FIELDS.length * FOTOS_PER_FIELD} foto's), rest overgeslagen`);
        break;
      }
      try {
        const { blob, naam } = await uploadBestand(foto, geoptimaliseerd);
        const formData = new FormData();
        formData.append(`${FOTO_FIELDS[fieldIndex]}+`, blob, naam);
        await pb.collection('voorstellingen_folders').update(folder.id, formData);
        aantal++;
        geupload++;
        process.stdout.write(`\r    foto's: ${geupload}/${teUploaden.length}`);
      } catch (error) {
        fouten.push(`${path.basename(foto)}: ${error?.message ?? error}`);
      }
    }
  } finally {
    await opruimen();
  }
  if (teUploaden.length > 0) process.stdout.write('\n');

  return { geupload, overgeslagen: fotos.length - teUploaden.length, fouten };
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const mappingIndex = args.indexOf('--mapping');
  const mappingPath = mappingIndex === -1 ? null : args[mappingIndex + 1];
  const inputs = args
    .filter((a, i) => !a.startsWith('--') && i !== mappingIndex + 1)
    .map((a) => path.resolve(a));
  return { inputs, dryRun, mappingPath };
}

/** Een map met losse zips (bv. alle Drive-downloads) telt als die zips. */
async function expandZipMappen(inputs) {
  const resultaat = [];
  for (const input of inputs) {
    const entries = await readdir(input, { withFileTypes: true }).catch(() => null);
    const zips = (entries ?? []).filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.zip'));
    if (zips.length > 0) {
      resultaat.push(...zips.map((e) => path.join(input, e.name)));
    } else {
      resultaat.push(input);
    }
  }
  return resultaat;
}

async function main() {
  const { inputs: args, dryRun, mappingPath } = parseArgs(process.argv);
  if (args.length === 0) {
    console.error('Gebruik: node scripts/import-galerij.mjs <map|zip>... [--mapping <json>] [--dry-run]');
    process.exit(1);
  }
  const inputs = await expandZipMappen(args);
  const mapping = mappingPath ? JSON.parse(await readFile(mappingPath, 'utf-8')) : {};
  const { PB_URL, PB_EMAIL, PB_PASSWORD } = process.env;
  if (!dryRun && (!PB_URL || !PB_EMAIL || !PB_PASSWORD)) {
    console.error('Zet PB_URL, PB_EMAIL en PB_PASSWORD als omgevingsvariabelen.');
    process.exit(1);
  }

  const zips = inputs.filter((i) => i.toLowerCase().endsWith('.zip'));
  const roots = inputs.filter((i) => !zips.includes(i));
  let tempDir = null;

  try {
    if (zips.length > 0) {
      // Alle zips in dezelfde map uitpakken, zodat gesplitste Drive-downloads samenvallen.
      tempDir = await mkdtemp(path.join(os.tmpdir(), 'tovedem-import-'));
      for (const zip of zips) {
        console.log(`Uitpakken: ${path.basename(zip)}`);
        await unzip(zip, tempDir);
      }
      roots.push(tempDir);
    }
    await importeer(roots, mapping, dryRun);
  } finally {
    if (tempDir) await rm(tempDir, { recursive: true, force: true });
  }
}

async function importeer(roots, mapping, dryRun) {
  const items = [];
  for (const root of roots) {
    const resultaat = await scan(root, mapping);
    resultaat.warnings.forEach((w) => console.warn(`! ${w}`));
    items.push(...resultaat.items);
  }

  console.log(`${items.length} voorstelling(en) gevonden:`);
  for (const item of items) {
    const datum = datumVoor(item.jaar, item.maand).setZone('Europe/Amsterdam').toFormat('dd-MM-yyyy');
    console.log(`  - [${item.groepNaam}] ${item.titel} (${datum}), ${item.fotos.length} foto's`);
  }
  if (dryRun || items.length === 0) return;

  const { PB_URL, PB_EMAIL, PB_PASSWORD, PB_AUTH_COLLECTION = '_superusers' } = process.env;
  const pb = new PocketBase(PB_URL);
  pb.autoCancellation(false);
  await pb.collection(PB_AUTH_COLLECTION).authWithPassword(PB_EMAIL, PB_PASSWORD);

  const groepen = await pb.collection('groepen').getFullList();
  const groepByNaam = new Map(groepen.map((g) => [normalizeGroepNaam(g.naam), g]));

  let mislukt = 0;
  for (const item of items) {
    console.log(`\n[${item.groepNaam}] ${item.titel} (${item.maand}-${item.jaar})`);
    const groep = groepByNaam.get(normalizeGroepNaam(item.groepNaam));
    if (!groep) {
      console.error(
        `  x Groep "${item.groepNaam}" niet gevonden. Bekend: ${groepen.map((g) => g.naam).join(', ')}`
      );
      mislukt++;
      continue;
    }

    try {
      const { voorstelling, nieuw } = await findOrCreateVoorstelling(pb, item, groep);
      console.log(`  ${nieuw ? '+ Voorstelling aangemaakt' : '= Voorstelling bestaat al'} (${voorstelling.id})`);

      const folder = await findOrCreateFolder(pb, item, voorstelling);
      console.log(`  = Album ${folder.naam} (${folder.id})`);

      const { geupload, overgeslagen, fouten } = await uploadFotos(pb, folder, item.fotos);
      console.log(`  + ${geupload} foto's geüpload, ${overgeslagen} al aanwezig`);
      fouten.forEach((f) => console.error(`  x ${f}`));
      if (fouten.length > 0) mislukt++;
    } catch (error) {
      console.error(`  x ${error?.message ?? error}`, error?.response ?? '');
      mislukt++;
    }
  }

  console.log(`\nKlaar. ${items.length - mislukt}/${items.length} zonder fouten.`);
  if (mislukt > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

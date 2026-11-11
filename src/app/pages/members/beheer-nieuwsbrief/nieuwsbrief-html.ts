import {
  NieuwsbriefBlok,
  NieuwsbriefUitlijning,
  uitlijningVan,
} from '../../../models/domain/nieuwsbrief-blok.model';

/*
 * Bouwt de HTML van de nieuwsbrief-mail. Mailprogramma's (Outlook, Gmail) ondersteunen
 * weinig CSS: daarom tabellen, inline styles, geen web fonts en emoji in plaats van icon fonts.
 */

export const SITE_URL = 'https://tovedem.nl';

const KLEUR = {
  achtergrond: '#eaf2fb',
  donkerblauw: '#123f73',
  blauw: '#1a5fa8',
  lichtblauw: '#7db3e8',
  ijsblauw: '#f0f6ff',
  rand: '#d6e6f7',
  tekst: '#2b3440',
  tekstZacht: '#5b6b7d',
};

const LETTERTYPE = "'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const ALIGN: Record<NieuwsbriefUitlijning, 'left' | 'center' | 'right'> = {
  links: 'left',
  midden: 'center',
  rechts: 'right',
};

export function escapeHtml(waarde: string | null | undefined): string {
  return (waarde ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Alleen http(s)- en mailto-links; al het andere wordt een lege link. */
function veiligeUrl(url: string | null | undefined): string {
  const waarde = (url ?? '').trim();
  return /^(https?:|mailto:)/i.test(waarde) ? escapeHtml(waarde) : '';
}

const TOEGESTANE_TAGS = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'UL', 'OL', 'LI', 'A']);

/** Houdt alleen eenvoudige opmaak over van HTML uit de editor (bijv. de omschrijving van een voorstelling). */
export function beperkteHtml(html: string | null | undefined): string {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');

  const zet = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return escapeHtml(node.textContent);
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    const element = node as Element;
    const inhoud = Array.from(element.childNodes).map(zet).join('');
    if (!TOEGESTANE_TAGS.has(element.tagName)) return inhoud;

    const tag = element.tagName.toLowerCase();
    if (tag === 'br') return '<br>';
    if (tag === 'p') return `<p style="margin:0 0 10px;">${inhoud}</p>`;
    if (tag === 'a') {
      const href = veiligeUrl(element.getAttribute('href'));
      return href ? `<a href="${href}" style="color:${KLEUR.blauw};">${inhoud}</a>` : inhoud;
    }
    return `<${tag}>${inhoud}</${tag}>`;
  };

  return Array.from(doc.body.firstChild?.childNodes ?? []).map(zet).join('');
}

function knopHtml(label: string, url: string, uitlijning: NieuwsbriefUitlijning): string {
  const href = veiligeUrl(url);
  if (!href || !label) return '';
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="${ALIGN[uitlijning]}" style="margin:${uitlijning === 'midden' ? '0 auto' : '0'};">
              <tr>
                <td bgcolor="${KLEUR.blauw}" style="border-radius:999px;">
                  <a href="${href}" style="display:inline-block;padding:12px 28px;font-family:${LETTERTYPE};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;">${escapeHtml(label)}</a>
                </td>
              </tr>
            </table>`;
}

/** Eén rij in de mail met de juiste uitlijning en ruimte rondom. */
function rij(inhoud: string, uitlijning: NieuwsbriefUitlijning, padding = '16px 32px'): string {
  if (!inhoud) return '';
  return `        <tr>
          <td align="${ALIGN[uitlijning]}" style="padding:${padding};text-align:${ALIGN[uitlijning]};font-family:${LETTERTYPE};color:${KLEUR.tekst};">
            ${inhoud}
          </td>
        </tr>`;
}

function infoRegel(icoon: string, tekst: string): string {
  return `<p style="margin:4px 0;font-size:15px;color:${KLEUR.tekst};"><span style="display:inline-block;width:24px;">${icoon}</span>${tekst}</p>`;
}

export function renderBlok(blok: NieuwsbriefBlok): string {
  const uitlijning = uitlijningVan(blok);

  switch (blok.type) {
    case 'koptekst':
      return rij(
        `<h2 style="margin:0;font-size:24px;line-height:1.3;color:${KLEUR.donkerblauw};">${escapeHtml(blok.titel) || 'Koptekst'}</h2>
            ${blok.ondertitel ? `<p style="margin:6px 0 0;font-size:15px;color:${KLEUR.tekstZacht};">${escapeHtml(blok.ondertitel)}</p>` : ''}
            <span style="display:inline-block;margin-top:12px;width:56px;height:3px;font-size:0;line-height:0;background:${KLEUR.lichtblauw};border-radius:3px;">&nbsp;</span>`,
        uitlijning,
        '28px 32px 8px'
      );

    case 'alinea':
      return rij(
        `<p style="margin:0;font-size:15px;line-height:1.7;color:${KLEUR.tekst};">${escapeHtml(blok.tekst).replace(/\n/g, '<br>')}</p>`,
        uitlijning
      );

    case 'afbeelding': {
      const src = veiligeUrl(blok.afbeelding_url);
      if (!src) return '';
      return rij(
        `<img src="${src}" alt="${escapeHtml(blok.afbeelding_alt)}" width="536" style="display:inline-block;width:100%;max-width:536px;height:auto;border:0;border-radius:12px;">
            ${blok.onderschrift ? `<p style="margin:8px 0 0;font-size:13px;font-style:italic;color:${KLEUR.tekstZacht};">${escapeHtml(blok.onderschrift)}</p>` : ''}`,
        uitlijning
      );
    }

    case 'evenement': {
      const regels = [
        blok.event_datum ? infoRegel('📅', escapeHtml(blok.event_datum)) : '',
        blok.event_locatie ? infoRegel('📍', escapeHtml(blok.event_locatie)) : '',
        blok.event_prijs ? infoRegel('🎟️', escapeHtml(blok.event_prijs)) : '',
      ].join('');
      return rij(
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td bgcolor="${KLEUR.ijsblauw}" align="${ALIGN[uitlijning]}" style="padding:20px 22px;border-left:4px solid ${KLEUR.lichtblauw};border-radius:0 12px 12px 0;text-align:${ALIGN[uitlijning]};font-family:${LETTERTYPE};">
                  <p style="margin:0 0 2px;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${KLEUR.blauw};">Evenement</p>
                  <h3 style="margin:0 0 10px;font-size:19px;color:${KLEUR.donkerblauw};">${escapeHtml(blok.event_titel) || 'Evenement'}</h3>
                  ${regels}
                  ${blok.event_link ? `<div style="margin-top:14px;">${knopHtml('Meer info', blok.event_link, uitlijning)}</div>` : ''}
                </td>
              </tr>
            </table>`,
        uitlijning
      );
    }

    case 'voorstelling':
      return renderVoorstelling(blok, uitlijning);

    case 'scheidingslijn':
      return `        <tr>
          <td style="padding:12px 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:2px solid ${KLEUR.rand};font-size:0;line-height:0;">&nbsp;</td></tr></table>
          </td>
        </tr>`;

    case 'knop':
      return rij(knopHtml(blok.knop_label ?? '', blok.knop_url ?? '', uitlijning), uitlijning);

    default:
      return '';
  }
}

function renderVoorstelling(blok: NieuwsbriefBlok, uitlijning: NieuwsbriefUitlijning): string {
  if (!blok.voorstelling_id) return '';
  const align = ALIGN[uitlijning];
  const afbeelding = veiligeUrl(blok.voorstelling_afbeelding_url);

  const datums = (blok.voorstelling_datums ?? [])
    .map((datum) => infoRegel('📅', escapeHtml(datum)))
    .join('');
  const prijs =
    blok.toon_prijs && blok.voorstelling_prijs != null
      ? infoRegel('🎟️', `€ ${blok.voorstelling_prijs.toFixed(2).replace('.', ',')} per kaartje`)
      : '';
  const regie =
    blok.toon_regie && blok.voorstelling_regie
      ? infoRegel('🎬', `Regie: ${escapeHtml(blok.voorstelling_regie)}`)
      : '';
  const omschrijving =
    blok.toon_omschrijving && blok.voorstelling_omschrijving
      ? `<div style="margin:14px 0 0;font-size:15px;line-height:1.65;color:${KLEUR.tekst};">${beperkteHtml(blok.voorstelling_omschrijving)}</div>`
      : '';

  return rij(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${KLEUR.rand};border-radius:14px;border-collapse:separate;overflow:hidden;">
              ${
                afbeelding
                  ? `<tr><td style="padding:0;font-size:0;line-height:0;"><img src="${afbeelding}" alt="${escapeHtml(blok.voorstelling_titel)}" width="536" style="display:block;width:100%;max-width:536px;height:auto;border:0;border-radius:14px 14px 0 0;"></td></tr>`
                  : ''
              }
              <tr>
                <td bgcolor="${KLEUR.ijsblauw}" align="${align}" style="padding:22px 24px 24px;text-align:${align};font-family:${LETTERTYPE};border-radius:${afbeelding ? '0 0 14px 14px' : '14px'};">
                  <p style="margin:0 0 4px;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${KLEUR.blauw};">🎭 Voorstelling</p>
                  <h3 style="margin:0;font-size:22px;line-height:1.3;color:${KLEUR.donkerblauw};">${escapeHtml(blok.voorstelling_titel)}</h3>
                  ${
                    blok.toon_ondertitel && blok.voorstelling_ondertitel
                      ? `<p style="margin:4px 0 0;font-size:15px;font-style:italic;color:${KLEUR.tekstZacht};">${escapeHtml(blok.voorstelling_ondertitel)}</p>`
                      : ''
                  }
                  <div style="margin-top:14px;">${datums}${regie}${prijs}</div>
                  ${omschrijving}
                  <div style="margin-top:18px;">${knopHtml('🎟️ Reserveer nu', blok.voorstelling_reserveer_url ?? '', uitlijning)}</div>
                </td>
              </tr>
            </table>`,
    uitlijning
  );
}

export interface NieuwsbriefHtmlOpties {
  titel: string;
  /** Datum onder de titel in de banner, bijv. "november 2026". */
  datumLabel: string;
}

export function genereerNieuwsbriefHtml(
  blokken: NieuwsbriefBlok[],
  opties: NieuwsbriefHtmlOpties
): string {
  const titel = escapeHtml(opties.titel) || 'Nieuwsbrief';
  const inhoud = blokken.map(renderBlok).filter(Boolean).join('\n');

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>${titel}</title>
</head>
<body style="margin:0;padding:0;background:${KLEUR.achtergrond};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${KLEUR.achtergrond}">
    <tr>
      <td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:16px;border-collapse:separate;overflow:hidden;box-shadow:0 4px 18px rgba(18,63,115,0.12);">

        <!-- Banner -->
        <tr>
          <td align="center" bgcolor="${KLEUR.blauw}" style="padding:30px 32px 26px;background-color:${KLEUR.blauw};background-image:linear-gradient(135deg, ${KLEUR.donkerblauw} 0%, ${KLEUR.blauw} 55%, ${KLEUR.lichtblauw} 100%);border-radius:16px 16px 0 0;font-family:${LETTERTYPE};">
            <img src="${SITE_URL}/assets/tovedem_logo_klein.png" alt="Tovedem" width="64" height="64" style="display:block;margin:0 auto 12px;width:64px;height:64px;border:0;background:#ffffff;border-radius:50%;padding:6px;">
            <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#d9eafb;">Nieuwsbrief${opties.datumLabel ? ` · ${escapeHtml(opties.datumLabel)}` : ''}</p>
            <h1 style="margin:8px 0 0;font-size:28px;line-height:1.25;color:#ffffff;">${titel}</h1>
          </td>
        </tr>
        <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>

${inhoud}

        <tr><td style="height:24px;font-size:0;line-height:0;">&nbsp;</td></tr>

        <!-- Voettekst -->
        <tr>
          <td align="center" bgcolor="${KLEUR.donkerblauw}" style="padding:28px 32px;background-color:${KLEUR.donkerblauw};border-radius:0 0 16px 16px;font-family:${LETTERTYPE};color:#d9eafb;">
            <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:#ffffff;">🎭 Tovedem</p>
            <p style="margin:0 0 14px;font-size:13px;color:#b9d4f1;">Toneelvereniging uit De Meern</p>
            <p style="margin:0 0 14px;font-size:13px;line-height:1.6;color:#d9eafb;">📍 De Schalm · Orangjelaan 10 · 3454 BT De Meern</p>
            <p style="margin:0 0 18px;font-size:14px;">
              <a href="${SITE_URL}" style="color:#ffffff;text-decoration:none;font-weight:600;">🌐 Website</a>
              &nbsp;&nbsp;·&nbsp;&nbsp;
              <a href="${SITE_URL}/agenda" style="color:#ffffff;text-decoration:none;font-weight:600;">📅 Agenda</a>
              &nbsp;&nbsp;·&nbsp;&nbsp;
              <a href="https://www.instagram.com/tovedem.demeern/" style="color:#ffffff;text-decoration:none;font-weight:600;">📷 Instagram</a>
              &nbsp;&nbsp;·&nbsp;&nbsp;
              <a href="https://www.facebook.com/tovedem" style="color:#ffffff;text-decoration:none;font-weight:600;">👍 Facebook</a>
            </p>
            <p style="margin:0;font-size:12px;line-height:1.6;color:#9fc2e8;">
              Je ontvangt deze mail omdat je je hebt aangemeld voor de nieuwsbrief van Tovedem.<br>
              Liever geen nieuwsbrief meer? <a href="${SITE_URL}/contact" style="color:#ffffff;">Laat het ons weten</a>.
            </p>
          </td>
        </tr>
      </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

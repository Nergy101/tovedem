import { NieuwsbriefBlok } from '../../../models/domain/nieuwsbrief-blok.model';
import { beperkteHtml, genereerNieuwsbriefHtml, renderBlok } from './nieuwsbrief-html';

describe('nieuwsbrief-html', () => {
  const voorstelling: NieuwsbriefBlok = {
    id: 'v',
    type: 'voorstelling',
    voorstelling_id: 'abc123',
    voorstelling_titel: 'De Vrek',
    voorstelling_ondertitel: 'Een klassieker',
    voorstelling_omschrijving: '<p>Een <strong>komedie</strong></p><script>alert(1)</script>',
    voorstelling_regie: 'Jan Jansen',
    voorstelling_prijs: 12.5,
    voorstelling_afbeelding_url: 'https://pocketbase.example/api/files/v/abc123/vrek.jpg',
    voorstelling_datums: ['vrijdag 13 maart 2026 · 20:00 uur'],
    voorstelling_reserveer_url: 'https://tovedem.nl/reserveren?voorstellingId=abc123',
  };

  it('toont bij een voorstelling altijd titel, afbeelding, datum en reserveerknop', () => {
    const html = renderBlok(voorstelling);

    expect(html).toContain('De Vrek');
    expect(html).toContain('vrek.jpg');
    expect(html).toContain('vrijdag 13 maart 2026 · 20:00 uur');
    expect(html).toContain('href="https://tovedem.nl/reserveren?voorstellingId=abc123"');
    expect(html).toContain('Reserveer nu');
  });

  it('toont subtekst, omschrijving, prijs en regie alleen als ze aangevinkt zijn', () => {
    const zonder = renderBlok(voorstelling);
    expect(zonder).not.toContain('Een klassieker');
    expect(zonder).not.toContain('komedie');
    expect(zonder).not.toContain('12,50');
    expect(zonder).not.toContain('Jan Jansen');

    const met = renderBlok({
      ...voorstelling,
      toon_ondertitel: true,
      toon_omschrijving: true,
      toon_prijs: true,
      toon_regie: true,
    });
    expect(met).toContain('Een klassieker');
    expect(met).toContain('<strong>komedie</strong>');
    expect(met).toContain('€ 12,50 per kaartje');
    expect(met).toContain('Regie: Jan Jansen');
    expect(met).not.toContain('<script>');
  });

  it('gebruikt de gekozen uitlijning, met een standaard per bloktype', () => {
    const alinea: NieuwsbriefBlok = { id: 'a', type: 'alinea', tekst: 'Hallo' };

    expect(renderBlok(alinea)).toContain('text-align:left');
    expect(renderBlok({ ...alinea, uitlijning: 'midden' })).toContain('text-align:center');
    expect(renderBlok({ ...alinea, uitlijning: 'rechts' })).toContain('text-align:right');
    expect(renderBlok({ id: 'k', type: 'knop', knop_label: 'Kijk', knop_url: 'https://tovedem.nl' })).toContain(
      'text-align:center'
    );
  });

  it('escapet tekst en weigert onveilige links', () => {
    const html = renderBlok({
      id: 'k',
      type: 'knop',
      knop_label: '<b>Klik</b>',
      knop_url: 'javascript:alert(1)',
    });
    expect(html).toBe('');

    const alinea = renderBlok({ id: 'a', type: 'alinea', tekst: '<img src=x onerror=alert(1)>' });
    expect(alinea).toContain('&lt;img');
    expect(alinea).not.toContain('<img');
  });

  it('beperkteHtml houdt alleen eenvoudige opmaak en veilige links over', () => {
    expect(beperkteHtml('<p class="ql-x">A <em>b</em></p><a href="javascript:x">c</a><a href="https://x.nl">d</a>')).toBe(
      '<p style="margin:0 0 10px;">A <em>b</em></p>c<a href="https://x.nl" style="color:#1a5fa8;">d</a>'
    );
  });

  it('heeft een banner met titel en een voettekst', () => {
    const html = genereerNieuwsbriefHtml([], { titel: 'Voorjaar & meer', datumLabel: 'maart 2026' });

    expect(html).toContain('tovedem_logo_klein.png');
    expect(html).toContain('Voorjaar &amp; meer');
    expect(html).toContain('Nieuwsbrief · maart 2026');
    expect(html).toContain('De Schalm');
    expect(html).toContain('https://www.instagram.com/tovedem.demeern/');
  });
});

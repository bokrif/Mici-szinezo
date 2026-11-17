# Mici Színező

[![Licenc: MIT](https://img.shields.io/badge/licenc-MIT-ff4f9e.svg)](LICENSE)
[![Készült Claude Code-dal](https://img.shields.io/badge/k%C3%A9sz%C3%BClt-Claude%20Code--dal-8a4fff.svg)](https://claude.com/claude-code)
![Platform: iPad és böngésző](https://img.shields.io/badge/platform-iPad%20%7C%20b%C3%B6ng%C3%A9sz%C5%91-2f5bea.svg)

Egyszerű, ingyenes színező és rajzoló app gyerekeknek, elsősorban iPadre. Eredetileg egy kislánynak készült, de bárki szabadon használhatja, továbbfejlesztheti és megoszthatja.

**Kipróbálás:** <https://bokrif.github.io/Mici-szinezo/>

## Tartalom

- [Funkciók](#funkciók)
- [Telepítés iPadre](#telepítés-ipadre)
- [Adatvédelem](#adatvédelem)
- [Saját példány készítése](#saját-példány-készítése)
- [Fejlesztés](#fejlesztés)
- [Közreműködés](#közreműködés)
- [Készítés](#készítés)
- [Licenc](#licenc)

## Funkciók

- **12 kiszínezhető kép**: cica, egyszarvú, pillangó, virág, szivárvány, kastély, torta, maci, fagyi, katica, halacska, házikó. Van **üres lap** is szabad rajzoláshoz.
- **7 eszköz**: filc, zsírkréta, ecset, spray, matrica (csillag, szív, virág), festékes vödör (egy koppintással kitölt egy részt) és radír.
- **4 vonalvastagság**. Apple Pencillel a nyomásra is vastagodik a vonal.
- **25 szín**: 17 sima szín, **szivárvány**, 6 **csillámos** (arany, ezüst, rózsaszín, lila, kék, türkiz) és **szivárvány-csillám**. A csillámos színeken apró csillagok csillognak.
- A színezés nem megy rá a fekete vonalakra, és a radír sem törli le őket.
- **Visszavonás** (az utolsó 10 lépés), **törlés** megerősítéssel, és **mentés a Fotókba**.
- A félbehagyott rajzokat magától megjegyzi. A kezdőképernyőn látszik, melyik képpel hol tart a gyerek.
- Telepítés után **internet nélkül** is működik.
- Nincs benne reklám, vásárlás, regisztráció vagy külső link.

## Telepítés iPadre

Ez egy telepíthető webapp (PWA), ezért nem kell hozzá App Store, Mac vagy fejlesztői fiók.

1. Az iPaden nyisd meg Safariban: <https://bokrif.github.io/Mici-szinezo/>
2. Koppints a **Megosztás** gombra (négyzet felfelé mutató nyíllal), majd válaszd a **Főképernyőhöz adás** pontot.
3. A főképernyőn megjelenik a **Mici Színező** ikon. Innen indítva teljes képernyőn fut, böngészősáv nélkül.

Tipp: kisgyereknek érdemes bekapcsolni az iPadben az **Irányított hozzáférést** (Beállítások → Kisegítő lehetőségek → Irányított hozzáférés). Így nem tud véletlenül kilépni az appból.

Más eszközökön (Android tablet, számítógép) is működik egy modern böngészőben.

## Adatvédelem

Az app semmilyen adatot nem gyűjt és nem küld el. A rajzok csak az eszközön, a böngésző saját tárhelyén (IndexedDB) maradnak. Nincs benne analitika, követés vagy hirdetés. A rajz csak akkor hagyja el az eszközt, ha te magad mented el vagy osztod meg.

## Saját példány készítése

Ha saját változatot szeretnél (például más képekkel vagy a saját gyereked nevével):

1. Készíts egy **forkot** a repóról (jobb felső sarok, **Fork** gomb).
2. A saját repódban a **Settings → Pages** oldalon a *Source* legyen **GitHub Actions**.
3. Az **Actions** fülön futtasd le a „Közzététel GitHub Pages-en” folyamatot (**Run workflow**). Ezután minden `main` ágra kerülő változás magától frissül.
4. Az app ezen a címen lesz elérhető: `https://<felhasználóneved>.github.io/<repó-neve>/`

Az app tisztán statikus fájlokból áll, így bármilyen más tárhelyre is feltölthető (például Netlify vagy Cloudflare Pages). Nem kell hozzá build lépés.

## Fejlesztés

Nincsenek függőségek és nincs build lépés: sima HTML, CSS és JavaScript. Helyi kipróbáláshoz indíts egy egyszerű webszervert a repó mappájában:

```bash
python3 -m http.server 8000
```

Utána nyisd meg a böngészőben a `http://localhost:8000` címet.

### Felépítés

| Fájl | Mire való |
| --- | --- |
| `index.html` | az oldal váza |
| `styles.css` | a megjelenés (fekvő és álló iPadre is) |
| `app.js` | a rajzolás, ecsetek, kitöltés, mentés |
| `drawings.js` | a kiszínezhető képek (SVG vonalrajzok) |
| `sw.js`, `manifest.webmanifest`, `icons/` | telepítés és offline működés |
| `.github/workflows/pages.yml` | automatikus közzététel GitHub Pages-en |

### Új kép hozzáadása

A `drawings.js` végén lévő `window.DRAWINGS` listába kell felvenni egy új elemet egy 800×600-as SVG rajzzal. A fehér kitöltésű alakzatok eltakarják a mögöttük lévő vonalakat, így egymást fedő formák is rajzolhatók. Új kép vagy egyéb változás után a `sw.js` elején érdemes megemelni a `CACHE` verziószámát, hogy a már telepített appok is frissüljenek.

## Közreműködés

Hibajelentést, ötletet és új rajzot is szívesen fogadunk:

- **Hibát találtál vagy ötleted van?** Nyiss egy [issue-t](https://github.com/bokrif/Mici-szinezo/issues), és írd le, mi történt, milyen eszközön és böngészőben.
- **Javítanál vagy bővítenél?** Készíts forkot, dolgozz egy külön ágon, majd nyiss pull requestet. Írd le röviden, mit változtattál, és hogy hol próbáltad ki.
- Kérjük, hogy a hozzájárulások gyerekbarátok maradjanak: reklám, követés és külső linkek nélkül.

A beküldött hozzájárulások ugyanazon MIT licenc alatt kerülnek a projektbe.

## Készítés

Ez a projekt az Anthropic AI-alapú kódolási asszisztense, a [Claude Code](https://claude.com/claude-code) segítségével készült. A kódot, a vonalrajzokat és az ikonokat is a Claude Code írta, illetve rajzolta.

## Licenc

A projekt az [MIT licenc](LICENSE) alatt érhető el. Ez a kódra és a benne lévő rajzokra, ikonokra is vonatkozik.

Röviden: szabadon használhatod, másolhatod, módosíthatod, terjesztheted, akár üzleti célra is. Az egyetlen feltétel, hogy a szerzői jogi megjegyzést és a licenc szövegét meg kell tartanod a másolatokban. A szoftver „úgy, ahogy van” érhető el, mindenféle garancia nélkül. A licenc pontos, jogilag irányadó szövege a [LICENSE](LICENSE) fájlban olvasható (angolul).

© 2026 bokrif

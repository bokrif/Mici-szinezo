# Mici Színező

Micinek rajzolós app: egyszerű színező és rajzoló iPadre.

## Mit tud?

- **12 kiszínezhető kép**: cica, egyszarvú, pillangó, virág, szivárvány, kastély, torta, maci, fagyi, katica, halacska, házikó. Van **üres lap** is szabad rajzoláshoz.
- **7 eszköz**: filc, zsírkréta, ecset, spray, matrica (csillag, szív, virág), festékes vödör (egy koppintással kitölt egy részt) és radír.
- **4 vonalvastagság**. Apple Pencillel a nyomásra is vastagodik a vonal.
- **25 szín**: 17 sima szín, **szivárvány**, 6 **csillámos** (arany, ezüst, rózsaszín, lila, kék, türkiz) és **szivárvány-csillám**. A csillámos színeken apró csillagok csillognak.
- A színezés nem megy rá a fekete vonalakra, és a radír sem törli le őket.
- **Visszavonás** (az utolsó 10 lépés), **törlés** megerősítéssel, és **mentés a Fotókba**.
- A félbehagyott rajzokat magától megjegyzi. A kezdőképernyőn látszik, melyik képpel hol tartotok.
- Telepítés után **internet nélkül** is működik.

## Hogyan kerül fel az iPadre?

Ez egy telepíthető webapp, ezért nem kell hozzá App Store, Mac vagy fejlesztői fiók.

1. **Közzététel (egyszer kell beállítani):** a GitHubon a repó **Settings → Pages** oldalán a *Source* legyen **GitHub Actions**. Ezután minden `main` ágra kerülő változás automatikusan felkerül ide:
   `https://bokrif.github.io/Mici-app/`
   (Privát repónál a GitHub Pages fizetős csomagot igényel. Ilyenkor vagy publikussá kell tenni a repót, vagy más ingyenes tárhelyre kell feltölteni a fájlokat, például a Netlify Drop-ra.)
2. Az iPaden nyisd meg a fenti címet **Safariban**.
3. Koppints a **Megosztás** gombra (négyzet felfelé mutató nyíllal), majd válaszd a **Főképernyőhöz adás** pontot.
4. A főképernyőn megjelenik a **Mici Színező** ikon. Innen indítva teljes képernyőn fut, böngészősáv nélkül.

Tipp: kisgyereknek érdemes bekapcsolni az iPadben az **Irányított hozzáférést** (Beállítások → Kisegítő lehetőségek → Irányított hozzáférés). Így nem tud véletlenül kilépni az appból.

## Helyi kipróbálás számítógépen

```bash
python3 -m http.server 8000
```

Utána nyisd meg a böngészőben a `http://localhost:8000` címet.

## Fájlok

| Fájl | Mire való |
| --- | --- |
| `index.html` | az oldal váza |
| `styles.css` | a megjelenés (fekvő és álló iPadre is) |
| `app.js` | a rajzolás, ecsetek, kitöltés, mentés |
| `drawings.js` | a kiszínezhető képek (SVG vonalrajzok) |
| `sw.js`, `manifest.webmanifest`, `icons/` | telepítés és offline működés |

Új kép hozzáadása: a `drawings.js` végén lévő listába kell felvenni egy új elemet egy 800×600-as SVG rajzzal.

# Dorada Cover Studio

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/bsnpg/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/bsnpg/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

An offline web app that turns a photo and a caption into GTA 6-style multi-panel
poster cover art — bold lettering, Vice City sunset and neon colour grades — and
exports it as a PNG to share. It runs offline in a desktop browser from its own
static files: photos never leave the machine.

- 5 multi-panel layouts (Hero Left, Hero Top, Duo Split, Grid 3×3, Full-Bleed Single)
- 6 colour grades (Sunset, Neon Night, Golden Hour, Noir, Teal Heat, Bubblegum)
- Per-panel photo: upload, crop, drag to pan, scroll to zoom, per-panel grade
- Caption editing: title, tagline, kicker badge, stickers
- PNG export in the common post sizes: 1080×1080, 1080×1350, 1920×1080

Built for the [Make GTA 6 Cover Art](https://make.fun/bounty/gta6-cover-art-01)
bounty on make.fun. Everything is original: no Rockstar Games logo, artwork or
fonts. Display type is Anton (SIL Open Font License), script is Yellowtail
(SIL Open Font License); sample photos were made with an image model.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

## License

MIT — see [LICENSE](LICENSE).

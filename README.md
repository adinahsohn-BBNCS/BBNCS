# BBNCS — Bits, Bytes & Nibbles

Modern [bbncs.com](https://bbncs.com/) — managed IT, backup, and support (Astro static site).

## Separate from Fly LRE

This project is **independent** of [Fly LRE](https://github.com/adinahsohn-BBNCS/FLYLRE) (flylre.com):

- **Own folder** — `BBNCS`, not `FLYLRE`
- **Own GitHub repo** — `adinahsohn-BBNCS/BBNCS`
- **Own hosting credentials** — `.env.deploy` in this project only (bbncs.com)
- **Own dev port** — http://localhost:4322 (Fly LRE uses 4321)
- **Deploy does not touch Fly LRE** — `npm run deploy` uploads to bbncs.com only

Do not share deploy credentials, env files, or code between the two sites unless you intentionally want to.

## Local setup

```bash
npm install
npm run assets:pull   # download logo + client images from bbncs.com
npm run dev           # http://localhost:4322
```

## Import content from the live WordPress site

```powershell
powershell -ExecutionPolicy Bypass -File scripts/pull-from-wordpress.ps1
```

Output goes to `import/` (gitignored). Optional: drop a `wp-content` zip from cPanel into `import/` as well.

## Deploy

Copy `.env.deploy.example` to `.env.deploy` and fill in FTPS credentials (host uses FTP over SSL on port 21). Never commit `.env.deploy`.

```bash
npm run deploy          # build + upload to bbncs.com
npm run deploy:dry      # preview without uploading
```

To upload without removing old files first (faster updates):

```powershell
npm run deploy -- -SkipClean
```

Deploy uses FTPS to `public_html/`. It does not update GitHub — commit and push separately when you want a backup.

## Status

- Live at [bbncs.com](https://bbncs.com/) (Astro static site)
- Source backup: [GitHub — BBNCS](https://github.com/adinahsohn-BBNCS/BBNCS)
- WordPress archive: local `import/` folder + your cPanel full backup

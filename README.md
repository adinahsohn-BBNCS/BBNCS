# BBNCS — Bits, Bytes & Nibbles

Modern rebuild of [bbncs.com](https://bbncs.com/) (managed IT, backup, and support for Temecula-area businesses).

This project is separate from [Fly LRE](https://github.com/adinahsohn-BBNCS/FLYLRE).

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

## Deploy credentials

Copy `.env.deploy.example` to `.env.deploy` for SFTP access to hosting. Never commit `.env.deploy`.

## Status

- WordPress content and media pulled into `import/` for migration
- New Astro site: in progress

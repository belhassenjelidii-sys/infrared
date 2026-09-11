# GitHub and Cloudflare test

## GitHub

Create an empty private repository on GitHub named `infrared-optic-store`.
From the project directory, run:

```powershell
git add .
git commit -m "Initial private repository"
git remote add origin https://github.com/YOUR-ACCOUNT/infrared-optic-store.git
git push -u origin main
```

Never upload `.env`, `.env.production`, database dumps, or Supabase and SMTP keys. The repository already ignores these files.

## Free Cloudflare preview

This application is not a static site. Do not use the Cloudflare Pages static export preset because the admin, database, authentication, uploads, and API routes would stop working.

For a free temporary preview, keep the local application running:

```powershell
START.bat
```

In a second terminal in the same project directory, run:

```powershell
npm run cloudflare:tunnel
```

Cloudflare prints a temporary HTTPS URL ending in `trycloudflare.com`. Share that URL only for testing. It stops working when the tunnel command or your computer stops.

Before sharing the preview, use non-sensitive local data and avoid entering real customer information. The tunnel exposes the running local site to anyone who knows its random URL.

## Later production deployment

Use a Node.js host with PostgreSQL and Supabase Storage for the full application. Cloudflare can still be placed in front of that host for DNS, HTTPS, CDN, WAF, and a named tunnel after you buy the domain.

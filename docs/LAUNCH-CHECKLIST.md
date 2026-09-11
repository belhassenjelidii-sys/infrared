# Launch checklist

## Local preparation complete

- Run `npm run lint` and `npm run build`.
- Run `npm run production:check -- --env-file=.env.production` after creating the real production file on the host.
- Confirm `GET /api/health` returns `{ "ok": true }` after deployment.
- Create a private GitHub repository and confirm the Verify workflow passes.

## Before public launch

- Use a managed PostgreSQL database with a separate production user, strong password, backup schedule, and a restore test.
- Configure Supabase Storage and upload one image from the admin area.
- Configure the final domain, HTTPS, and `NEXT_PUBLIC_SITE_URL`.
- Configure SMTP in Admin > Parametres > E-mails and send a test message.
- Replace demo business details, store hours, phone, WhatsApp, maps, and social links in the dashboard.
- Review legal and privacy text with the business owner before publishing.
- Change or disable unused seeded accounts.
- Add uptime monitoring and a WAF or distributed rate limit at the hosting provider.

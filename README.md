# ns-fellowship-prep

**NS Fellowship Prep** — a free 20-point readiness checklist for the public
Network School Fellowship application stages: online form, Zoom interview,
in-person exam, and decision.

## Why

Applicants can still control how clearly they explain their work, how well
they rehearse, and whether they plan the practical details. This checklist
organizes those preparation steps. It is a preparation aid, not an admission
prediction or a source of private exam material.

Not official. Not affiliated with Network School or Balaji Srinivasan.
Structure is sourced from public information about the Fellowship process,
not from NS itself.

## Run it

Static, zero runtime dependencies. The source files live at the repository root
for GitHub Pages, and `npm run build` copies the same files into `public/` for
Vercel.

```
npm run build
npx serve public
```

Progress is saved in the browser's localStorage only. Nothing is sent
anywhere by the site code; there is no account, form, backend, analytics, or
tracking script.

## Test

```
npm test
```

After a production deploy, verify public routes, response headers, and GPTBot
parity with:

```
$env:SITE_URL="https://ns-fellowship-prep.vercel.app"
npm run test:production
```

Primary production URL: https://ns-fellowship-prep.vercel.app/

Preserved GitHub Pages mirror: https://adamtpang.github.io/ns-fellowship-prep/

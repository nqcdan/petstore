# Slides

Two 16:9 decks (1920x1080 per page, English with Vietnamese subtitles) built from live screenshots of the demo.

| Deck | Pages | Content |
|---|---|---|
| [petstore-admin-walkthrough.pdf](petstore-admin-walkthrough.pdf) | 12 | Admin site: Keycloak login, dashboard, products, form, food, orders, customers, employees, "No permission" |
| [petstore-storefront-flow.pdf](petstore-storefront-flow.pdf) | 15 | Shop SPA: home, search, cart, SSO, checkout, order, history, language, dark mode, mobile |

`images/` keeps 8 representative screenshots (PNG, 1920x1080). The full set lives in `src/shots/` (git-ignored) and is
recreated by the capture script.

## Rebuild

Needs Node 20+ and a Chromium for Playwright.

```sh
cd docs/slides/src
npm install
npx playwright install chromium   # once
npm run capture -- admin          # read-only: signs in as demo-admin, then demo-user for the "No permission" page
npm run capture -- shop-browse    # read-only: anonymous browsing, cart, language, dark mode, mobile
npm run capture -- shop-order     # places ONE demo order (COD) as demo-user; each run adds an order
npm run build                     # writes both PDFs next to this README
```

- `capture.mjs` writes `src/shots/*.png` and `meta.json` (boxes of the red highlight rings). Passwords are typed only
  after the empty login form is captured. Customer, employee and username columns are blurred before the screenshot.
- `build.mjs` holds the HTML/CSS template, the captions and the slide order. Inter is embedded from
  `@fontsource-variable/inter`; screenshots are re-encoded as JPEG so each PDF stays well under 12 MB.
- After `shop-order`, restore the demo data with `deploy/reset-demo.sh` on the server.

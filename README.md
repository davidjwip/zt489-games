# zt489-games

Launcher hub for the family's static sites — served at **https://games.zt489.com**.

One static `index.html`, no build step, no dependencies. Cloudflare Pages serves the
repo root as-is (build command empty, output directory `/`).

| Card | Hostname | Pages project |
| --- | --- | --- |
| What time is it? | clock.zt489.com | `tellingthetime` |
| Sound practice | spelling.zt489.com | `plm-flashcards` |
| Fun maths | maths.zt489.com | `simplekindergartenadditionwebpage` |

## Adding a card

Copy one `<a class="card">` block, give it `--accent` via a class in the `<style>` block
(or reuse an existing one), and bump the count in the header paragraph. Absolute URLs —
the hub is a different origin from each app, so relative paths won't work.

## Redeploying

Push to `main`; Cloudflare Pages builds and deploys automatically. Nothing else to run.

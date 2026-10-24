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

## Usage beacon (how often does the same browser come back?)

Cloudflare's own Web Analytics cannot answer that: it holds no persistent identifier, and a Free
zone keeps no request logs. So the four sites carry a few lines that mint a random UUID per browser
and store it in a `domain=.zt489.com` cookie, making one child one client across clock, spelling,
maths and games. It is a first-party identifier and nothing more — no IP, no User-Agent, no page
content, no third-party script.

Pieces:

- `index.html` — the beacon: read/mint `zt489_vid`, then POST `{v, h, p}` to `/api/hit`.
- `functions/api/hit.js` — validates the UUID and writes one Analytics Engine data point to the
  `HITS` binding (dataset `zt489_hits`): index = client id, blobs = site hostname, path, country.
  Answers 204 even when the binding is absent, so a half-configured deploy never errors on a
  child's page.
- Binding `HITS` → dataset `zt489_hits` must exist on the Pages project (production *and* preview)
  before hits are stored.

Queries go to the Analytics Engine SQL API
(`POST /accounts/<account_id>/analytics_engine/sql`, token permission **Account Analytics: Read**),
retention 3 months:

```sql
-- one row per browser: how much it comes back
SELECT index1 AS client, count() AS hits,
       min(timestamp) AS first_seen, max(timestamp) AS last_seen
FROM zt489_hits GROUP BY client ORDER BY hits DESC;

-- which game gets opened, by site and path
SELECT blob1 AS site, blob2 AS path, count() AS hits
FROM zt489_hits GROUP BY site, path ORDER BY hits DESC;

-- return frequency: browsers by number of distinct days seen
SELECT days, count() AS clients FROM (
  SELECT index1, count(DISTINCT toDate(timestamp)) AS days FROM zt489_hits GROUP BY index1
) GROUP BY days ORDER BY days;
```


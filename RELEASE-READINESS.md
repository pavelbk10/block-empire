# The Syndicate 0.10 — release status

This release is a playable online beta of the existing Hebrew browser game. It is not a certified commercial launch or a native Unreal build.

## Implemented

- Delayed recon, credit theft, raids and sabotage against player-owned properties; outcomes use the server's seeded RNG and current defenses.
- Private reconnaissance dossiers and operation reports, defense warnings, 1–5 training/guards/vault/property-security levels, recruitment and repair.
- Property condition reduces revenue, customer demand, factory production and fictional mining. Ownership and development levels survive attacks; minimum condition is 25/100.
- Four-quarter opening protection, one operation per organization per quarter, one hostile pending operation per defender, recovery protection for the resolution quarter and the following quarter after successful hostile action.
- Bounded theft from cash above vault protection, never from escrow. Equipment, operating budgets and rescue payments are sinks; transfers between players conserve credits.
- CAS-protected online actions and bounded request deduplication. All operation outcomes remain authoritative on the server. Enemy dossiers, reports, crew counts, training, guard/vault levels and property security are excluded from room responses. Public totals still reveal aggregate operating overhead and game scores; this is not perfect information-theoretic secrecy.
- Thirty committed commands per member per ten seconds; successful retries do not consume quota. This room-level throttle is not global DDoS protection or an account-abuse system.
- Operations dashboard, property health/repair tools, map health bars and shield rings, private outgoing mission paths, onboarding checklist, responsive styling and reduced-motion CSS.

## Validation

`node --test tests.mjs development-tests.mjs industry-tests.mjs auto-supply-tests.mjs warfare-tests.mjs client-smoke-tests.mjs adventure-tests.mjs`

`node expansion-tests.mjs`

Together: 131 automated checks, including 60 complete AI seasons. Conflict checks cover privacy, ownership, startup/recovery protection, ceilings, cost atomicity, theft conservation, sabotage inventory bounds, repair, changing defenses, expiring intelligence, migration, D1 concurrency, request deduplication, server quarter resolution, throttling, reset and code-level canvas/DOM initialization.

The code-level canvas and DOM stubs exercise JavaScript execution, not actual rendering quality. Real browser screenshots, mobile touch usability and cross-browser visual QA have not been performed in this environment.

## Before a commercial launch

- Run real iOS/Android device and browser QA, accessibility review, touch-map usability checks, onboarding playtests and sustained match-balance sessions with players.
- Run load tests against an isolated environment with concurrent rooms, D1 contention, reconnects, timeout recovery and failure injection. Establish supported concurrency and monitor error rates.
- Implement durable player accounts and account recovery if players must reconnect across devices. Current anonymous seat credentials are saved in the joining browser; invitation rooms are not a global account system.
- Decide persistent progression, matchmaking, moderation/reporting, support, room expiry and retention, backups/recovery, deployment rollback and operational alerting.
- Complete security review and abuse controls, including account/IP-level room-creation limits. Current room-member action throttling is only one layer.
- Define and review any monetization, store billing, consent/privacy terms and age-rating requirements before introducing ads or purchases. No ads, payments, real crypto or transferable real-money value exist in this release.
- A native Unreal edition needs a separate implementation, build pipeline, performance work and store testing. This repository deploys the browser edition.

Rooms advance on requests/polling. An empty room pauses until a player returns. Each active human turn has a two-minute deadline. Successful restart preserves room membership and invitation; it clears the season's conflict history.


The promenade update additionally validates side-mission payouts, answer privacy, timed abandonment, 2,000 generated arithmetic challenges, long/unlimited seasons, host-only continuation and property/station picking. Sample overview, close-up and night images were rendered directly with a native Canvas implementation to inspect the map geometry; these are not browser screenshots and do not verify HTML/CSS or mobile interaction.

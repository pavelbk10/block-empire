# Block Empire — The Syndicate 0.8

Playable Hebrew city strategy game. Browser client: `public/play/`. Server room API: `server/rooms.mjs`, routed through Vinext and persisted in Sites D1. This repository contains the browser game, not a compiled Unreal application.

## Features
144 parcels in 12 districts; 40/80/160-quarter seasons (score victory can finish earlier); five immediate development levels with rising income (no construction stages); permits and player-run industrial supply chains; 24 buyable business types: groceries, supermarkets, cafes, restaurants, bakeries, pharmacies, clinics, gyms, daycares, laundries, hardware shops, garages, horse farms, fictional Bitcoin farms, train stations, offices, hotels factories, cement works, sawmills, glass works, steel works, brick works and airports; retail stock, pricing, demand and realized quarterly sales; delivery vehicles, taxis, buses and trains, each with five levels, routes, upgrades and resale; property offers with escrow and auctions; neighborhoods, energy, research, missions, fictional mining; resident wellbeing boosted by parks, playgrounds, paths, schools, community centers and diverse services; three-question trivia questionnaires awarding one action step per correct answer plus two steps and a permit voucher for a perfect questionnaire.

## Online play
Create a room, share its invitation URL and wait for up to three friends to join before the host starts. Vacant seats use AI. Anyone holding the unguessable invite URL can join before start. Room state is server-owned, not copied from browser saves. A random per-player secret is hashed in D1 and retained locally in the browser for reconnect. Reconnect from the same browser using the room URL. Human turns expire after two minutes. Bots and deadlines advance on client polling every 1.5 seconds; an empty room pauses until somebody returns. Inactive tabs can update less often due to browser throttling. Local-only play continues to use device storage.

D1 compare-and-swap revisions serialize concurrent actions. Request IDs deduplicate retried actions. Quiz solutions and RNG state are omitted from responses. Room names are escaped before rendering. This is a playable prototype, not a financial or blockchain product.

## Checks
- `node --test tests.mjs` — 24 regression checks.
- `node --test development-tests.mjs` — 13 development, catalog, welfare, transport, migration and questionnaire checks.
- `node expansion-tests.mjs` — 25 expansion and multiplayer checks, using real SQLite behind a D1-shaped adapter and concurrent calls.
- Build using the Sites build helper; migrations generated from `db/schema.ts` under `drizzle/`.

Automated simulations cover 60 AI seasons. Browser visual/mobile QA and an Unreal/native mobile build have not been performed in this environment.

Version 3/4 local saves and shared room payloads migrate once to version 5. Already-paid construction is immediately converted to its next development level; player ownership, cash, rooms and invitations are preserved.

## Industry and travel
Factories can be bought and upgraded without materials, preventing supply deadlocks. They start with a small stock and produce bounded inventory every quarter. Production costs are included once in quarterly upkeep. Owners withdraw stock free; other players pay the listed price directly to the owner. The former anonymous supplier commands are disabled.

Players can book a ride on another player's fleet and pay its owner. Airports sell three holiday packages that raise personal wellness and provide a temporary 10% income boost. These player payments are credited immediately and displayed separately from the next quarter's forecast, avoiding double counting.

## New city and map controls
New City opens the in-game setup dialog without a browser-native confirmation or an online-session block. Choose a new local game, a new online room, or (host only) reset the existing room and preserve members and invite. Reset requests are idempotent, including after the new season starts. Abandoned session responses cannot overwrite a new local city.

Mousewheel zoom is anchored to the world point beneath the cursor, bounded to 40–600%. Drag to pan or use the recenter button. The client uses explicit module revisions to avoid retaining cached old controls.

`node --test industry-tests.mjs`: 13 factory, fare, vacation, migration, new-city state and camera checks. Total automated checks: 83, including 60 AI seasons. Manual browser/mobile visual QA is not available here.

## Automatic construction supply
Property purchases and development now include raw materials in the same transaction. Existing personal inventory is used first, then owned factory stock, then the cheapest eligible player factories. Missing market stock is automatically completed at a fixed wholesale price. The combined price is shown before purchase, and a maximum accepted price prevents a concurrent price change from causing a higher charge. Seller payments, factory stock, buyer cash and development commit atomically with the room revision; retries do not charge twice. No separate shopping action is required.

`node --test auto-supply-tests.mjs`: 8 combined-purchase, sourcing, affordability and price-limit checks. Existing saves remain compatible.

## The Syndicate
Delayed recon, theft, raids and sabotage are implemented in `public/play/warfare.mjs` and integrated with quarterly economics. The operations dashboard includes crews, five levels of training/guards/vault/property security, private reports and intel, health, recovery protection and repair. Online responses redact enemy private warfare data. Saved economy games migrate once via `warfareVersion: 1`, preserving their existing version-5 economy and membership.

`node --test warfare-tests.mjs client-smoke-tests.mjs` adds 21 conflict, private multiplayer and code-level UI checks. Current total: 104 checks. See `RELEASE-READINESS.md` for implemented behavior, verification limits and remaining commercial launch work.

## Expanded trivia bank
200 new authored Hebrew questions across ten topics extend the legacy 32-question bank to 232. Every question has four distinct choices and a short explanation. New entries append after the original bank so saved question IDs and open online questionnaires remain compatible. The existing three-question format, shuffled options, unseen-question selection and action bonuses remain in place.

## Promenade and extended seasons (0.10)
A sixteen-station mission loop runs along both sides of the city. One move per turn costs one AP and advances 1–3 stops. Trivia and generated arithmetic award a one-time cash reward of 450–1,250, 20 XP and 10 prestige on a correct answer; crossing the finish adds 1,000 credits. Answers and peer challenges are redacted from online snapshots; normal CAS and request deduplication cover movement and reward claims. End-turn timeout abandons unanswered tasks.

Choose 12k/25k/50k/100k prestige or no target, and 40/80/160/320/640 quarters or no round limit. Existing games retain their settings. The host can extend an active or finished score/time season without resetting assets, cash, membership or invite. Limits can only increase, and a game with a sole survivor cannot resume. New-game UI defaults to 50,000 prestige / 320 quarters.

The renderer spaces parcel centers 50% farther apart while retaining saved world coordinates. Closer hit hulls, selected-building outlines and a focus button make picking buildings easier. Building facades, roofs, shop awnings, terraces, walking limbs, traffic turns and mission character movement use procedural Canvas graphics. Reduced-motion preferences are respected.

`node --test adventure-tests.mjs` adds 27 checks, including 2,000 generated arithmetic challenges, network privacy/deduplication, season continuation, picking after rotations, map spacing and continuous vehicle loops. The client smoke check also exercises route rewards and unlimited-season HUD values.

## Rail and factory visuals (0.11)
Rail vehicles now use a dedicated electric locomotive and passenger-coach renderer rather than the road vehicle model. The consist includes bogies, axles, couplings, passenger windows, doors, side stripes, cab glazing and a pantograph. Detailed sleepers, rails and overhead wires form the track; the complete train stays within its segment when moving in either direction.

Factories have modeled exhaust stacks and deterministic rising, drifting, fading smoke particles. Material factories emit only while their forecast output is positive, so a full output warehouse stops the smoke; generic industrial factories emit while active and earning income. Unowned, undeveloped and eliminated-owner factories do not emit. Reduced-motion preferences disable smoke animation. Visual calculations do not change game RNG, inventory, money or production.

Validated with the existing canvas/picking/zoom/client smoke checks, direct activity/particle/rail-bound assertions and native Canvas day/night close-up frames. Real browser/mobile visual QA remains outstanding.

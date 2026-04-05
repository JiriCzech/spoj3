# NETRUNNER MATCH

> **Hack. Earn. Upgrade. Repeat.** — A cyberpunk match-3 roguelike PWA.

**NETRUNNER MATCH** is a "Candy Crush meets Balatro" hybrid. You're a netrunner hacking corporate networks by matching colored tiles on an 8×8 grid. Each contract has a hack-progress target and limited moves. Completing contracts earns Eurodollars, which you can spend on upgrades between levels. The game is infinite — target scores scale exponentially.

**Play:** [Open in browser](./index.html) (or serve via any static HTTP server)

---

## Features

- **Match-3 Engine** — Swap adjacent tiles to form runs of 3+. Gravity, cascades, and chain reactions.
- **Special Tiles** — Match 4 to create a **Bomb** (clears 3×3 area). Match 5+ to create a **Color Clear** (wipes all tiles of one color).
- **24 Upgrades** — Common, Rare, and Legendary upgrades with meaningful mechanical differences (score multipliers, extra moves, time extensions, active abilities).
- **Contract System** — 6 cyberpunk clients with escalating difficulty. Infinite progression with exponential scaling.
- **Shop** — Weighted random offers (common 60%, rare 30%, legendary 10%) with affordability safeguards.
- **Sound** — Web Audio API oscillator-based SFX. No external files needed. Toggle on/off.
- **PWA** — Installable, offline-capable, mobile-first responsive design.
- **Cyberpunk Theme** — Neon glow effects, scanline overlay, boot sequence with Matrix data rain.
- **Accessibility** — Respects `prefers-reduced-motion`. Tiles have Unicode shape symbols (colorblind-friendly).

---

## How to Play

1. **NEW RUN** — Start a fresh run at Level 1.
2. **EXECUTE CONTRACT** — Review the contract target and reward, then start hacking.
3. **Match tiles** — Tap a tile, then tap an adjacent tile to swap. Match 3+ to score hack progress.
4. **Special tiles** — Tap 💥 Bombs to clear a 3×3 area. Tap 🌀 Color Clears to wipe all tiles of that color.
5. **Complete the contract** — Fill the hack bar before running out of moves or time.
6. **Buy upgrades** — Spend earned €€ on permanent upgrades that persist across contracts.
7. **Repeat** — Each contract gets harder. How far can you go?

### Controls
- **Touch/Click** — Tap a tile to select, tap an adjacent tile to swap.
- **Sound toggle** — 🔊 button in the top-right corner of the game screen.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Markup | Vanilla HTML5 |
| Styles | Vanilla CSS3 (custom properties, animations, responsive) |
| Logic | Vanilla JavaScript (ES6+) |
| Audio | Web Audio API (oscillators, no files) |
| Storage | localStorage (best runs, stats) |
| Offline | Service Worker (cache-first) |
| Install | Web App Manifest (PWA) |

**Zero dependencies. Zero build tools. Zero frameworks.**

---

## Project Structure

```
spojt3/
├── index.html              # Main entry point, screen definitions
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker (offline cache)
├── README.md               # This file
├── css/
│   ├── theme.css           # Color palette, reset, animations, scanline
│   └── game.css            # All game UI styles (tiles, HUD, screens)
├── js/
│   ├── state.js            # Global STATE, reset functions, save/load
│   ├── audio.js            # Web Audio SFX generator
│   ├── upgrades.js         # 24 upgrade definitions + score hooks
│   ├── engine.js           # Core match-3 engine (grid, swap, match, cascade)
│   ├── shop.js             # Shop offers, purchase logic
│   └── main.js             # Screen orchestration, boot, menu, PWA
├── icons/                  # PWA icons (192px, 512px)
└── brainstorm/             # Design docs (Czech)
```

---

## Upgrade System

### Common (€€ 80–130)
| ID | Name | Effect |
|----|------|--------|
| `cyan_boost` | 🔵 CYAN CHANNEL | Cyan tiles give +75% hack progress |
| `purple_boost` | 🟣 PHANTOM LINK | Purple tiles give +75% hack progress |
| `green_boost` | 🟢 VIRAL PAYLOAD | Green tiles give +75% hack progress |
| `red_boost` | 🔴 BREACH CHARGE | Red tiles give +75% hack progress |
| `efficient_runner` | 💰 EFFICIENT RUNNER | Unused moves = +25€€ each (instead of +8) |
| `extra_moves` | ➕ WETWARE UPGRADE | +4 moves per contract (stackable) |
| `four_match_bonus` | ⚡ OVERCLOCKED PARSER | Match-4+ = 2× score |
| `extra_time_small` | ⏱ CLOCK EXTENSION v1 | +15s per contract (stackable) |
| `time_on_match4` | ⏳ TEMPORAL EXPLOIT | Match-4+ adds +3s to timer |

### Rare (€€ 180–230)
| ID | Name | Effect |
|----|------|--------|
| `combo_multiplier` | 🔁 NEURAL FEEDBACK | Same color in a row = 1.5×–2× score |
| `cascade_amplifier` | 🌊 DATA SIPHON | Each cascade level = +20% score |
| `extra_shop_slot` | 🛒 CORP ESPIONAGE | 4 shop offers instead of 3 |
| `move_on_big_match` | 🔗 REDUNDANT LINK | Match-5+ = +1 move |
| `overclock_first` | 🥶 COLD BOOT | First 3 matches = 2× score |
| `extra_time_large` | ⏱ CLOCK EXTENSION v2 | +30s per contract |
| `time_to_moves` | 🔄 CHRONOS CONVERT | End of contract: 5s = +1 move |
| `time_score_bonus` | 🔥 DEADLINE PRESSURE | ≤15s left = 2× score |

### Legendary (€€ 350–450)
| ID | Name | Effect |
|----|------|--------|
| `flatline_prevention` | 🛡 FLATLINE PROTOCOL | Once per run: 0 moves → get 6 moves |
| `market_crash` | 📉 MARKET CRASH | All upgrades 40% cheaper |
| `double_euros` | 💵 CORPO BUYOUT | All contracts pay 2× €€ |
| `blackout` | 💥 BLACKOUT BURST | Active: clear most common color once |
| `perfect_swap` | 🎯 NETRUNNER'S EDGE | Match-5+ swap costs no move |
| `ripperdoc` | 🔩 RIPPERDOC SPECIAL | One upgrade applies 2× |
| `time_freeze` | ❄ TEMPORAL BLACKOUT | Active: freeze timer 20s |

---

## Scoring

| Match Size | Base Score |
|------------|-----------|
| 3 tiles | 50 |
| 4 tiles | 100 |
| 5 tiles | 200 |
| 6+ tiles | 200 + 40 per extra tile |

Special tile activation (Bomb / Color Clear) awards **30 points per cleared tile**.

---

## Development

### Running locally

Just open `index.html` in a browser, or serve via a static server:

```bash
# Python
python -m http.server 8000

# Node.js (npx)
npx serve .

# PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

### PWA testing

For full PWA features (install, offline), serve over **HTTPS** or **localhost**.

### Code conventions

- No frameworks, no build tools
- IIFE pattern for encapsulation
- Global API via `window.*` exports
- CSS custom properties for theming
- `prefers-reduced-motion` respected

---

## License

This project is provided as-is for educational and entertainment purposes.

---

*Built with vanilla HTML, CSS, and JavaScript. No frameworks were harmed in the making of this game.*

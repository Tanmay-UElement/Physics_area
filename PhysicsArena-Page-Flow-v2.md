# PhysicsArena — Page Flow & Landing Page Design (v2)
### No Login/Signup for now — guest-only build

## 1. Total Pages — Sitemap

**8 pages total for this phase** (auth removed, 3 new necessary ones added).

| # | Page | Route | Priority | Note |
|---|---|---|---|---|
| 1 | Landing / Home | `/` | MVP | |
| 2 | Class Select | `/class-select` | MVP | |
| 3 | **Tutorial / First-Round Walkthrough** | `/tutorial` (or modal on first Match load) | **NEW — MVP** | Needed since there's no onboarding via account setup |
| 4 | Match (Gameplay) | `/match/[mode]` | MVP | |
| 5 | Match Summary | `/match/[mode]/summary` | MVP | |
| 6 | **Session Stats (Guest Profile)** | `/stats` | **NEW — MVP** | Replaces "Profile" — local/session-only, no login |
| 7 | **Loading / Engine Init Screen** | (state, not a route) | **NEW — MVP** | Physics + asset loading needs a real state, not a blank screen |
| 8 | Leaderboard | `/leaderboard` | Post-MVP, deferred | Needs accounts eventually — skip entirely for now |

**Login/Signup, Profile with persistence, and Leaderboard are all removed or deferred** — nothing in this phase depends on identity.

---

## 2. Full User Flow (Guest-Only)

```
Landing (/)
   │
   └── [Play Now]
          │
          ▼
     Class Select (/class-select)
          │  (Kinetic unlocked, others "Coming Soon")
          ▼
     First time only → Tutorial (short walkthrough or in-canvas hint overlay)
          │
          ▼
     Match — Gameplay (/match/trick-shot)
          │  (Loading state → 5 rounds, escalating difficulty)
          ▼
     Match Summary (/match/trick-shot/summary)
          │
          ├── [Play Again] → new round set (in-memory, resets on refresh)
          ├── [View Session Stats] → Session Stats page
          └── [Back Home] → Landing

Session Stats (/stats) — in-memory only, cleared on refresh/close
   (small note in UI: "Sign in soon to save your progress" — sets up future auth without building it now)
```

**Key change from v1:** since there's no account, all progress (XP, match history) lives in **React/Zustand state for the session only**. This is explicitly temporary — the UI should hint that saving is "coming soon" so the guest experience doesn't feel broken, just early.

---

## 3. Landing Page — Detailed Layout (unchanged core, auth references removed)

| Section | Content | Purpose |
|---|---|---|
| **1. Hero** | Headline: *"Don't learn physics. Win at it."* + **[Play Now]** CTA (no "Sign Up" option shown) | Immediate hook |
| **2. How It Works strip** | 3 steps: *Solve it → Watch it fire → See if you're right* | Sets expectation |
| **3. Class Preview row** | 5 class cards, Kinetic active, others greyed | Shows roadmap |
| **4. Live Preview embed** | Concept #1 playable directly on landing page, no gate at all now (since there's no login to skip) | Zero-friction hook |
| **5. Footer CTA** | Repeat **[Play Now]** | Second conversion point |

Since there's no login wall, **the "Live Preview embed" and the actual `/match` page can share the same component** — reduces build work, not just UX polish.

---

## 4. Page-by-Page Detail (Updated)

### Class Select
- Same as before: grid of class cards, only Kinetic clickable

### NEW — Tutorial / First-Round Walkthrough
- Lightweight: 3-step overlay shown once (session-based flag, not account-based) on top of the actual Match canvas — *not* a separate content page
- Step 1: "This is your avatar" (points at avatar) → Step 2: "Solve the physics" (points at input) → Step 3: "Watch it happen" (points at canvas)
- Dismissible, never shown again this session

### Match (Gameplay) — core page, unchanged
- Split layout: canvas left, solve panel right
- **NEW: Loading state** — while Matter.js/PixiJS/assets initialize, show a short branded loading animation (avatar idle-bob loop works here too, reused asset) instead of a blank canvas flash

### Match Summary — unchanged, minus "View Profile" → now "View Session Stats"

### NEW — Session Stats (replaces Profile)
- Same content as the old Profile page (accuracy history, XP, avatar gear preview) but explicitly labeled as **temporary/session-only**
- Small persistent banner: *"Playing as Guest — progress won't be saved after you close this tab"*
- No settings, no editable fields — read-only summary of this session's matches

### Leaderboard
- Fully deferred, not built, not routed — requires accounts, out of scope for this phase

---

## 5. Build Priority for Pages

1. **Match (gameplay)** — the actual product, build first
2. **Loading state** for Match — small but necessary, avoid a jarring blank-canvas moment
3. **Landing** (can reuse Match component for the live preview embed — saves time)
4. **Class Select, Match Summary** — thin, quick once Match works
5. **Tutorial overlay** — build after Match works, since it's just an overlay on top of it
6. **Session Stats** — build last among MVP pages, it's just a read-only view of state already being tracked for scoring
7. Login/Signup, persistent Profile, Leaderboard — **explicitly not built this phase**

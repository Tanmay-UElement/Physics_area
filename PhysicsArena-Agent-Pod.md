# PhysicsArena — Agent Pod
### An In-Game AI Companion That Explains What Each Game Is and How to Play It

---

## 1. What Is Agent Pod

**Agent Pod is a small floating companion avatar that lives alongside the player through every page and round.** Its only job is to remove confusion — "what is this round about," "what am I supposed to do," "what does this formula mean" — without ever just handing over the answer.

Think of it as a cross between a game tutorial NPC and a contextual help chatbot, except it's visually present as a character (a "pod"), not a hidden help-menu link.

**Why this matters for this product specifically:** because every concept in Kinetic and Volt uses a *different* game mechanic (drag, crank, tap-timing, wiring, etc.), a first-time player hitting Concept #5 has no guarantee they'll intuitively know the controls just because they learned Concept #1. Agent Pod is the answer to "how does the player learn a brand-new mini-game every round without a wall of instructions."

---

## 2. Where Agent Pod Appears

| Page | Pod Behavior |
|---|---|
| Landing | Idle in a corner, small wave animation, optional 1-line greeting bubble ("New here? I'll show you around.") |
| Class Select | Explains what each class is about on hover/tap of a class card (short blurb) |
| Tutorial overlay | **Pod replaces the generic tutorial overlay entirely** — Pod itself walks the player through "This is your avatar," "Solve the physics," "Watch it happen," in its own voice/personality instead of a plain UI overlay |
| Match (Gameplay) | Always present in a corner, minimized by default; auto-expands with a short "Here's the goal" bubble at the start of each new round/concept; tappable any time for more help |
| Match Summary | Reacts to performance (encouraging comment either way), never judgmental on a miss |
| Session Stats | Optional: light commentary like "You're getting faster at Predict & Reveal rounds" |

**Key UX rule:** Pod is never forced full-screen or blocking. It's a corner presence the player can expand or ignore — this keeps it from feeling like a nagging tutorial popup.

---

## 3. Visual Design of Pod

- A small **floating orb/drone-style character** (not a humanoid mascot) — fits the esports/arena aesthetic better than a cutesy sidekick, and is cheap to animate (glow, hover-bob, tilt) without needing a full character rig
- Color accents shift per class (teal/blue for Kinetic, could shift electric-yellow for Volt later) — ties Pod visually to the "class" identity already established in class cards
- Idle animation: gentle hover-bob + occasional blink/pulse (reuses the same GSAP idle-loop pattern already used for the player avatar — no new animation system needed)
- Speaking state: small glow pulse + chat bubble appears above it (text-based, not voice, for MVP)

---

## 4. Core Features

### 4.1 "Explain This Round" (primary feature)
- Auto-triggered once per concept, first time a player enters it: a short (2–3 sentence) bubble explaining **what the round is about and what to do** — not the formula, not the answer, just the goal and controls
- Example (Concept #1, Horizontal Projectile): *"Your launcher's on a platform, and the target's straight ahead. Figure out how fast to launch so gravity brings you down right on it. Type your velocity guess and hit Launch."*
- Example (Volt Concept #5, Generator Crank): *"Hold the crank slider and find the right speed — too slow and the bulb stays dark, too fast and you'll blow it. Watch the voltage meter to know how close you are."*

### 4.2 "Ask Pod" (on-demand chat)
- Tap Pod any time → small chat panel opens → player can type a question ("what does τ mean," "why did I miss," "what's Ohm's law again")
- Pod answers **conceptually**, using the actual round's live data (target values, current attempt) for context — but is explicitly instructed never to output the exact numeric answer the player needs to submit
- This is the one part of the product that needs a live LLM call (see Section 6) rather than static scripted text, since questions are open-ended

### 4.3 Hint Ladder (progressive help, not instant answers)
Three tiers, unlocked in order if the player is struggling (e.g., after 2 misses on the same round):
1. **Nudge** — restates the goal, no formula ("Remember, you need the time it takes to fall first.")
2. **Formula reveal** — gives the relevant equation, no numbers plugged in
3. **Worked structure** — shows *how* to set up the calculation with the round's actual known values, but still requires the player to do the final arithmetic and type the answer

This protects the core learning loop (from the original Product Document) — Pod assists, but never removes the "solve it yourself" moment that makes the hit/miss feedback meaningful.

### 4.4 Post-Round Commentary
- Short reaction after each round (Hit/Close/Miss), pulled from a small pool of encouraging, non-repetitive scripted lines — this does **not** need an LLM call, just variety in a static content pool, to keep costs down for something shown constantly

---

## 5. Content Needed — "Pod Briefing" Per Concept

Every concept (all 8 Kinetic + all 8 Volt, defined in earlier docs) needs a short **Pod Briefing** written before that concept is build-ready. This is new required content, not previously specified:

| Field | Purpose | Example (Kinetic #1) |
|---|---|---|
| **Goal line** (1 sentence) | What Pod says on first entry | "Launch your shot so it lands exactly on the target." |
| **Controls line** (1 sentence) | How to physically interact with this round's mechanic | "Type your launch speed, then hit Launch." |
| **Nudge hint** | Tier 1 hint text | "Think about how long it takes to fall before you worry about speed." |
| **Formula hint** | Tier 2 hint text | Reveals `t = √(2h/g)` and `v = d/t`, unlabeled with numbers |
| **Miss reaction pool** (3–5 lines) | Rotates on Miss, non-punishing tone | "So close — check your fall time again." / "Off by a bit, try again!" |
| **Hit reaction pool** (3–5 lines) | Rotates on Hit | "Direct hit! Nice math." / "Perfect trajectory!" |

**This means: 16 concepts × this briefing template = the actual Pod content backlog.** Recommend writing these alongside each concept's QA checklist (from the Concept Curriculum docs), not after — Pod content is part of "done," not a follow-up task.

---

## 6. Technical Implementation

| Feature | Needs Live LLM Call? | How |
|---|---|---|
| Explain This Round | ❌ No | Static text from the Pod Briefing content table (Section 5) |
| Hint Ladder (tiers 1–2) | ❌ No | Static text from Pod Briefing |
| Hint Ladder (tier 3, worked structure) | ⚠️ Optional | Can be static (templated with the round's actual numbers) or LLM-generated for more natural phrasing |
| Ask Pod (open chat) | ✅ Yes | Needs a real API call — this is the only feature that truly requires an LLM |
| Post-round commentary | ❌ No | Static rotating pool |

**For "Ask Pod":**
- Backend: a Next.js API route (`/api/pod-chat`) that calls the Claude API server-side (never expose an API key client-side)
- System prompt includes: the current concept's name, governing formula, the round's specific values, and an explicit instruction: *"Never state the exact numeric answer the player needs to submit. Explain concepts, help debug their reasoning, and encourage — but the player must do the final calculation themselves."*
- Keep responses short (2–4 sentences) — this is a chat bubble, not an essay panel
- Rate-limit or cache lightly, since this is the only per-message-cost feature in the whole app

---

## 7. Additional Changes to Existing Docs (Showcasing Pod System-Wide)

### 7.1 Page Flow Update
- **Tutorial page/overlay is removed as a separate concept** — Pod's "Explain This Round" + first-visit walkthrough absorbs that role entirely. One less thing to build separately.
- Add a small **global Pod component** (persistent across all pages, not route-specific) to the sitemap — it's not a page, it's a layout-level element, similar to how the Loading state was noted as "a state, not a route"

### 7.2 New Component to Build
| Component | Purpose |
|---|---|
| `<AgentPod />` | Persistent floating orb, idle/speaking states, positioned corner-fixed across all pages |
| `<PodChatPanel />` | Expandable chat UI, opens on tap, calls `/api/pod-chat` |
| `pod-briefings.json` (or per-concept data file) | Stores the Section 5 content table for all 16 concepts |

### 7.3 Build Priority (Where Pod Fits Into the Existing Sequence)
1. Build `<AgentPod />` idle presence + "Explain This Round" static bubbles — do this **right after Concept #1 works** (from the Master Build Document's Step 1), since it reuses the same GSAP idle-bob pattern already built for the player avatar
2. Add Hint Ladder tiers 1–2 (static) once 2–3 concepts exist, so there's more than one Pod Briefing to test variety against
3. Add `<PodChatPanel />` + live API route **last**, after the core game loop across both classes is validated — it's the most expensive/complex piece and the least essential to the core hook

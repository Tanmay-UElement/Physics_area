# PhysicsArena — Agent Pod v2.0
### Physics-Embodied Companion System

> This document supersedes the original `PhysicsArena-Agent-Pod.md` (v1), which described a text-hint chatbot model. Pod 2.0 replaces that approach entirely.

---

## 1. The Core Principle — Diegetic Embodiment

> **The companion doesn't explain the physics. The companion's own body obeys the physics.**

Each Agent Pod's animation state is wired into the *same* physics/math engine used for the simulation it is mentoring. It is a second, smaller simulation running in parallel — not a UI overlay.

| Class | Agent | Embodiment Rule |
|---|---|---|
| Kinetic | **TITAN-X** | Pod behaves as a lever/pendulum; visibly tips, wobbles, or overcorrects in proportion to the player's torque/momentum error |
| Volt | **SYNAPSE** | Pod's internal "charge" pulses and decays along the player's actual (possibly wrong) RC time constant; segments dim like resistors under load |
| Wave | **NOVA** | Pod moves as a wave-form; splits into two phase-shifted echoes that constructively/destructively combine per the player's interference setup |
| Kinetic / Optics | **AURA-9** | Pod's approach path is a literal parabola or refracted ray computed from the player's current trajectory inputs |

**Effect:** a student doesn't need to be *told* their torque is unbalanced — they watch TITAN-X visibly struggle to stay upright using their exact numbers, before they even hit launch.

---

## 2. Interaction Model — No Chat Box

There is no text input field. All agent communication is **visual/kinetic first**, voice-narrated second (TTS is an accessibility layer, not the primary channel).

| Gesture | Behavior | Replaces |
|---|---|---|
| **Tap** | Cycles hint tier (Nudge → Formula → Setup); shown as a widening aperture glow on the pod | Chat message / hint button |
| **Hold** (>600 ms) | Pod performs a live micro-demo using the player's *current* entered values (ghost-launch, mini RC decay, etc.) alongside the real attempt | "Show me the answer" chat request |
| **Drag → equation panel** | Pod docks and highlights the specific variable it infers is being misread | Chatbot pointing out an error in text |
| **Idle / hesitation** | Pod proactively shifts posture/color (anxious flicker, confident glow) *before* being asked | Proactive chatbot message |

---

## 3. Hint Tier System — Aperture, Not Chat

Hints are surfaced as an expanding aperture glow on the pod body, not as a chat bubble. Each tap widens the aperture; each new tier is visually distinct:

| Tier | Aperture Color | Content |
|---|---|---|
| 0 (closed) | — | No overlay; only physics body visible |
| 1 — Nudge | Sky blue glow | Restates physical objective; no formula |
| 2 — Formula | Purple glow | Governing algebraic equation, no numbers |
| 3 — Setup | Amber glow | Structured setup with current round values; final arithmetic left to player |

TTS narrates each tier aloud (mutable by the player). Voice is an *accessibility* channel, not the primary one.

---

## 4. Where Agent Pod Appears

| Page | Pod Behaviour |
|---|---|
| Landing | Idle float with neutral physics body (AURA-9 parabola, nearly flat arc) |
| Class Select | Physics body shifts to match class theme on card hover (lever tips, circuit charges, wave echoes) |
| Match (Gameplay) | Always present, corner-fixed; physics body live-driven by player's current inputs |
| Match Summary | Hit → confident-glow posture + maturity aura brightens; Miss → anxious posture; scars updated |
| Session Stats | Aura at current maturity brightness; cosmetic scar history visible |

**Key UX rule:** Pod is never forced full-screen or blocking. It is a corner presence the player expands (via tap/hold) or ignores.

---

## 5. Per-Agent Physics Body Spec

### AURA-9 — Parabola Ghost (Kinetic / Optics)
- Renders a live parabolic arc SVG computed from the player's velocity/angle inputs
- Arc skews above/below ideal trajectory proportional to `arcDeviation` (0..1)
- Ideal arc (correct solution) shown in solid stroke; player's ghost arc in dashed stroke
- Over-shot: ghost arc peaks above ideal; Under-shot: ghost arc falls below

### TITAN-X — Lever Beam (Kinetic)
- Lever beam rotates `tiltAngle` degrees (-45° to +45°) based on torque error
- `tiltAngle = (1 - proximity) × 45°`; sign determined by over/under application of force
- `isOverTilted` (|tiltAngle| > 40°) triggers spring-wobble animation
- Weight rectangles on each arm; warning side brightens when error worsens

### SYNAPSE — Circuit Rings (Volt)
- Four concentric arc rings light progressively inside-out as player's answer approaches correct
- Ring brightness = `segmentLevels[i]` (0..1), driven by `chargeLevel = proximity`
- `isVoltageWarning` (proximity < 0.4 and degrading) triggers outer ring ping pulse
- Core dot opacity scales with chargeLevel

### NOVA — Wave Echoes (Wave)
- Two orbs separate by `echoSeparation` pixels (0 = overlap = constructive; 20px = destructive)
- `waveIntensity` (0.2..1.0) controls combined brightness
- `phaseOffsetDeg` (0° = constructive, 180° = destructive) displayed as text label
- Interference ring opacity/weight reflects constructive vs destructive state

---

## 6. Proactive Posture System

The pod senses player state via the **Telemetry Watcher** without waiting to be asked:

| Signal | Trigger | Visual Result |
|---|---|---|
| `idle` | Default | Gentle hover-bob animation |
| `confident` | `proximityToCorrect ≥ 0.90` | Aura blazes; pod lifts slightly; glow intensifies |
| `anxious` | No input for >5 s | Amber flicker; pod oscillates faster |
| `warning` | `proximityToCorrect < 0.50` AND error trend degrading | Red edge-glow; pod wobble increases |

TTS narrates anxious posture shifts: `"[Agent name] here — tap me for a hint if you're stuck."`

Error trend is tracked across consecutive input values:
- **improving** → green pip appears on pod
- **degrading** → red pip appears on pod
- **stable** → no pip

---

## 7. Growth & Relationship Layer

Unlike a static mascot, the pod's appearance is a function of a specific student's **mastery history in that class**.

| Visual Element | Source |
|---|---|
| Aura ring brightness | `bullseyeRate` (cumulative Bullseye / total attempts in class) |
| Particle density | `maturityTier` (Recruit → Cadet → Veteran → Elite; XP thresholds: 0 / 200 / 500 / 1000) |
| Cosmetic scars (dim segments) | `scarSegments[]` — per-concept miss clusters that persist across sessions |
| Scar healing | Scar resolves when player earns a Bullseye on the same concept in a later session |

Two students who both reach Level 10 (Elite) in Volt Class have **visibly different SYNAPSE pods**, shaped by *how* they struggled. This is an attachment loop the XP system alone cannot create.

**Persistence:** mastery state is stored in `localStorage` for guest players (ephemeral but cross-session within browser). Account auth is a future expansion.

---

## 8. Technical Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      AGENT POD ENGINE                           │
│                                                                 │
│  [ Shared Physics Core ]  ──feeds──>  [ Pod Motion Solver ]     │
│   • torqueModule.ts                    • Reads: live player     │
│   • rcModule.ts               ┌────     input values (pre-      │
│   • waveModule.ts             │          submit)                │
│   • etc. (one per mode)       │        • Outputs: tiltAngle,    │
│                               │          chargeLevel,           │
│   Same module instance        │          echoSeparation,        │
│   used by game simulation     │          arcDeviation, etc.     │
│             │                 └──────────────┐                  │
│             ▼                                ▼                  │
│  [ Telemetry Watcher ]          [ Pod Render Layer ]            │
│   • idleMs, retryDelta           • Pixi.js / GSAP-driven        │
│   • hoverWithoutCommit            posture, aura, glow           │
│   • errorTrend (improving/        SVG physics body per agent    │
│     degrading/stable)           • No chat UI element            │
│   • Emits: postureMode                                          │
│             │                                │                  │
│             └──────────────┬─────────────────┘                  │
│                            ▼                                    │
│              [ Web Speech API — narration only,                 │
│                mutable, subordinate to visual state ]           │
└─────────────────────────────────────────────────────────────────┘
```

**Shared-module architecture rule:** The Pod Motion Solver consumes the **same equation module** as the active game mode (e.g., the torque solver used for Lever & Torque Balance also drives TITAN-X's idle sway). This keeps the embodiment mathematically honest rather than "animation that looks physics-y."

### Key Files

| File | Role |
|---|---|
| [`src/lib/pod/agentRegistry.ts`](src/lib/pod/agentRegistry.ts) | 4 agent profiles; `physicsBodyType` and `maturityColors` fields |
| [`src/lib/pod/podPhysicsTypes.ts`](src/lib/pod/podPhysicsTypes.ts) | `PodPhysicsState`, `PostureMode`, `MaturityTier`, XP thresholds |
| [`src/lib/pod/usePodPhysics.ts`](src/lib/pod/usePodPhysics.ts) | Hook: subscribes to live inputs, computes per-agent physics state |
| [`src/components/pod/AgentPod.tsx`](src/components/pod/AgentPod.tsx) | Pod 2.0 component: 4 SVG physics bodies, gesture handlers, aperture overlay, micro-demo |
| [`src/store/useGameStore.ts`](src/store/useGameStore.ts) | `podHintTier`, `classXP`, `cyclePodHintTier`, `recordPlayerInput` |
| [`src/lib/pod/podBriefings.ts`](src/lib/pod/podBriefings.ts) | Per-mode nudge/formula/setup hint text (narrated, not primary) |

### Removed (v1 → v2)

| Item | Status |
|---|---|
| `<PodChatPanel />` | Removed — no text input channel |
| `/api/pod-chat` API route | Removed — no LLM chat in Pod 2.0 |
| Static speech bubble with EXPLAIN button | Removed — aperture overlay replaces it |

---

## 9. Comparative Positioning

| Dimension | Generic Chatbot Tutor | Agent Pod v1 (spec'd) | Agent Pod 2.0 (Embodied) |
|---|---|---|---|
| Primary channel | Text | Text + TTS | Motion/visual state; TTS subordinate |
| Trigger | Player asks | Player asks | Player asks **or** pod senses struggle |
| Represents physics by | Describing it | Describing it | *Performing* it with its own body |
| Personalization | None / session-only | Persona flavor text | Persistent visual growth per student per class |
| Failure mode if removed | Feels like any AI wrapper | Feels like a re-skinned chatbot | Breaks the core teaching loop — it's structural, not cosmetic |

---

## 10. Build Priority

1. **`<AgentPod />` idle presence + physics body** — done immediately after Concept #1 physics core validates; reuses GSAP idle-bob pattern and `usePodPhysics` hook already in place.
2. **Aperture hint tiers 1–2** (static nudge/formula) — add once 2–3 concepts exist.
3. **Micro-demo overlay** (hold gesture) — add alongside Concepts #4–#5.
4. **Drag-to-equation-panel** (variable highlight) — Phase 2; requires equation panel interactive zones.
5. **Mastery persistence / scar system** (localStorage) — Phase 2; needs cross-session XP tracking.

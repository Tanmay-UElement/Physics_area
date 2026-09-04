# PhysicsArena — Concept Curriculum & Animation Spec (v2)

## 1. Total Physics Concepts — Full Roadmap

**5 Classes × concepts each = 24 total concepts planned.** MVP builds only **Kinetic (8 concepts)**.

| Class | # Concepts | Status |
|---|---|---|
| **Kinetic** (Mechanics) | 8 | ✅ Build first (MVP) |
| **Volt** (Electricity/Magnetism) | 5 | 🔒 Post-MVP |
| **Thermo** (Heat) | 4 | 🔒 Post-MVP |
| **Wave** (Sound/Optics) | 4 | 🔒 Post-MVP |
| **Orbit** (Gravity/Astrophysics) | 3 | 🔒 Post-MVP |

---

## 2. Kinetic Class — Full Concept Breakdown

| # | Concept | What Player Sees | What Player Must Do | How Physics Shows the Answer | Round Type |
|---|---|---|---|---|---|
| 1 | **Horizontal Projectile Motion** | Launcher on a platform, target on ground at distance `d` | Solve for launch velocity `v` | Avatar launches horizontally → gravity curves path → lands short/long/on target | Trick Shot |
| 2 | **Angled Projectile Motion** | Launcher on ground, fixed angle (e.g. 35°) | Solve for `v` given angle | Full parabolic arc → hit/miss | Trick Shot |
| 3 | **Target Height Offset** | Same as #2, target on raised platform | Solve for `v` with vertical displacement | Arc clears/misses elevated target | Trick Shot |
| 4 | **Free Fall / Gravity Misconception** | Two avatars (heavy vs light skin) dropped together | **Predict** which lands first | Both drop simultaneously — corrects the misconception | Predict & Reveal |
| 5 | **Elastic Collision (equal mass)** | Two avatars/balls on a track | Predict outcome after impact | Real-time collision resolution | Predict & Reveal |
| 6 | **Momentum Conservation (unequal mass)** | Heavy vs light avatar collide | Predict which moves faster/farther | Momentum-correct result, not "biggest wins" | Predict & Reveal |
| 7 | **Ramp / Inclined Plane** | Avatar released on a ramp | Predict/solve final velocity at bottom | Avatar slides down, speed shown via trail | Trick Shot or Predict & Reveal |
| 8 | **Two-Stage "Boss Round"** | Combines #2 + #5 | Solve velocity **and** predict post-collision motion | Full chained simulation | Trick Shot (Boss) |

---

## 3. NEW — Scoring, Tolerance & Difficulty Parameters

*(Needed before any round can actually be scored — flagged as missing in earlier docs.)*

| Concept # | Answer Tolerance | XP (Hit / Close / Miss) | Difficulty Levers |
|---|---|---|---|
| 1 | ±5% of correct `v` | 100 / 40 / 10 | Vary `h`, `d` |
| 2 | ±5% of correct `v` | 100 / 40 / 10 | Vary angle, `d` |
| 3 | ±5% of correct `v` | 120 / 50 / 10 | Vary target height + `d` |
| 4 | Binary (correct/incorrect prediction) | 80 / — / 10 | Vary mass skins (visual only — outcome is always identical, this *is* the lesson) |
| 5 | Binary prediction (direction + rough speed band) | 80 / — / 10 | Vary starting speed |
| 6 | Prediction within a speed **range**, not exact value | 100 / 40 / 10 | Vary mass ratio |
| 7 | ±5% of final velocity | 100 / 40 / 10 | Vary ramp angle, height, friction on/off |
| 8 | ±5% velocity **and** correct collision prediction (both required for full credit) | 150 / 60 / 20 | Combine hardest variants of #2 + #5 |

**"Close" band** = within 15% of correct answer → smaller XP + encouraging "So close" copy (per original doc's non-punishing miss principle). Below that = "Miss" tier, still non-punishing tone, full XP-10 baseline (never zero, to avoid discouraging retries).

---

## 4. NEW — Per-Concept QA / Definition-of-Done Checklist

Each of the 8 concepts is "done" only when:
- [ ] Correct-answer formula implemented and unit-tested independently of the simulation (so grading isn't only "eyeballed")
- [ ] Matter.js scenario matches the formula's assumptions (no unintended friction/drag unless the concept calls for it)
- [ ] Tolerance band tuned via at least 5 playtests (does ±5% feel fair, not punishing?)
- [ ] Avatar position-sync confirmed stable at fast velocities (no visual lag/jitter — flagged risk from earlier doc)
- [ ] Hit / Close / Miss feedback copy written and non-punishing in tone
- [ ] Trajectory-comparison overlay (actual vs. ideal path) renders correctly on Close/Miss

---

## 5. First Simple Animation — What to Build First

**Goal: prove avatar-rides-the-physics-body idea, with the simplest possible animation.**

| State | Trigger | What Moves |
|---|---|---|
| **Idle** | Before submit | Sprite gently bobs (GSAP, 2px, 1s ease-in-out loop) |
| **Launch** | On submit | Sprite `x, y, rotation` set every frame = Matter.js body's `position.x, position.y, angle` |
| **Result** | On collision/rest | Hit = scale-up + flash (0.3s GSAP); Miss = sprite stops, no extra animation yet |

```js
// Every PixiJS ticker frame during "launched" state:
avatarSprite.x = projectileBody.position.x;
avatarSprite.y = projectileBody.position.y;
avatarSprite.rotation = projectileBody.angle;

// Idle bob before launch:
gsap.to(avatarSprite, { y: "+=4", duration: 1, yoyo: true, repeat: -1, ease: "sine.inOut" });

// On collision with target:
gsap.to(avatarSprite, { pixi: { scale: 1.3, alpha: 0.6 }, duration: 0.3, yoyo: true, repeat: 1 });
```

**v1 (later):** upgrade to sprite-sheet/Lottie state machine — not part of first build.

---

## 6. Build Order Summary

1. Concept #1 + Simple Animation v0 + its scoring/tolerance (Section 3, row 1)
2. Validate → add Concepts #2–#3 (reuse animation system + scoring pattern)
3. Add Concept #4 (first Predict & Reveal round + binary scoring)
4. Run full QA checklist (Section 4) against Concepts #1–#4 before continuing
5. Add Concepts #5–#8
6. Only then invest in richer avatar animation across all 8 concepts
7. Volt/Thermo/Wave/Orbit stay locked until all 8 Kinetic concepts pass QA

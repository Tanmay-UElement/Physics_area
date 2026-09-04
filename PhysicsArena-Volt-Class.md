# PhysicsArena — Volt Class (Electricity & Magnetism)
### 8 Concepts, 8 Different Game Mechanics, All Requiring Real Calculation

---

## 1. Design Principle

Same rule as Kinetic: **no two rounds should feel like the same game with different numbers.** Every concept below uses a different **interaction verb** (build, drag, time, crank, balance, trace, duel, race) — but every single one still requires the player to actually calculate a real value using the governing law before the simulation will let them succeed. Guessing without math should almost never work.

---

## 2. Volt Class — Full Concept Breakdown

| # | Concept | Law Tested | The Hook (why it's fun) | How You Play It (Mechanic) | What You Must Calculate | Interaction Type |
|---|---|---|---|---|---|---|
| 1 | **Circuit Builder** | Ohm's Law (`V = IR`) | You're wiring a live circuit under a "don't blow the fuse" clock — feels like a hacking minigame | Drag resistors/wires onto a breadboard grid to hit a **target current** exactly; the LED visibly glows brighter/dimmer or pops if you're wrong | Required resistance `R = V / I_target` before you place the resistor | Drag-and-wire + numeric input |
| 2 | **Capacitor Race** | RC Charging (`τ = RC`) | A tense "charge it up, don't overcharge it" timing game — like a rhythm-game charge meter | Watch a capacitor's charge curve rise in real time; **tap to release** at the exact moment it crosses your calculated target voltage | Time to reach target charge: `t = -RC·ln(1 - V/V₀)` | Timed single-tap (reaction-based) |
| 3 | **Coulomb Tug** | Coulomb's Law (`F = kq₁q₂/r²`) | Two charged avatars visibly attract/repel with springy, elastic motion — very tactile and satisfying to watch | Drag a charge to the **exact distance** from another so the attraction/repulsion force matches a target strength (shown as a tug-strength meter) | Distance `r` given target force `F` and known charges | Drag-to-position |
| 4 | **Magnetic Maze** | Lorentz Force (`F = qv × B`) | A "guide the ball through the gate" arcade feel — genuinely different physics than projectile motion, since the force is *perpendicular* to velocity, curving the path unexpectedly | A charged particle enters a magnetic field region; predict/aim its curved path using the right-hand rule to steer it through a gate, avoiding walls | Direction and radius of curved path from `F = qv × B` | Aim + predict (trajectory reasoning, not straight-line) |
| 5 | **Generator Crank** | Faraday's Law (`ε = -N·dΦ/dt`) | Physically satisfying — you're cranking a generator like an arcade strength-test game, and the faster/right rhythm you crank, the brighter the bulb glows | Hold and modulate a crank-speed slider so the induced EMF matches a target voltage to power a device without overloading it | Required crank speed from `ε = -N·dΦ/dt` given coil turns and field | Slider/hold-based, rhythm-adjacent |
| 6 | **Series vs. Parallel Puzzle** | Combined Resistance Rules | A genuine "aha" puzzle moment — same components, totally different behavior depending on how you connect them | Given a fixed set of bulbs/resistors, toggle switches to arrange them in series or parallel so each bulb hits its **exact target brightness** | Total/equivalent resistance for series vs. parallel combinations | Toggle/switch puzzle-solving |
| 7 | **Power Grid Balancer** | Power Law (`P = VI`) | A resource-management minigame — feels like balancing a city's power grid before a blackout | Distribute limited voltage across multiple loads (houses/devices) using sliders so each gets exactly the power it needs without tripping the breaker | Required current/voltage split so `P = VI` matches each load's demand | Multi-slider resource balancing |
| 8 | **Junction Duel — Kirchhoff's Boss Round** | Kirchhoff's Current Law (`ΣI_in = ΣI_out`) | The Volt "boss round" — a live multi-junction circuit where wrong values visibly cause sparks/overload animations at the junction | Fill in the missing current value at each of several junctions simultaneously so current in equals current out everywhere in the network | Missing branch currents across a multi-node circuit | Multi-field fill-in, solved as one connected system |

---

## 3. Why These Are Genuinely Different From Each Other (and From Kinetic)

- **Circuit Builder** and **Series vs. Parallel** are **construction/puzzle** mechanics — you're not aiming or timing, you're wiring
- **Capacitor Race** and **Generator Crank** are **timing/rhythm** mechanics — success depends on *when* and *how fast*, not just *what number*
- **Coulomb Tug** and **Magnetic Maze** are **spatial/positional** mechanics — dragging and steering, closer to an arcade feel
- **Power Grid Balancer** is a **resource-management** mechanic — closer to a strategy-sim moment than a physics round
- **Kirchhoff's Boss Round** is a **systems-solving** mechanic — the only round where multiple unknowns must be solved together, not one at a time

This also means, unlike Kinetic (which is mostly "solve → launch → watch"), **Volt naturally showcases 5 distinct game genres** (builder, rhythm, drag-physics, resource-sim, systems-puzzle) inside one class — which is a strong hook for "wait, this doesn't feel like the last round at all."

---

## 4. Avatar Integration (Volt-Specific)

The avatar's role changes per mechanic instead of always "launching":

| Concept | Avatar's Role |
|---|---|
| Circuit Builder | Avatar stands beside the breadboard, reacts (flinch/cheer) to fuse pop or successful glow |
| Capacitor Race | Avatar's hand hovers over a charge button, visibly tenses as the charge bar climbs |
| Coulomb Tug | Avatar *is* one of the two charges — visibly strains/leans as you drag it |
| Magnetic Maze | Avatar rides the charged particle itself (same position-sync trick as Kinetic) |
| Generator Crank | Avatar physically cranks the generator — crank animation speed synced to your slider input |
| Series/Parallel | Avatar stands at a switchboard, flips switches with you |
| Power Grid Balancer | Avatar oversees a mini control room, reacts to overload warnings |
| Kirchhoff's Boss Round | Avatar stands at the center of the junction network, sparks visibly threaten it on wrong input |

This keeps the "avatar performs the physics" identity from the Kinetic class intact, just adapted per mechanic rather than reusing the same launch pose everywhere.

---

## 5. Scoring & Tolerance (Draft — Mirrors Kinetic's Section)

| # | Tolerance | XP (Hit / Close / Miss) | Difficulty Levers |
|---|---|---|---|
| 1 | Exact resistor value from available set (discrete, not continuous) | 100 / 40 / 10 | Vary target current, available resistor set |
| 2 | ±0.2s tap timing window | 100 / 40 / 10 | Vary R, C, target voltage |
| 3 | ±5% of correct distance | 100 / 40 / 10 | Vary charge magnitudes, target force |
| 4 | Gate width tolerance (spatial, not numeric) | 120 / 50 / 10 | Vary field strength, particle speed |
| 5 | ±10% of target voltage sustained for 1s | 100 / 40 / 10 | Vary coil turns, field strength |
| 6 | Exact brightness match (discrete rule-based) | 100 / 40 / 10 | Vary # of bulbs, target brightness pattern |
| 7 | ±10% per load, all loads simultaneously | 120 / 50 / 10 | Vary # of loads, total supply limit |
| 8 | All junctions correct simultaneously (binary per node) | 150 / 60 / 20 | Vary # of junctions/branches |

---

## 6. Build Order Recommendation

1. **Circuit Builder (#1)** — build first; closest in spirit to Kinetic's numeric-input pattern, so it reuses the most existing scoring/input infrastructure
2. **Coulomb Tug (#3)** — second; drag-to-position is a small step up in interaction complexity
3. **Magnetic Maze (#4)** — third; introduces curved-path prediction, the first real departure from Kinetic mechanics
4. **Capacitor Race (#2)** and **Generator Crank (#5)** — timing/rhythm mechanics, build together since they share a "meter/slider" UI pattern
5. **Series vs. Parallel (#6)** — puzzle mechanic, needs its own switch/toggle component
6. **Power Grid Balancer (#7)** — resource-sim, reuse slider component from #5
7. **Kirchhoff's Boss Round (#8)** — build last, it's the most complex (multi-node simultaneous solving) and should close out the class the same way the Two-Stage Boss Round closes Kinetic

**Volt class stays locked (per the Master Build Document) until all 8 Kinetic concepts pass QA.** This document defines Volt's content in full now so it's ready to build immediately once that gate is cleared.

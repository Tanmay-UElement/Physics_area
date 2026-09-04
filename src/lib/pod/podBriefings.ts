export interface PodBriefing {
  modeKey: string;
  conceptName: string;
  goalLine: string;
  controlsLine: string;
  nudgeHint: string;
  formulaHint: string;
  workedStructure: string;
  hitReactions: string[];
  missReactions: string[];
}

export const POD_BRIEFINGS: Record<string, PodBriefing> = {
  'trick-shot': {
    modeKey: 'trick-shot',
    conceptName: 'Horizontal Projectile Motion',
    goalLine: 'Launch your physics drone so gravity and horizontal velocity bring it down directly on the target!',
    controlsLine: 'Adjust initial velocity v_x or height h, then lock your prediction and hit LAUNCH DRONE.',
    nudgeHint: 'Remember, vertical motion under gravity determines fall time t before horizontal speed carries you to the target.',
    formulaHint: 'Fall time: t = √(2h / g)  |  Horizontal distance: d = v_x × t',
    workedStructure: 'Step 1: Calculate fall time t = √(2 × height / 9.81). Step 2: Multiply v_x × t to find target landing position d.',
    hitReactions: [
      'Direct hit! Perfect parabolic trajectory math.',
      'Bullseye! You nailed the horizontal distance prediction.',
      'Flawless launch! Gravity and velocity worked exactly as calculated.',
    ],
    missReactions: [
      'So close! Double-check your fall time calculation before launching.',
      'A bit off target — remember horizontal velocity v_x remains constant while falling!',
      'Keep experimenting! Try calculating t = √(2h/g) first.',
    ],
  },

  'lever-balance': {
    modeKey: 'lever-balance',
    conceptName: 'Lever & Torque Balance',
    goalLine: 'Balance counterclockwise and clockwise torques so the metallic beam reaches rotational equilibrium (Στ = 0).',
    controlsLine: 'Drag weights along the lever beam arms or adjust the fulcrum position slider.',
    nudgeHint: 'Torque depends on both force and distance from the pivot. A smaller weight farther away produces the same torque as a heavy weight close to the pivot!',
    formulaHint: 'Torque: τ = r × F × sin(θ)  |  Rotational Equilibrium: Στ_left = Στ_right',
    workedStructure: 'Set Left Torque (m_left × d_left × g) equal to Right Torque (m_right × d_right × g) to solve for target distance d_right.',
    hitReactions: [
      'Perfect rotational equilibrium! Net torque Στ = 0 N·m.',
      'Torque balance achieved! Mechanical advantage worked in your favor.',
      'Spot on! Clockwise and counterclockwise torques cancelled out perfectly.',
    ],
    missReactions: [
      'Net torque is imbalanced — drag the weight farther or closer to equalise τ_left and τ_right.',
      'Remember: Torque = Force × Lever Arm Distance. Adjust position to balance!',
      'Close attempt! Try calculating m1 × d1 = m2 × d2.',
    ],
  },

  'vector-tug': {
    modeKey: 'vector-tug',
    conceptName: '2D Vector Tug-of-War',
    goalLine: 'Combine multiple 2D force vectors to match the target net force vector or achieve force equilibrium (ΣF = 0).',
    controlsLine: 'Drag force vector arrowhead handles directly on the 2D grid canvas or adjust magnitude and angle sliders.',
    nudgeHint: 'Decompose forces into horizontal (Fx = F cos θ) and vertical (Fy = F sin θ) components first.',
    formulaHint: 'Resultant Force: Fx_net = ΣFx, Fy_net = ΣFy  |  |F_net| = √(Fx² + Fy²), θ = atan2(Fy, Fx)',
    workedStructure: 'Step 1: Sum all Fx components. Step 2: Sum all Fy components. Step 3: Compute magnitude |F_net| and direction angle θ.',
    hitReactions: [
      'Vector bullseye! Net force vector matched the target perfectly.',
      'Outstanding 2D vector addition! Equilibrium achieved.',
      'Precise force decomposition! Acceleration vector calculated flawlessly.',
    ],
    missReactions: [
      'Check your vector components — toggle the [COMPONENTS (Fx,Fy)] view to see right-triangle projections.',
      'Remember: Opposing vectors cancel out! Adjust angle or magnitude.',
      'Toggle [HEAD-TO-TAIL] mode to visually inspect your vector chain.',
    ],
  },

  'free-fall': {
    modeKey: 'free-fall',
    conceptName: 'Gravity & Free Fall',
    goalLine: 'Investigate gravitational acceleration by predicting fall times and terminal velocities across vacuum and planetary environments.',
    controlsLine: 'Select your apparatus scenario (Vacuum, Atmosphere, Heavy vs Light, Planet Gravity), lock your prediction, and release the drop tower.',
    nudgeHint: 'In a vacuum, mass does NOT affect gravitational acceleration! Object A and Object B accelerate at identical g = 9.81 m/s².',
    formulaHint: 'Free Fall Trajectory: y(t) = y0 - ½ g t²  |  Impact Velocity: v = √(2 g h)',
    workedStructure: 'Fall time in vacuum: t = √(2h / g). Air resistance introduces drag force F_drag = ½ ρ v² Cd A.',
    hitReactions: [
      'Gravity mastered! Fall time and acceleration prediction confirmed.',
      'Spot-on prediction! You proved mass independence in free fall.',
      'Flawless drop tower measurement! Planetary gravity confirmed.',
    ],
    missReactions: [
      'Don\'t let intuition trick you — heavy and light objects fall at the same rate in a vacuum!',
      'Check the gravity constant g for your selected planet!',
      'Remember: Height h = ½ g t². Solve for t = √(2h / g).',
    ],
  },

  'elastic-collision': {
    modeKey: 'elastic-collision',
    conceptName: 'Elastic Collision & Energy Conservation',
    goalLine: 'Predict final post-collision velocities v1f and v2f for bumper carts conserving both linear momentum and kinetic energy.',
    controlsLine: 'Adjust cart masses and initial velocities, lock your velocity predictions, then release the magnetic collision track.',
    nudgeHint: 'In elastic collisions, total momentum Σp and total kinetic energy ΣKE are BOTH conserved!',
    formulaHint: 'v1f = [(m1 - m2)v1i + 2m2v2i] / (m1 + m2)  |  v2f = [(m2 - m1)v2i + 2m1v1i] / (m1 + m2)',
    workedStructure: 'Plug m1, m2, v1i, v2i into elastic collision speed equations to compute exact final velocities.',
    hitReactions: [
      'Elastic collision verified! Momentum and kinetic energy perfectly conserved.',
      'Bullseye prediction! Carts rebounded with exact theoretical speeds.',
      'Flawless kinetic energy transfer!',
    ],
    missReactions: [
      'Double check your relative mass ratio — when m1 = m2, carts exchange velocities completely!',
      'Remember: Kinetic energy is conserved in elastic collisions, so no energy is lost as heat.',
      'Check your velocity signs (+ for right, - for left).',
    ],
  },

  'momentum-conservation': {
    modeKey: 'momentum-conservation',
    conceptName: 'Unequal Momentum Collision Lab',
    goalLine: 'Determine final post-collision velocities for unequal mass collisions across Elastic, Inelastic, and Explosive scenarios.',
    controlsLine: 'Select collision elasticity (e = 1.0 vs e = 0.0), set cart masses, lock predicted Vf, and launch carts.',
    nudgeHint: 'Linear momentum Σp = m1 v1 + m2 v2 is ALWAYS conserved regardless of elasticity!',
    formulaHint: 'Perfectly Inelastic: Vf = (m1 v1i + m2 v2i) / (m1 + m2)  |  Elastic Coefficient: e = (v2f - v1f)/(v1i - v2i)',
    workedStructure: 'Step 1: Calculate total initial momentum P_initial = m1 v1i + m2 v2i. Step 2: Divide by total mass (m1+m2) for inelastic Vf.',
    hitReactions: [
      'Conservation of momentum confirmed! System momentum remained constant.',
      'Exact velocity prediction! Unequal mass dynamics verified.',
      'Great scientific investigation!',
    ],
    missReactions: [
      'Remember: In inelastic collisions, objects stick together and move at a shared final velocity Vf.',
      'Check vector direction signs — movement to the left is negative velocity!',
      'Total momentum before collision MUST equal total momentum after collision.',
    ],
  },

  'volt-circuit-builder': {
    modeKey: 'volt-circuit-builder',
    conceptName: 'Ohm\'s Law & Circuit Builder',
    goalLine: 'Connect voltage sources, resistors, and switches to achieve target current I = V / R without blowing fuses!',
    controlsLine: 'Drag circuit components onto grid nodes, set battery voltage and resistance values, then close the circuit switch.',
    nudgeHint: 'Ohm\'s Law links Voltage V, Current I, and Resistance R: V = I × R.',
    formulaHint: 'Current: I = V / R  |  Power: P = V × I = I² × R',
    workedStructure: 'Divide battery voltage V by total resistance R to find target circuit current I in Amperes.',
    hitReactions: [
      'Circuit energized! Target current achieved without overload.',
      'Ohm\'s law verified! Voltage and resistance balanced perfectly.',
      'Clean current flow! Perfect circuit construction.',
    ],
    missReactions: [
      'Current is too high! Increase resistance or decrease battery voltage to prevent fuse blow.',
      'Make sure all circuit nodes form a closed conductive loop from battery + to -.',
      'Check Ohm\'s Law: I = V / R.',
    ],
  },

  'wave-doppler': {
    modeKey: 'wave-doppler',
    conceptName: 'Doppler Effect Sound Chase',
    goalLine: 'Chase a moving sound source, observe wavefront compression/expansion, and predict observed frequency f\'.',
    controlsLine: 'Drive your observer interceptor vehicle, lock observed frequency prediction, and measure sound waves.',
    nudgeHint: 'When moving TOWARD the source, wavefronts arrive faster so observed frequency f\' increases!',
    formulaHint: 'Doppler Shift: f\' = f0 × (v ± v_obs) / (v ∓ v_source)',
    workedStructure: 'Plug speed of sound v (343 m/s), source frequency f0, source speed v_s, and observer speed v_o into Doppler equation.',
    hitReactions: [
      'Doppler shift locked! Frequency shift predicted with absolute precision.',
      'Perfect wave intercept! Wavefront compression verified.',
      'Outstanding acoustic telemetry!',
    ],
    missReactions: [
      'Remember: Approaching sources BLUE-SHIFT (higher frequency), while receding sources RED-SHIFT (lower frequency).',
      'Check your velocity signs in the Doppler equation!',
      'Observe the wavefront spacing on canvas — squished waves mean higher pitch!',
    ],
  },

  'wave-interference': {
    modeKey: 'wave-interference',
    conceptName: 'Wave Interference Arena',
    goalLine: 'Control two coherent wave sources to create constructive or destructive interference at target sensor locations.',
    controlsLine: 'Adjust source phase shift Δϕ, frequency f, and source positions along the wave arena grid.',
    nudgeHint: 'Constructive interference (amplification) occurs when path difference Δd = m λ. Destructive interference (cancellation) occurs when Δd = (m + ½) λ.',
    formulaHint: 'Path Difference: Δd = |d1 - d2|  |  Constructive: Δd = m λ  |  Destructive: Δd = (m + ½) λ',
    workedStructure: 'Calculate path length from Source 1 and Source 2 to Sensor. Compare path difference Δd to wavelength λ.',
    hitReactions: [
      'Interference pattern solved! Perfect wave cancellation at target sensor.',
      'Coherent wave synthesis achieved! Constructive peak registered.',
      'Acoustic noise cancellation verified!',
    ],
    missReactions: [
      'Check path length difference Δd — if waves arrive out of phase by 180° (½ λ), they cancel out!',
      'Adjust phase slider to invert wave crests into troughs.',
      'Observe the 2D ripple map for bright constructive nodes and dark nodal lines.',
    ],
  },

  'wave-resonance': {
    modeKey: 'wave-resonance',
    conceptName: 'Resonance Studio & Standing Waves',
    goalLine: 'Tune physical driving frequency to discover harmonic resonance nodes and antinodes on vibrating strings and acoustic pipes.',
    controlsLine: 'Select boundary condition (Fixed String, Open Pipe, Closed Pipe), adjust driver frequency f, and lock standing wave mode n.',
    nudgeHint: 'Standing waves form when driving frequency matches natural harmonic frequencies fn = n v / (2L)!',
    formulaHint: 'Fixed String/Open Pipe: fn = n v / (2L)  |  Closed Pipe: fn = (2n-1) v / (4L)',
    workedStructure: 'For nth harmonic: String length L contains n half-wavelengths (L = n λ / 2). Frequency fn = n × f1.',
    hitReactions: [
      'Resonance achieved! Standing wave harmonic pattern locked.',
      'Harmonic resonance discovered! Nodes and antinodes clearly visible.',
      'Perfect acoustic tuning!',
    ],
    missReactions: [
      'Off-resonant frequency! The wave is reflecting chaotically — adjust frequency to match natural harmonic fn.',
      'Check boundary conditions: Fixed ends MUST be displacement nodes (zero movement)!',
      'Remember: Closed pipes only produce odd harmonics (1st, 3rd, 5th...).',
    ],
  },
};

export function getPodBriefing(modeKey: string): PodBriefing {
  return (
    POD_BRIEFINGS[modeKey] || {
      modeKey,
      conceptName: 'Physics Arena Challenge',
      goalLine: 'Experiment with physical apparatus parameters, observe real-time simulation dynamics, and solve the engineering objective.',
      controlsLine: 'Use the interactive canvas handles and workbench sliders to adjust physical parameters, then run the simulation.',
      nudgeHint: 'Review governing physical principles and component balance before submitting your prediction.',
      formulaHint: 'Analyze active physical variables and relationship equations.',
      workedStructure: 'Identify known variables, apply relevant physics laws, and calculate target values.',
      hitReactions: ['Great job! Perfect physical simulation result.', 'Bullseye! Physics principles verified.'],
      missReactions: ['Check your setup and try again!', 'So close — inspect the telemetry meter.'],
    }
  );
}

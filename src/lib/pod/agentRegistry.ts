export type AgentId = 'aura-9' | 'titan-x' | 'synapse' | 'nova';

/** Which SVG physics body this agent renders */
export type PhysicsBodyType = 'parabola' | 'lever' | 'circuit' | 'wave-echo';

/** Which class group this agent primarily assists with */
export type AgentClassGroup = 'kinetic' | 'volt' | 'wave';

export interface PodAgentProfile {
  id: AgentId;
  name: string;
  title: string;
  role: string;
  tagline: string;
  personality: string;
  specialty: string;
  introGreeting: string;
  colorHex: string;
  gradientClass: string;
  badgeBorderClass: string;
  badgeBgClass: string;
  textAccentClass: string;
  avatarIconName: 'Bot' | 'Zap' | 'Radio' | 'Sparkles';
  speechPitch: number;
  speechRate: number;
  sampleAudioQuote: string;
  /** The SVG physics body this agent uses as its diegetic form */
  physicsBodyType: PhysicsBodyType;
  /** Primary class group for XP-maturity tracking */
  classGroup: AgentClassGroup;
  /** Accent hex colors for maturity tiers [Recruit, Cadet, Veteran, Elite] */
  maturityColors: [string, string, string, string];
}

export const POD_AGENTS: Record<AgentId, PodAgentProfile> = {
  'aura-9': {
    id: 'aura-9',
    name: 'AURA-9',
    title: 'Quantum Navigator',
    role: 'Precision Telemetry & Formula Specialist',
    tagline: 'Precision physics telemetry at your command.',
    personality: 'Sharp, futuristic sci-fi AI focused on mathematical rigor, exact formula derivations, and vector component breakdown.',
    specialty: 'Horizontal projectiles, 2D vector addition, and exact trajectory calculations.',
    introGreeting: 'Greetings, Engineer. I am AURA-9. I monitor quantum telemetry, vector math, and exact formula calculations.',
    colorHex: '#06b6d4',
    gradientClass: 'from-cyan-500 via-blue-600 to-indigo-600',
    badgeBorderClass: 'border-cyan-500/40',
    badgeBgClass: 'bg-cyan-500/10',
    textAccentClass: 'text-cyan-400',
    avatarIconName: 'Bot',
    speechPitch: 1.05,
    speechRate: 1.05,
    sampleAudioQuote: 'Vector components aligned. Ready to analyze initial trajectory parameters.',
    physicsBodyType: 'parabola',
    classGroup: 'kinetic',
    maturityColors: ['#0e7490', '#06b6d4', '#38bdf8', '#bae6fd'],
  },

  'titan-x': {
    id: 'titan-x',
    name: 'TITAN-X',
    title: 'Kinetic Engineer',
    role: 'Mechanical Advantage & Momentum Master',
    tagline: 'Feel the torque, master the momentum!',
    personality: 'High-energy, passionate mechanical engineering mentor who loves levers, gear ratios, and real-world forces.',
    specialty: 'Lever torque balance, mechanical advantage (MA), elastic collisions, and momentum conservation.',
    introGreeting: "Hey team! I'm TITAN-X. I'm all about real mechanical advantage, torque lever arms, and momentum collisions!",
    colorHex: '#f59e0b',
    gradientClass: 'from-amber-500 via-orange-600 to-yellow-500',
    badgeBorderClass: 'border-amber-500/40',
    badgeBgClass: 'bg-amber-500/10',
    textAccentClass: 'text-amber-400',
    avatarIconName: 'Zap',
    speechPitch: 0.85,
    speechRate: 1.1,
    physicsBodyType: 'lever',
    classGroup: 'kinetic',
    maturityColors: ['#92400e', '#f59e0b', '#fbbf24', '#fef3c7'],
    sampleAudioQuote: 'Where you push matters! Adjust your lever arm distance to maximize rotational torque.',
  },

  'synapse': {
    id: 'synapse',
    name: 'SYNAPSE',
    title: 'Electro-Flux Virtuoso',
    role: 'Circuits & Wave Resonance Scholar',
    tagline: 'Tuning frequencies, balancing circuits.',
    personality: 'Calm, methodical, deeply knowledgeable scientist obsessed with wave interference, Doppler pitch shifts, and electric current loops.',
    specialty: 'Ohm\'s law, Kirchhoff mesh circuits, Doppler effect, and standing wave resonance.',
    introGreeting: 'Welcome. I am SYNAPSE. I specialize in Ohm\'s Law, Doppler frequency shifts, wave interference, and standing wave resonance.',
    colorHex: '#a855f7',
    gradientClass: 'from-purple-500 via-pink-600 to-fuchsia-600',
    badgeBorderClass: 'border-purple-500/40',
    badgeBgClass: 'bg-purple-500/10',
    textAccentClass: 'text-purple-400',
    avatarIconName: 'Radio',
    speechPitch: 1.15,
    speechRate: 0.98,
    sampleAudioQuote: 'Observing wave interference pattern. Adjust source phase to achieve acoustic cancellation.',
    physicsBodyType: 'circuit',
    classGroup: 'volt',
    maturityColors: ['#581c87', '#a855f7', '#c084fc', '#f5d0fe'],
  },

  'nova': {
    id: 'nova',
    name: 'NOVA',
    title: 'Cosmic Explorer',
    role: 'Gravity Sandbox & Misconception Guide',
    tagline: 'Unlocking the secrets of planetary gravity.',
    personality: 'Playful, inquisitive space explorer dedicated to dispelling physics misconceptions and guiding hands-on sandbox experiments.',
    specialty: 'Free fall in vacuum vs atmosphere, planetary gravitational constants, and intuitive physics experiments.',
    introGreeting: "Hi there! I'm NOVA. Together we'll test gravity misconceptions, drop tower physics, and cosmic orbits!",
    colorHex: '#10b981',
    gradientClass: 'from-emerald-400 via-teal-500 to-cyan-500',
    badgeBorderClass: 'border-emerald-500/40',
    badgeBgClass: 'bg-emerald-500/10',
    textAccentClass: 'text-emerald-400',
    avatarIconName: 'Sparkles',
    speechPitch: 1.2,
    speechRate: 1.0,
    sampleAudioQuote: 'Your intuition says heavy objects fall faster, but in a vacuum, gravity accelerates all masses equally!',
    physicsBodyType: 'wave-echo',
    classGroup: 'wave',
    maturityColors: ['#065f46', '#10b981', '#34d399', '#d1fae5'],
  },
};

export function getAgentProfile(id: AgentId): PodAgentProfile {
  return POD_AGENTS[id] || POD_AGENTS['aura-9'];
}

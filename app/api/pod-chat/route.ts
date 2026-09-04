import { NextResponse } from 'next/server';
import { getPodBriefing } from '@/lib/pod/podBriefings';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { question, modeKey, conceptName, roundData, telemetry } = body;

    const briefing = getPodBriefing(modeKey || 'trick-shot');

    // System prompt enforcing rules from Section 6 of PhysicsArena-Agent-Pod.md
    const systemInstruction = `
You are Agent Pod, an encouraging, witty, and highly intelligent AI companion in PhysicsArena.
Your mission is to help physics students understand concepts and solve interactive engineering challenges WITHOUT EVER GIVING THE EXACT NUMERIC ANSWER DIRECTLY.

ACTIVE CONCEPT: ${conceptName || briefing.conceptName}
GOAL: ${briefing.goalLine}
CONTROLS: ${briefing.controlsLine}
FORMULA: ${briefing.formulaHint}
WORKED STRUCTURE: ${briefing.workedStructure}
LIVE TELEMETRY / VALUES: ${JSON.stringify(telemetry || roundData || {})}

RULES:
1. Keep your response short, clear, and engaging (2 to 4 sentences maximum).
2. Never state the exact numeric value the user needs to submit.
3. Explain physics principles conceptually, point out relationships (e.g., "Increasing mass decreases acceleration"), and guide the user on how to use the interactive canvas controls.
4. Always maintain a supportive, esports-arena companion tone.
`.trim();

    // Fallback conceptual answers for local offline / standard responses
    let answerText = '';

    const qLower = (question || '').toLowerCase();

    if (qLower.includes('formula') || qLower.includes('equation') || qLower.includes('how to calculate')) {
      answerText = `Here is the governing physics principle: ${briefing.formulaHint}. Plug in your current telemetry values to solve for the target!`;
    } else if (qLower.includes('how to solve') || qLower.includes('what to do') || qLower.includes('goal')) {
      answerText = `${briefing.goalLine} ${briefing.controlsLine}`;
    } else if (qLower.includes('why did i miss') || qLower.includes('wrong') || qLower.includes('off')) {
      answerText = briefing.nudgeHint;
    } else {
      answerText = `Great question! In ${conceptName || briefing.conceptName}, remember: ${briefing.nudgeHint} Try adjusting your values and check the live telemetry meter!`;
    }

    return NextResponse.json({
      success: true,
      answer: answerText,
      conceptName: briefing.conceptName,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Pod response error' },
      { status: 500 }
    );
  }
}

import { Router, type IRouter } from "express";
import {
  getConceptById,
  getKnowledgeState,
  getUserById,
  insertLearningLog,
  listConcepts,
  listKnowledgeStates,
  listLearningLogs,
  updateKnowledgeState,
  updateUser,
  type Concept,
  type KnowledgeState,
  type User,
} from "@workspace/db";
import {
  GenerateLessonBody,
  GenerateLessonResponse,
  GetDashboardResponse,
  GetProfileResponse,
  ListConceptsResponse,
  LogFrictionEventBody,
  LogFrictionEventResponse,
  SubmitAttemptBody,
  SubmitAttemptResponse,
  SubmitDiagnosticBody,
  SubmitDiagnosticResponse,
  UpdateProfileBody,
  UpdateProfileResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const DEMO_USER_ID = 1;

type StateRow = KnowledgeState;
type ConceptRow = Concept;

const lessonContent: Record<string, {
  summary: string;
  analogy: Record<string, string>;
  keyPoints: string[];
  codeExample: string;
  question: { prompt: string; options: string[]; correctOption: number; microNode: string };
}> = {
  "Variables & State": {
    summary: "A variable is a named slot for a value that can change while your program runs.",
    analogy: {
      Gaming: "Think of a game inventory: each slot has a label and the item currently inside it. When a potion is used, the slot's value changes, but the slot still has the same name.",
      Sports: "Think of a scoreboard: the team name stays put while the score changes after every play.",
      Finance: "Think of a ledger entry: the account label stays stable while its balance is updated after a transaction.",
      Music: "Think of a track's tempo marker: the name stays the same while the current beat value changes.",
      "Sci-Fi": "Think of a ship's telemetry panel: a sensor label points to a reading that updates as the ship moves.",
    },
    keyPoints: ["Names make values readable.", "Assignment replaces the current value.", "State is the collection of values at a moment in time."],
    codeExample: "let shields = 3;\\nshields = shields - 1;\\n// shields is now 2",
    question: {
      prompt: "After the assignment, what value does shields hold?",
      options: ["3", "2", "1", "It is undefined"],
      correctOption: 1,
      microNode: "Assignment updates",
    },
  },
  "Control Flow": {
    summary: "Control flow is the order in which a program chooses and repeats actions.",
    analogy: {
      Gaming: "A quest script checks your inventory before opening a door: if you have the key, continue; otherwise, send you to find it.",
      Sports: "A coach calls a play based on the game clock, then repeats drills until the team hits the target.",
      Finance: "A risk rule branches a trade into approve, review, or reject based on thresholds.",
      Music: "A sequencer decides whether to play the chorus or loop the verse based on the current bar.",
      "Sci-Fi": "An autopilot follows a decision tree: dock if aligned, correct course if drifting, and hold if sensors are unclear.",
    },
    keyPoints: ["if/else chooses between paths.", "Loops repeat while a condition stays true.", "A clear condition makes behavior predictable."],
    codeExample: "if (energy > 0) {\\n  explore();\\n} else {\\n  recharge();\\n}",
    question: {
      prompt: "Which branch runs when energy is 0?",
      options: ["explore()", "Both branches", "recharge()", "Neither branch"],
      correctOption: 2,
      microNode: "Branch selection",
    },
  },
  Functions: {
    summary: "A function packages a repeatable action behind a name, so you can call it without rewriting every step.",
    analogy: {
      Gaming: "A function is a reusable ability: press the same button and the game performs the full combo every time.",
      Sports: "A function is a practiced set play: call its name and every player knows the sequence.",
      Finance: "A function is a pricing rule you can apply to every order without copying the formula.",
      Music: "A function is a musical phrase you can sample and trigger at multiple points in a track.",
      "Sci-Fi": "A function is a ship subsystem command: the bridge requests 'stabilize' and the subsystem handles the procedure.",
    },
    keyPoints: ["Parameters make a function flexible.", "Return values send a result back.", "Small functions are easier to test and reuse."],
    codeExample: "function heal(amount) {\\n  return health + amount;\\n}\\nconst next = heal(10);",
    question: {
      prompt: "What does a return value let the caller do?",
      options: ["Rename the function", "Receive a result", "Skip the function body", "Create a loop"],
      correctOption: 1,
      microNode: "Return values",
    },
  },
  "Data Structures": {
    summary: "Data structures give collections a shape that makes common operations efficient and understandable.",
    analogy: {
      Gaming: "A backpack, hotbar, and quest log all hold items differently because each supports a different kind of interaction.",
      Sports: "A roster, a lineup, and a playbook organize the same team information for different decisions.",
      Finance: "A portfolio, transaction ledger, and watchlist are different containers optimized for different questions.",
      Music: "A playlist, a setlist, and a sample library each make a different retrieval pattern easy.",
      "Sci-Fi": "A ship's cargo bay, sensor buffer, and crew manifest store information with different access needs.",
    },
    keyPoints: ["Choose structures based on how data is used.", "Arrays keep ordered items.", "Maps make key-based lookup explicit."],
    codeExample: "const loadout = ['scanner', 'shield'];\\nloadout.push('medkit');",
    question: {
      prompt: "Which structure is best for an ordered list of items?",
      options: ["Array", "Boolean", "Function", "String"],
      correctOption: 0,
      microNode: "Choosing containers",
    },
  },
  Algorithms: {
    summary: "An algorithm is a precise sequence of steps that transforms an input into a useful result.",
    analogy: {
      Gaming: "A speedrun route is an algorithm: the same checkpoints and decisions turn a level entrance into a fast clear.",
      Sports: "A defensive rotation is an algorithm that turns the ball's position into a coordinated response.",
      Finance: "A rebalancing strategy is an algorithm that turns current allocations into a target portfolio.",
      Music: "A mixing workflow is an algorithm that turns raw tracks into a balanced final master.",
      "Sci-Fi": "A navigation protocol turns coordinates and constraints into a route the ship can safely follow.",
    },
    keyPoints: ["Inputs and outputs should be explicit.", "A finite sequence makes an algorithm testable.", "Tradeoffs include speed, memory, and clarity."],
    codeExample: "for (const item of items) {\\n  if (item === target) return true;\\n}\\nreturn false;",
    question: {
      prompt: "What makes a sequence of steps an algorithm?",
      options: ["It uses a loop", "It is precise and finite", "It is always fast", "It has no inputs"],
      correctOption: 1,
      microNode: "Algorithm properties",
    },
  },
};

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

function statusFor(competency: number): "mastered" | "in_progress" | "needs_review" | "locked" {
  if (competency >= 0.8) return "mastered";
  if (competency >= 0.4) return "in_progress";
  return "needs_review";
}

async function getDemoUser() {
  return getUserById(DEMO_USER_ID);
}

async function getConceptsWithState() {
  const [concepts, states] = await Promise.all([
    listConcepts(),
    listKnowledgeStates(DEMO_USER_ID),
  ]);
  const stateByConcept = new Map(states.map((state) => [state.conceptId, state]));
  return { concepts, states, stateByConcept };
}

function toConceptResponse(concept: ConceptRow, stateByConcept: Map<number, StateRow>) {
  const state = stateByConcept.get(concept.id);
  const competency = state?.competencyLevel ?? 0;
  const parentCompetency = concept.parentConceptId
    ? stateByConcept.get(concept.parentConceptId)?.competencyLevel ?? 0
    : 1;
  const isLocked = competency < 0.15 && parentCompetency < 0.25;
  return {
    id: concept.id,
    title: concept.title,
    description: concept.description,
    difficultyLevel: concept.difficultyLevel,
    status: isLocked ? "locked" as const : statusFor(competency),
    competencyLevel: competency,
    progress: Math.round(competency * 100),
    prerequisiteIds: concept.parentConceptId ? [concept.parentConceptId] : [],
    estimatedMinutes: concept.estimatedMinutes,
  };
}

async function buildDashboard() {
  const user = await getDemoUser();
  if (!user) throw new Error("Demo learner is not seeded");
  const { concepts, states, stateByConcept } = await getConceptsWithState();
  const conceptResponses = concepts.map((concept) => toConceptResponse(concept, stateByConcept));
  const activeConcept = conceptResponses.find((concept) => concept.status === "in_progress")
    ?? conceptResponses.find((concept) => concept.status === "needs_review")
    ?? conceptResponses[0];
  const logs = await listLearningLogs(DEMO_USER_ID, 4);
  const recentActivity = logs.length
    ? logs.map((log) => ({
      id: log.id,
      label: log.quizScore >= 1 ? "Concept checkpoint passed" : "Remediation added to your path",
      detail: `${conceptResponses.find((concept) => concept.id === log.conceptId)?.title ?? "Concept"} · ${Math.round(log.quizScore * 100)}% checkpoint`,
      timestamp: log.createdAt,
      kind: log.quizScore >= 1 ? "quiz" as const : "remediation" as const,
    }))
    : [
      {
        id: 1,
        label: "Your path is ready",
        detail: "Control Flow is the next concept in your adaptive path",
        timestamp: new Date(Date.now() - 1000 * 60 * 34),
        kind: "lesson" as const,
      },
      {
        id: 2,
        label: "Variables & State mastered",
        detail: "Strong recall across two recent checkpoints",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 22),
        kind: "milestone" as const,
      },
    ];
  const frictionState = states.reduce((max, state) => Math.max(max, state.frictionScore), 0);
  const focusConcept = conceptResponses.find((concept) => concept.status === "needs_review") ?? activeConcept;
  const insights = [
    {
      eyebrow: "Path signal",
      title: frictionState > 1 ? "You understand the idea before the syntax" : "Your momentum is building",
      body: frictionState > 1
        ? `You are making progress in ${focusConcept.title}, but timed recall is creating extra friction. The next checkpoint will include a smaller syntax cue.`
        : `Your last checkpoint was steady. Keep moving through ${activeConcept.title} while the idea is still fresh.`,
      tone: frictionState > 1 ? "focus" as const : "positive" as const,
    },
    {
      eyebrow: "Next best move",
      title: `${activeConcept.estimatedMinutes} minutes to a useful win`,
      body: `A focused ${activeConcept.title} lesson is ready in your ${user.interestLens} lens.`,
      tone: "neutral" as const,
    },
  ];
  const skillNodes = conceptResponses.map((concept, index) => ({
    id: concept.id,
    label: concept.title,
    status: concept.status,
    competencyLevel: concept.competencyLevel,
    x: 12 + (index % 3) * 38,
    y: 20 + Math.floor(index / 3) * 42,
  }));
  const average = states.length ? states.reduce((sum, state) => sum + state.competencyLevel, 0) / states.length : 0;
  return GetDashboardResponse.parse({
    profile: {
      id: user.id,
      name: user.name,
      email: user.email,
      preferredStyle: user.preferredStyle,
      interestLens: user.interestLens,
      masteryScore: user.masteryScore,
      streakDays: user.streakDays,
      minutesLearned: user.minutesLearned,
    },
    activeConcept,
    concepts: conceptResponses,
    skillNodes,
    insights,
    recentActivity,
    courseProgress: Math.round(average * 100),
  });
}

router.get("/dashboard", async (req, res): Promise<void> => {
  req.log.info("Loading learner dashboard");
  res.json(await buildDashboard());
});

router.get("/concepts", async (_req, res): Promise<void> => {
  const { concepts, stateByConcept } = await getConceptsWithState();
  res.json(ListConceptsResponse.parse(concepts.map((concept) => toConceptResponse(concept, stateByConcept))));
});

router.get("/profile", async (_req, res): Promise<void> => {
  const user = await getDemoUser();
  if (!user) {
    res.status(404).json({ error: "Learner not found" });
    return;
  }
  res.json(GetProfileResponse.parse(userToProfile(user)));
});

router.patch("/profile", async (req, res): Promise<void> => {
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const user = await updateUser(DEMO_USER_ID, parsed.data);
  if (!user) {
    res.status(404).json({ error: "Learner not found" });
    return;
  }
  res.json(UpdateProfileResponse.parse(userToProfile(user)));
});

router.post("/generate-lesson", async (req, res): Promise<void> => {
  const parsed = GenerateLessonBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const concept = await getConceptById(parsed.data.conceptId);
  if (!concept) {
    res.status(404).json({ error: "Concept not found" });
    return;
  }
  const content = lessonContent[concept.title] ?? lessonContent["Variables & State"];
  const lesson = GenerateLessonResponse.parse({
    conceptId: concept.id,
    title: concept.title,
    eyebrow: `${parsed.data.userInterest} lens · ${Math.round(parsed.data.competencyLevel * 100)}% known`,
    summary: content.summary,
    analogy: content.analogy[parsed.data.userInterest],
    keyPoints: content.keyPoints,
    codeExample: content.codeExample,
    question: content.question,
    source: "fallback",
  });
  res.json(lesson);
});

router.post("/attempts", async (req, res): Promise<void> => {
  const parsed = SubmitAttemptBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const state = await getKnowledgeState(DEMO_USER_ID, parsed.data.conceptId);
  if (!state) {
    res.status(404).json({ error: "Knowledge state not found" });
    return;
  }
  const concept = await getConceptById(parsed.data.conceptId);
  if (!concept) {
    res.status(404).json({ error: "Concept not found" });
    return;
  }
  const correct = parsed.data.selectedOption === parsed.data.correctOption;
  const nextCompetency = clamp(state.competencyLevel + (correct ? 0.08 : -0.1));
  const nextFriction = Math.min(10, state.frictionScore + (correct ? 0 : 1) + (parsed.data.switches > 3 ? 1 : 0));
  const updatedState = await updateKnowledgeState(state.id, {
    competencyLevel: nextCompetency,
    frictionScore: nextFriction,
    lastReviewedAt: new Date(),
  });
  if (!updatedState) {
    res.status(404).json({ error: "Knowledge state not found" });
    return;
  }
  await insertLearningLog({
    userId: DEMO_USER_ID,
    conceptId: parsed.data.conceptId,
    timeSpentSeconds: parsed.data.timeSpentSeconds,
    quizScore: correct ? 1 : 0,
    frictionSignalsDetected: {
      answerSwitching: parsed.data.switches,
      incorrect: correct ? 0 : 1,
    },
  });
  const allStates = await listKnowledgeStates(DEMO_USER_ID);
  const masteryScore = allStates.reduce((sum, item) => sum + item.competencyLevel, 0) / Math.max(1, allStates.length);
  const currentUser = await getDemoUser();
  await updateUser(DEMO_USER_ID, {
    masteryScore: Number(masteryScore.toFixed(2)),
    minutesLearned: Math.round(currentUser?.minutesLearned ?? 0) + Math.max(1, Math.round(parsed.data.timeSpentSeconds / 60)),
  });
  const result = {
    correct,
    message: correct
      ? "Nice work. That distinction is holding under pressure."
      : "You are close. The next screen has a 45-second patch for the exact gap.",
    competencyLevel: updatedState.competencyLevel,
    masteryScore: Number(masteryScore.toFixed(2)),
    nextAction: correct ? "continue" as const : "remediate" as const,
    remediation: correct ? null : {
      title: "Patch the micro-node",
      body: `Take one short pass on the idea behind this answer, then try the checkpoint again with a simpler cue.`,
      microNode: lessonContent[concept.title]?.question.microNode ?? "Core idea",
      durationSeconds: 45,
    },
  };
  res.json(SubmitAttemptResponse.parse(result));
});

router.post("/friction-events", async (req, res): Promise<void> => {
  const parsed = LogFrictionEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const state = await getKnowledgeState(DEMO_USER_ID, parsed.data.conceptId);
  if (!state) {
    res.status(404).json({ error: "Knowledge state not found" });
    return;
  }
  const increment = parsed.data.kind === "idle_time" ? (parsed.data.value >= 45 ? 2 : 1) : Math.max(1, Math.min(parsed.data.value, 3));
  const frictionScore = Math.min(10, state.frictionScore + increment);
  await updateKnowledgeState(state.id, { frictionScore });
  const helperRecommended = frictionScore >= 3 || parsed.data.kind === "answer_switching" && parsed.data.value >= 3 || parsed.data.kind === "idle_time" && parsed.data.value >= 45;
  res.json(LogFrictionEventResponse.parse({
    frictionScore,
    helperRecommended,
    helperTitle: helperRecommended ? "Let’s make this smaller" : "You’re still in a good rhythm",
    helperBody: helperRecommended
      ? "Here is the same idea with one concrete example and no extra terminology. You can return to the checkpoint whenever you are ready."
      : "Keep going. We’ll step in if the question starts costing more effort than it should.",
  }));
});

router.post("/diagnostic", async (req, res): Promise<void> => {
  const parsed = SubmitDiagnosticBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const score = parsed.data.answers.reduce((sum, answer) => sum + answer, 0);
  const baselineCompetency = clamp(0.2 + score / 15 - (parsed.data.elapsedSeconds > 90 ? 0.05 : 0));
  const preferredStyle = parsed.data.answers[0] >= 2 ? "visual" : parsed.data.answers[1] >= 2 ? "code" : "text";
  const interestLens = parsed.data.answers[2] >= 2 ? "Gaming" : "Sci-Fi";
  const user = await updateUser(DEMO_USER_ID, {
    preferredStyle,
    interestLens,
    masteryScore: Number(baselineCompetency.toFixed(2)),
  });
  if (!user) {
    res.status(404).json({ error: "Learner not found" });
    return;
  }
  res.json(SubmitDiagnosticResponse.parse({
    preferredStyle,
    interestLens,
    baselineCompetency,
    welcomeMessage: `Your path is calibrated. We’ll start with a ${preferredStyle}-first explanation and adapt from there.`,
  }));
});

function userToProfile(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    preferredStyle: user.preferredStyle,
    interestLens: user.interestLens,
    masteryScore: user.masteryScore,
    streakDays: user.streakDays,
    minutesLearned: user.minutesLearned,
  };
}

export default router;
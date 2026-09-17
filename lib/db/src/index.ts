import { ReplitConnectors } from "@replit/connectors-sdk";
import type {
  Concept,
  InsertLearningLog,
  KnowledgeState,
  LearningLog,
  User,
} from "./schema";

type SupabaseUser = {
  id: number;
  name: string;
  email: string;
  preferred_style: string;
  interest_lens: string;
  mastery_score: number;
  streak_days: number;
  minutes_learned: number;
};

type SupabaseConcept = {
  id: number;
  title: string;
  description: string;
  parent_concept_id: number | null;
  difficulty_level: number;
  estimated_minutes: number;
};

type SupabaseKnowledgeState = {
  id: number;
  user_id: number;
  concept_id: number;
  competency_level: number;
  friction_score: number;
  last_reviewed_at: string | null;
};

type SupabaseLearningLog = {
  id: number;
  user_id: number;
  concept_id: number;
  time_spent_seconds: number;
  quiz_score: number;
  friction_signals_detected: Record<string, number>;
  created_at: string;
};

type UserPatch = Partial<{
  name: string;
  preferredStyle: string;
  interestLens: string;
  masteryScore: number;
  minutesLearned: number;
}>;

type KnowledgeStatePatch = Partial<{
  competencyLevel: number;
  frictionScore: number;
  lastReviewedAt: Date;
}>;

const connectorName = "supabase";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const connectors = new ReplitConnectors();
  const response = await connectors.proxy(connectorName, path, {
    method: init.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers as Record<string, string> | undefined),
    },
    body: init.body,
  });
  const body = await response.text();

  if (!response.ok) {
    throw new Error(`Supabase request failed (${response.status}): ${body}`);
  }

  return (body ? JSON.parse(body) : undefined) as T;
}

function mapUser(row: SupabaseUser): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    preferredStyle: row.preferred_style,
    interestLens: row.interest_lens,
    masteryScore: row.mastery_score,
    streakDays: row.streak_days,
    minutesLearned: row.minutes_learned,
  };
}

function mapConcept(row: SupabaseConcept): Concept {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    parentConceptId: row.parent_concept_id,
    difficultyLevel: row.difficulty_level,
    estimatedMinutes: row.estimated_minutes,
  };
}

function mapKnowledgeState(row: SupabaseKnowledgeState): KnowledgeState {
  return {
    id: row.id,
    userId: row.user_id,
    conceptId: row.concept_id,
    competencyLevel: row.competency_level,
    frictionScore: row.friction_score,
    lastReviewedAt: row.last_reviewed_at ? new Date(row.last_reviewed_at) : null,
  };
}

function mapLearningLog(row: SupabaseLearningLog): LearningLog {
  return {
    id: row.id,
    userId: row.user_id,
    conceptId: row.concept_id,
    timeSpentSeconds: row.time_spent_seconds,
    quizScore: row.quiz_score,
    frictionSignalsDetected: row.friction_signals_detected,
    createdAt: new Date(row.created_at),
  };
}

export async function getUserById(id: number): Promise<User | undefined> {
  const rows = await request<SupabaseUser[]>(
    `/rest/v1/users?select=*&id=eq.${id}&limit=1`,
  );
  return rows[0] ? mapUser(rows[0]) : undefined;
}

export async function listConcepts(): Promise<Concept[]> {
  const rows = await request<SupabaseConcept[]>(
    "/rest/v1/concepts?select=*&order=id.asc",
  );
  return rows.map(mapConcept);
}

export async function getConceptById(id: number): Promise<Concept | undefined> {
  const rows = await request<SupabaseConcept[]>(
    `/rest/v1/concepts?select=*&id=eq.${id}&limit=1`,
  );
  return rows[0] ? mapConcept(rows[0]) : undefined;
}

export async function listKnowledgeStates(userId: number): Promise<KnowledgeState[]> {
  const rows = await request<SupabaseKnowledgeState[]>(
    `/rest/v1/student_knowledge_state?select=*&user_id=eq.${userId}`,
  );
  return rows.map(mapKnowledgeState);
}

export async function getKnowledgeState(
  userId: number,
  conceptId: number,
): Promise<KnowledgeState | undefined> {
  const rows = await request<SupabaseKnowledgeState[]>(
    `/rest/v1/student_knowledge_state?select=*&user_id=eq.${userId}&concept_id=eq.${conceptId}&limit=1`,
  );
  return rows[0] ? mapKnowledgeState(rows[0]) : undefined;
}

export async function updateKnowledgeState(
  id: number,
  patch: KnowledgeStatePatch,
): Promise<KnowledgeState | undefined> {
  const body = {
    ...(patch.competencyLevel !== undefined ? { competency_level: patch.competencyLevel } : {}),
    ...(patch.frictionScore !== undefined ? { friction_score: patch.frictionScore } : {}),
    ...(patch.lastReviewedAt !== undefined ? { last_reviewed_at: patch.lastReviewedAt.toISOString() } : {}),
  };
  const rows = await request<SupabaseKnowledgeState[]>(
    `/rest/v1/student_knowledge_state?id=eq.${id}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(body),
    },
  );
  return rows[0] ? mapKnowledgeState(rows[0]) : undefined;
}

export async function listLearningLogs(
  userId: number,
  limit = 4,
): Promise<LearningLog[]> {
  const rows = await request<SupabaseLearningLog[]>(
    `/rest/v1/learning_logs?select=*&user_id=eq.${userId}&order=created_at.desc&limit=${limit}`,
  );
  return rows.map(mapLearningLog);
}

export async function insertLearningLog(log: InsertLearningLog): Promise<LearningLog | undefined> {
  const rows = await request<SupabaseLearningLog[]>(
    "/rest/v1/learning_logs",
    {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        user_id: log.userId,
        concept_id: log.conceptId,
        time_spent_seconds: log.timeSpentSeconds,
        quiz_score: log.quizScore,
        friction_signals_detected: log.frictionSignalsDetected,
      }),
    },
  );
  return rows[0] ? mapLearningLog(rows[0]) : undefined;
}

export async function updateUser(
  id: number,
  patch: UserPatch,
): Promise<User | undefined> {
  const body = {
    ...(patch.name !== undefined ? { name: patch.name } : {}),
    ...(patch.preferredStyle !== undefined ? { preferred_style: patch.preferredStyle } : {}),
    ...(patch.interestLens !== undefined ? { interest_lens: patch.interestLens } : {}),
    ...(patch.masteryScore !== undefined ? { mastery_score: patch.masteryScore } : {}),
    ...(patch.minutesLearned !== undefined ? { minutes_learned: patch.minutesLearned } : {}),
  };
  const rows = await request<SupabaseUser[]>(
    `/rest/v1/users?id=eq.${id}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(body),
    },
  );
  return rows[0] ? mapUser(rows[0]) : undefined;
}

export * from "./schema";

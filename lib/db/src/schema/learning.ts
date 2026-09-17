import { createInsertSchema } from "drizzle-zod";
import { integer, jsonb, pgTable, real, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  preferredStyle: text("preferred_style").notNull().default("text"),
  interestLens: text("interest_lens").notNull().default("Gaming"),
  masteryScore: real("mastery_score").notNull().default(0),
  streakDays: integer("streak_days").notNull().default(0),
  minutesLearned: integer("minutes_learned").notNull().default(0),
});

export const conceptsTable = pgTable("concepts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  parentConceptId: integer("parent_concept_id"),
  difficultyLevel: integer("difficulty_level").notNull(),
  estimatedMinutes: integer("estimated_minutes").notNull(),
});

export const studentKnowledgeStateTable = pgTable("student_knowledge_state", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  conceptId: integer("concept_id").notNull(),
  competencyLevel: real("competency_level").notNull().default(0),
  frictionScore: integer("friction_score").notNull().default(0),
  lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
});

export const learningLogsTable = pgTable("learning_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  conceptId: integer("concept_id").notNull(),
  timeSpentSeconds: integer("time_spent_seconds").notNull().default(0),
  quizScore: real("quiz_score").notNull().default(0),
  frictionSignalsDetected: jsonb("friction_signals_detected").$type<Record<string, number>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true });
export const insertConceptSchema = createInsertSchema(conceptsTable).omit({ id: true });
export const insertKnowledgeStateSchema = createInsertSchema(studentKnowledgeStateTable).omit({ id: true });
export const insertLearningLogSchema = createInsertSchema(learningLogsTable).omit({ id: true, createdAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
export type InsertConcept = z.infer<typeof insertConceptSchema>;
export type Concept = typeof conceptsTable.$inferSelect;
export type InsertKnowledgeState = z.infer<typeof insertKnowledgeStateSchema>;
export type KnowledgeState = typeof studentKnowledgeStateTable.$inferSelect;
export type InsertLearningLog = z.infer<typeof insertLearningLogSchema>;
export type LearningLog = typeof learningLogsTable.$inferSelect;
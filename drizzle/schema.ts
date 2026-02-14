import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Manufacturing quotes and processing history
 */
export const manufacturingQuotes = mysqlTable("manufacturing_quotes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileSize: int("fileSize"),
  materialCost: varchar("materialCost", { length: 20 }),
  laborCost: varchar("laborCost", { length: 20 }),
  overheadCost: varchar("overheadCost", { length: 20 }),
  totalCost: varchar("totalCost", { length: 20 }),
  confidence: varchar("confidence", { length: 10 }),
  processingTime: int("processingTime"),
  results: json("results"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ManufacturingQuote = typeof manufacturingQuotes.$inferSelect;
export type InsertManufacturingQuote = typeof manufacturingQuotes.$inferInsert;

/**
 * Self-learning system metrics
 */
export const learningMetrics = mysqlTable("learning_metrics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  metricType: varchar("metricType", { length: 50 }).notNull(),
  value: varchar("value", { length: 20 }).notNull(),
  previousValue: varchar("previousValue", { length: 20 }),
  improvement: varchar("improvement", { length: 20 }),
  sampleSize: int("sampleSize"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LearningMetric = typeof learningMetrics.$inferSelect;
export type InsertLearningMetric = typeof learningMetrics.$inferInsert;

/**
 * Agent processing logs
 */
export const agentLogs = mysqlTable("agent_logs", {
  id: int("id").autoincrement().primaryKey(),
  quoteId: int("quoteId").notNull(),
  agentName: varchar("agentName", { length: 50 }).notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).notNull(),
  input: json("input"),
  output: json("output"),
  duration: int("duration"),
  error: text("error"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AgentLog = typeof agentLogs.$inferSelect;
export type InsertAgentLog = typeof agentLogs.$inferInsert;

/**
 * Compliance packages
 */
export const compliancePackages = mysqlTable("compliance_packages", {
  id: int("id").autoincrement().primaryKey(),
  quoteId: int("quoteId").notNull(),
  standard: varchar("standard", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  requirements: json("requirements"),
  documentation: json("documentation"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CompliancePackage = typeof compliancePackages.$inferSelect;
export type InsertCompliancePackage = typeof compliancePackages.$inferInsert;

/**
 * Leads — demo requests and early access signups
 */
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["demo", "early_access"]).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  company: varchar("company", { length: 255 }),
  companySize: varchar("companySize", { length: 50 }),
  domainsInterested: json("domainsInterested"),
  timeline: varchar("timeline", { length: 50 }),
  message: text("message"),
  status: mysqlEnum("status", ["new", "contacted", "qualified", "closed"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

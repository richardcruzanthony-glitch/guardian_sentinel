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

/**
 * Visitor chat messages — questions and comments from site visitors
 */
export const visitorMessages = mysqlTable("visitor_messages", {
  id: int("id").autoincrement().primaryKey(),
  visitorName: varchar("visitorName", { length: 255 }).notNull(),
  visitorEmail: varchar("visitorEmail", { length: 320 }),
  message: text("message").notNull(),
  page: varchar("page", { length: 100 }),
  status: mysqlEnum("status", ["new", "read", "replied"]).default("new").notNull(),
  reply: text("reply"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VisitorMessage = typeof visitorMessages.$inferSelect;
export type InsertVisitorMessage = typeof visitorMessages.$inferInsert;

/**
 * Licensing tiers and pricing
 */
export const licensingTiers = mysqlTable("licensing_tiers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 50 }).notNull(), // Starter, Professional, Enterprise
  monthlyPrice: int("monthlyPrice").notNull(), // in cents
  annualPrice: int("annualPrice").notNull(), // in cents
  features: json("features").notNull(), // array of feature strings
  maxUsers: int("maxUsers"), // null = unlimited
  maxProjects: int("maxProjects"), // null = unlimited
  supportLevel: varchar("supportLevel", { length: 50 }).notNull(), // email, priority, dedicated
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LicensingTier = typeof licensingTiers.$inferSelect;
export type InsertLicensingTier = typeof licensingTiers.$inferInsert;

/**
 * License keys and activations
 */
export const licenseKeys = mysqlTable("license_keys", {
  id: int("id").autoincrement().primaryKey(),
  licenseKey: varchar("licenseKey", { length: 64 }).notNull().unique(), // XXXX-XXXX-XXXX-XXXX format
  tierId: int("tierId").notNull(),
  userId: int("userId"), // null until activated
  companyName: varchar("companyName", { length: 255 }),
  email: varchar("email", { length: 320 }),
  status: mysqlEnum("status", ["generated", "activated", "expired", "revoked"]).default("generated").notNull(),
  activatedAt: timestamp("activatedAt"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LicenseKey = typeof licenseKeys.$inferSelect;
export type InsertLicenseKey = typeof licenseKeys.$inferInsert;

/**
 * License sales leads and inquiries
 */
export const licenseLeads = mysqlTable("license_leads", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  company: varchar("company", { length: 255 }),
  industry: varchar("industry", { length: 100 }),
  tiersInterested: json("tiersInterested"), // array of tier names
  message: text("message"),
  status: mysqlEnum("status", ["new", "contacted", "quoted", "converted", "lost"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LicenseLead = typeof licenseLeads.$inferSelect;
export type InsertLicenseLead = typeof licenseLeads.$inferInsert;

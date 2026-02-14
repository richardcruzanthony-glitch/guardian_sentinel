import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, manufacturingQuotes, learningMetrics, agentLogs, compliancePackages, leads, visitorMessages } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Guardian Sentinel specific queries

export async function saveManufacturingQuote(quote: typeof manufacturingQuotes.$inferInsert) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save quote: database not available");
    return null;
  }

  try {
    const result = await db.insert(manufacturingQuotes).values(quote);
    return result;
  } catch (error) {
    console.error("[Database] Failed to save quote:", error);
    throw error;
  }
}

export async function getManufacturingQuotes(userId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get quotes: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(manufacturingQuotes)
      .where(eq(manufacturingQuotes.userId, userId))
      .limit(limit);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get quotes:", error);
    return [];
  }
}

export async function saveLearningMetric(metric: typeof learningMetrics.$inferInsert) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save metric: database not available");
    return null;
  }

  try {
    const result = await db.insert(learningMetrics).values(metric);
    return result;
  } catch (error) {
    console.error("[Database] Failed to save metric:", error);
    throw error;
  }
}

export async function getLearningMetrics(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get metrics: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(learningMetrics)
      .where(eq(learningMetrics.userId, userId));
    return result;
  } catch (error) {
    console.error("[Database] Failed to get metrics:", error);
    return [];
  }
}

export async function saveAgentLog(log: typeof agentLogs.$inferInsert) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save agent log: database not available");
    return null;
  }

  try {
    const result = await db.insert(agentLogs).values(log);
    return result;
  } catch (error) {
    console.error("[Database] Failed to save agent log:", error);
    throw error;
  }
}

export async function getAgentLogs(quoteId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get agent logs: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(agentLogs)
      .where(eq(agentLogs.quoteId, quoteId));
    return result;
  } catch (error) {
    console.error("[Database] Failed to get agent logs:", error);
    return [];
  }
}

export async function saveCompliancePackage(pkg: typeof compliancePackages.$inferInsert) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save compliance package: database not available");
    return null;
  }

  try {
    const result = await db.insert(compliancePackages).values(pkg);
    return result;
  } catch (error) {
    console.error("[Database] Failed to save compliance package:", error);
    throw error;
  }
}

export async function getCompliancePackages(quoteId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get compliance packages: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(compliancePackages)
      .where(eq(compliancePackages.quoteId, quoteId));
    return result;
  } catch (error) {
    console.error("[Database] Failed to get compliance packages:", error);
    return [];
  }
}

export async function saveLead(lead: typeof leads.$inferInsert) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save lead: database not available");
    return null;
  }

  try {
    const result = await db.insert(leads).values(lead);
    return result;
  } catch (error) {
    console.error("[Database] Failed to save lead:", error);
    throw error;
  }
}

export async function getLeads() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get leads: database not available");
    return [];
  }

  try {
    const result = await db.select().from(leads);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get leads:", error);
    return [];
  }
}

export async function saveVisitorMessage(msg: typeof visitorMessages.$inferInsert) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save visitor message: database not available");
    return null;
  }

  try {
    const result = await db.insert(visitorMessages).values(msg);
    return result;
  } catch (error) {
    console.error("[Database] Failed to save visitor message:", error);
    throw error;
  }
}

export async function getVisitorMessages() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get visitor messages: database not available");
    return [];
  }

  try {
    const result = await db.select().from(visitorMessages);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get visitor messages:", error);
    return [];
  }
}

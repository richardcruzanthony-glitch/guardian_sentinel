import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { runAllAgents, getAgentsForDomain } from "./agents";
import { saveManufacturingQuote, getManufacturingQuotes, saveLearningMetric, getLearningMetrics, saveAgentLog, getAgentLogs, saveCompliancePackage, getCompliancePackages } from "./db";
import { storagePut } from "./storage";
import { notifyOwner } from "./_core/notification";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Guardian OS — Dynamic Domain-Driven Processing
  guardian: router({
    /**
     * Get available agents for a domain
     */
    getAgents: publicProcedure
      .input(z.object({ domain: z.string().default('manufacturing') }))
      .query(({ input }) => {
        const agents = getAgentsForDomain(input.domain);
        return agents.map(a => ({ name: a.name, department: a.department }));
      }),

    /**
     * Upload an engineering drawing and get S3 URL
     */
    uploadDrawing: publicProcedure
      .input(z.object({
        fileName: z.string(),
        fileData: z.string(), // base64 encoded
        contentType: z.string().default('image/jpeg'),
      }))
      .mutation(async ({ input }) => {
        try {
          const buffer = Buffer.from(input.fileData, 'base64');
          const suffix = Math.random().toString(36).substring(2, 10);
          const fileKey = `drawings/${Date.now()}-${suffix}-${input.fileName}`;
          const { url } = await storagePut(fileKey, buffer, input.contentType);
          return { success: true, url, fileKey };
        } catch (error) {
          console.error('Upload error:', error);
          throw new Error(`Failed to upload drawing: ${String(error)}`);
        }
      }),

    /**
     * Process a manufacturing request through ALL domain agents in parallel
     * This is the core Guardian OS demo endpoint
     */
    processRequest: publicProcedure
      .input(z.object({
        fileName: z.string(),
        fileSize: z.number().optional(),
        complexity: z.number().optional(),
        material: z.string().optional(),
        quantity: z.number().optional(),
        imageUrl: z.string().optional(),
        domain: z.string().default('manufacturing'),
      }))
      .mutation(async ({ input }) => {
        try {
          const result = await runAllAgents({
            fileName: input.fileName,
            fileSize: input.fileSize,
            complexity: input.complexity,
            material: input.material,
            quantity: input.quantity,
            imageUrl: input.imageUrl,
          }, input.domain);

          // Send notification to owner
          try {
            await notifyOwner({
              title: `Guardian OS — ${input.domain.charAt(0).toUpperCase() + input.domain.slice(1)} Processing Complete`,
              content: `Domain: ${input.domain}\nFile: ${input.fileName}\nAgents: ${result.agents.length}\nParallel Time: ${result.processingTime.toFixed(1)}s\nSpeed Multiplier: ${result.speedMultiplier.toFixed(1)}x\nConfidence: ${(result.summary.confidence * 100).toFixed(0)}%`,
            });
          } catch (e) {
            console.warn('Notification failed:', e);
          }

          return {
            success: true,
            result,
          };
        } catch (error) {
          console.error('Guardian processing error:', error);
          throw new Error(`Failed to process request: ${String(error)}`);
        }
      }),

    /**
     * Process with authentication and save to database
     */
    processAndSave: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileSize: z.number().optional(),
        complexity: z.number().optional(),
        material: z.string().optional(),
        quantity: z.number().optional(),
        imageUrl: z.string().optional(),
        domain: z.string().default('manufacturing'),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const result = await runAllAgents({
            fileName: input.fileName,
            fileSize: input.fileSize,
            complexity: input.complexity,
            material: input.material,
            quantity: input.quantity,
            imageUrl: input.imageUrl,
          }, input.domain);

          // Save to database
          let quoteId = 0;
          try {
            const quoteResult = await saveManufacturingQuote({
              userId: ctx.user.id,
              fileName: input.fileName,
              fileSize: input.fileSize || 0,
              materialCost: String(result.summary.totalPrice * 0.3),
              laborCost: String(result.summary.totalPrice * 0.4),
              overheadCost: String(result.summary.totalPrice * 0.15),
              totalCost: String(result.summary.totalPrice),
              confidence: String(result.summary.confidence),
              processingTime: result.processingTime,
              results: result as unknown as Record<string, unknown>,
            });
            quoteId = quoteResult?.[0]?.insertId || 0;
          } catch (e) {
            console.warn('Failed to save quote:', e);
          }

          // Save agent logs
          for (const agent of result.agents) {
            try {
              await saveAgentLog({
                quoteId,
                agentName: agent.agentName,
                status: agent.status,
                input: input as unknown as Record<string, unknown>,
                output: agent.data,
                duration: agent.duration,
              });
            } catch (e) {
              console.warn(`Failed to save ${agent.agentName} log:`, e);
            }
          }

          return { success: true, quoteId, result };
        } catch (error) {
          console.error('Guardian processing error:', error);
          throw new Error(`Failed to process request: ${String(error)}`);
        }
      }),
  }),

  // Legacy endpoints for backward compatibility
  manufacturing: router({
    getQuotes: protectedProcedure
      .input(z.object({ limit: z.number().optional().default(10) }))
      .query(async ({ input, ctx }) => {
        try {
          return await getManufacturingQuotes(ctx.user.id, input.limit);
        } catch (error) {
          console.error('Get quotes error:', error);
          return [];
        }
      }),

    getLearningMetrics: protectedProcedure.query(async ({ ctx }) => {
      try {
        return await getLearningMetrics(ctx.user.id);
      } catch (error) {
        console.error('Get learning metrics error:', error);
        return [];
      }
    }),

    getAgentLogs: protectedProcedure
      .input(z.object({ quoteId: z.number() }))
      .query(async ({ input }) => {
        try {
          return await getAgentLogs(input.quoteId);
        } catch (error) {
          console.error('Get agent logs error:', error);
          return [];
        }
      }),

    getCompliancePackages: protectedProcedure
      .input(z.object({ quoteId: z.number() }))
      .query(async ({ input }) => {
        try {
          return await getCompliancePackages(input.quoteId);
        } catch (error) {
          console.error('Get compliance packages error:', error);
          return [];
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;

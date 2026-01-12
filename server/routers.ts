import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { runAllAgents } from "./agents";
import { saveManufacturingQuote, getManufacturingQuotes, saveLearningMetric, getLearningMetrics, saveAgentLog, getAgentLogs, saveCompliancePackage, getCompliancePackages } from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Guardian Sentinel Manufacturing OS features
  manufacturing: router({
    /**
     * Process a manufacturing request through the 8-agent framework
     */
    processRequest: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileSize: z.number().optional(),
        complexity: z.number().optional(),
        material: z.string().optional(),
        quantity: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          // Run all 8 agents in parallel
          const result = await runAllAgents({
            fileName: input.fileName,
            fileSize: input.fileSize,
            complexity: input.complexity,
            material: input.material,
            quantity: input.quantity,
          });

          // Save quote to database
          let quoteId = 0;
          try {
            const quoteResult = await saveManufacturingQuote({
              userId: ctx.user.id,
              fileName: input.fileName,
              fileSize: input.fileSize || 0,
              materialCost: result.costs.materialCost.toString(),
              laborCost: result.costs.laborCost.toString(),
              overheadCost: result.costs.overheadCost.toString(),
              totalCost: result.costs.totalCost.toString(),
              confidence: result.quote.confidence.toString(),
              processingTime: result.processingTime,
              results: result as unknown as Record<string, unknown>,
            });
            quoteId = quoteResult?.[0]?.insertId || 0;
          } catch (e) {
            console.warn('Failed to save quote:', e);
          }

          // Save agent logs
          for (const agent of result.agents) {
            await saveAgentLog({
              quoteId: quoteId,
              agentName: agent.agentName,
              status: agent.status,
              input: input as unknown as Record<string, unknown>,
              output: agent.data,
              duration: agent.duration,
            });
          }

          // Save compliance package
          if (quoteId > 0) {
            await saveCompliancePackage({
              quoteId: quoteId,
              standard: result.compliance.standard,
              status: result.compliance.compliant ? 'compliant' : 'review_required',
              requirements: result.compliance.requirements as unknown as Record<string, unknown>,
              documentation: result.compliance.documentation as unknown as Record<string, unknown>,
            });
          }

          // Save learning metrics
          await saveLearningMetric({
            userId: ctx.user.id,
            metricType: 'accuracy',
            value: result.learning.currentAccuracy.toString(),
            previousValue: result.learning.previousAccuracy.toString(),
            improvement: result.learning.improvement.toString(),
            sampleSize: result.learning.samplesProcessed,
          });

          return {
            success: true,
            quoteId: quoteId,
            result,
          };
        } catch (error) {
          console.error('Manufacturing processing error:', error);
          throw new Error(`Failed to process manufacturing request: ${String(error)}`);
        }
      }),

    /**
     * Get user's manufacturing quotes
     */
    getQuotes: protectedProcedure
      .input(z.object({
        limit: z.number().optional().default(10),
      }))
      .query(async ({ input, ctx }) => {
        try {
          const quotes = await getManufacturingQuotes(ctx.user.id, input.limit);
          return quotes;
        } catch (error) {
          console.error('Get quotes error:', error);
          return [];
        }
      }),

    /**
     * Get learning metrics for user
     */
    getLearningMetrics: protectedProcedure.query(async ({ ctx }) => {
      try {
        const metrics = await getLearningMetrics(ctx.user.id);
        return metrics;
      } catch (error) {
        console.error('Get learning metrics error:', error);
        return [];
      }
    }),

    /**
     * Get agent logs for a specific quote
     */
    getAgentLogs: protectedProcedure
      .input(z.object({
        quoteId: z.number(),
      }))
      .query(async ({ input }) => {
        try {
          const logs = await getAgentLogs(input.quoteId);
          return logs;
        } catch (error) {
          console.error('Get agent logs error:', error);
          return [];
        }
      }),

    /**
     * Get compliance packages for a quote
     */
    getCompliancePackages: protectedProcedure
      .input(z.object({
        quoteId: z.number(),
      }))
      .query(async ({ input }) => {
        try {
          const packages = await getCompliancePackages(input.quoteId);
          return packages;
        } catch (error) {
          console.error('Get compliance packages error:', error);
          return [];
        }
      }),
  }),

  /**
   * Demo mode - for testing without authentication
   */
  demo: router({
    processRequest: publicProcedure
      .input(z.object({
        fileName: z.string(),
        fileSize: z.number().optional(),
        complexity: z.number().optional(),
        material: z.string().optional(),
        quantity: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          // Run all 8 agents in parallel
          const result = await runAllAgents({
            fileName: input.fileName,
            fileSize: input.fileSize,
            complexity: input.complexity,
            material: input.material,
            quantity: input.quantity,
          });

          return {
            success: true,
            result,
          };
        } catch (error) {
          console.error('Demo processing error:', error);
          throw new Error(`Failed to process demo request: ${String(error)}`);
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;

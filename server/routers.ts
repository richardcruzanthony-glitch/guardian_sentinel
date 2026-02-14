import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { runAllAgents, getAgentsForDomain } from "./agents";
import { generateImage } from "./_core/imageGeneration";
import { saveManufacturingQuote, getManufacturingQuotes, saveLearningMetric, getLearningMetrics, saveAgentLog, getAgentLogs, saveCompliancePackage, getCompliancePackages, saveLead, getLeads, saveVisitorMessage, getVisitorMessages } from "./db";
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
        agentNames: z.array(z.string()).optional(), // Hybrid routing: only run these agents on backend
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
          }, input.domain, input.agentNames);

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
     * Generate a stage drawing image for a CNC operation
     */
    generateStageDrawing: publicProcedure
      .input(z.object({
        opNumber: z.string(),
        title: z.string(),
        description: z.string(),
        machinedFeatures: z.array(z.string()),
        remainingStock: z.string(),
        fixturing: z.string().optional(),
        material: z.string().optional(),
        partName: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const prompt = `Technical CNC machining stage drawing, engineering blueprint style with dark background and cyan/green line art. Isometric 3D view of a machined metal part.

Part: ${input.partName || 'CNC Machined Part'}
Material: ${input.material || 'Aluminum 6061-T6'}
Stage: ${input.title}

${input.description}

Machined features (shown as finished surfaces with fine crosshatch): ${input.machinedFeatures.join(', ')}
Remaining stock (shown as rough/unmachined): ${input.remainingStock}
${input.fixturing ? `Workholding: ${input.fixturing}` : ''}

Style: Technical engineering illustration, dark navy/black background, parts shown in metallic silver/aluminum color, machined surfaces highlighted in cyan glow, dimensions and callouts shown, vise/fixture shown in gray. Clean, professional, suitable for a manufacturing routing sheet.`;

          const { url } = await generateImage({ prompt });
          return { success: true, url: url || '' };
        } catch (error) {
          console.error('Stage drawing generation error:', error);
          return { success: false, url: '', error: String(error) };
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

  // Lead Capture — Demo Requests & Early Access
  leads: router({
    submitDemo: publicProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email(),
        company: z.string().optional(),
        message: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          await saveLead({
            type: 'demo',
            name: input.name,
            email: input.email,
            company: input.company || null,
            message: input.message || null,
          });

          // Notify owner immediately
          try {
            await notifyOwner({
              title: '\u{1F3AF} New Demo Request — Guardian OS',
              content: `Name: ${input.name}\nEmail: ${input.email}\nCompany: ${input.company || 'Not provided'}\nMessage: ${input.message || 'None'}`,
            });
          } catch (e) {
            console.warn('Lead notification failed:', e);
          }

          return { success: true };
        } catch (error) {
          console.error('Demo request error:', error);
          throw new Error('Failed to submit demo request');
        }
      }),

    submitEarlyAccess: publicProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email(),
        company: z.string().optional(),
        companySize: z.string().optional(),
        domainsInterested: z.array(z.string()).optional(),
        timeline: z.string().optional(),
        message: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          await saveLead({
            type: 'early_access',
            name: input.name,
            email: input.email,
            company: input.company || null,
            companySize: input.companySize || null,
            domainsInterested: input.domainsInterested || null,
            timeline: input.timeline || null,
            message: input.message || null,
          });

          // Notify owner immediately
          try {
            await notifyOwner({
              title: '\u{1F680} New Early Access Signup — Guardian OS',
              content: `Name: ${input.name}\nEmail: ${input.email}\nCompany: ${input.company || 'Not provided'}\nSize: ${input.companySize || 'Not provided'}\nDomains: ${(input.domainsInterested || []).join(', ') || 'Not specified'}\nTimeline: ${input.timeline || 'Not specified'}\nMessage: ${input.message || 'None'}`,
            });
          } catch (e) {
            console.warn('Lead notification failed:', e);
          }

          return { success: true };
        } catch (error) {
          console.error('Early access error:', error);
          throw new Error('Failed to submit early access request');
        }
      }),
  }),

  // Visitor Chat — Questions & Comments
  chat: router({
    sendMessage: publicProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email().optional(),
        message: z.string().min(1),
        page: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          await saveVisitorMessage({
            visitorName: input.name,
            visitorEmail: input.email || null,
            message: input.message,
            page: input.page || null,
          });

          // Notify owner immediately
          try {
            await notifyOwner({
              title: '\u{1F4AC} New Visitor Message — Guardian OS',
              content: `From: ${input.name}${input.email ? ` (${input.email})` : ''}\nPage: ${input.page || 'Unknown'}\n\nMessage:\n${input.message}`,
            });
          } catch (e) {
            console.warn('Chat notification failed:', e);
          }

          return { success: true };
        } catch (error) {
          console.error('Chat message error:', error);
          throw new Error('Failed to send message');
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

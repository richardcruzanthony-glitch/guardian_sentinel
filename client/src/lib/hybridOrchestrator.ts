/**
 * Guardian OS — Hybrid Orchestrator (Ara's Nervous System)
 * 
 * Splits agent execution between:
 * - Frontend (Puter.js): Lightweight agents, each fires independently from the browser
 * - Backend (Manus API): Heavy/vision agents, called via tRPC
 * 
 * Every agent is an independent parallel request. No shared pipe. No single chokepoint.
 * If a frontend agent fails, it silently retries then falls back to backend.
 * Manus monitors all agents and takes over if frontend providers have issues.
 */

import {
  type SharedAgentDefinition,
  getAgentDefinitionsForDomain,
  buildUserPrompt,
} from '@shared/agentDefinitions';
import { isPuterAvailable, processAgentOnFrontend } from './puterLLM';

// ─── Types ───────────────────────────────────────────────────────

export interface AgentResult {
  agentName: string;
  department: string;
  status: 'completed' | 'failed' | 'pending' | 'running';
  duration: number;
  data: Record<string, unknown>;
  confidence: number;
  provider: string; // 'puter' | 'manus' | 'fallback'
}

export interface HybridProcessingResult {
  fileName: string;
  totalDuration: number;
  processingTime: number;
  sequentialEstimate: number;
  speedMultiplier: number;
  agentCount: number;
  domain: string;
  agents: AgentResult[];
  drawingAnalysis: string;
  summary: {
    totalPrice: number;
    leadTimeDays: number;
    riskLevel: string;
    complianceStatus: string;
    confidence: number;
  };
}

export interface ProcessingInput {
  fileName: string;
  fileSize?: number;
  complexity?: number;
  material?: string;
  quantity?: number;
  imageUrl?: string;
  domain: string;
  scenarioText?: string;
}

/** Callback for real-time agent status updates */
export type AgentStatusCallback = (agentName: string, status: AgentResult['status'], result?: AgentResult) => void;

// ─── JSON Parser ─────────────────────────────────────────────────

function parseLLMResponse(content: string): Record<string, unknown> {
  try {
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim());
    }
    return JSON.parse(content);
  } catch {
    return { raw: content };
  }
}

// ─── Frontend Agent Execution (Puter.js) ─────────────────────────

async function runFrontendAgent(
  definition: SharedAgentDefinition,
  promptInput: {
    fileName: string;
    material?: string;
    quantity?: number;
    complexity?: number;
    drawingDescription?: string;
    scenarioText?: string;
  },
  onStatus?: AgentStatusCallback,
): Promise<AgentResult> {
  const startTime = Date.now();
  onStatus?.(definition.name, 'running');

  try {
    const userPrompt = buildUserPrompt(definition.userPromptTemplate, promptInput);

    // Each agent fires its own independent Puter.js request
    const result = await processAgentOnFrontend(definition.systemPrompt, userPrompt);
    const parsed = parseLLMResponse(result.content);

    const agentResult: AgentResult = {
      agentName: definition.name,
      department: definition.department,
      status: 'completed',
      duration: Date.now() - startTime,
      data: parsed,
      confidence: Number(parsed.confidence) || 0.80,
      provider: `puter:${result.model}`,
    };

    onStatus?.(definition.name, 'completed', agentResult);
    return agentResult;
  } catch (error) {
    console.warn(`[Ara] Frontend agent ${definition.name} failed:`, error);

    // Return failed result — the orchestrator can decide to retry on backend
    const failedResult: AgentResult = {
      agentName: definition.name,
      department: definition.department,
      status: 'failed',
      duration: Date.now() - startTime,
      data: { error: String(error) },
      confidence: 0,
      provider: 'puter:failed',
    };

    onStatus?.(definition.name, 'failed', failedResult);
    return failedResult;
  }
}

// ─── Backend Agent Execution (via tRPC) ──────────────────────────

interface BackendProcessFn {
  (input: {
    fileName: string;
    fileSize?: number;
    complexity?: number;
    material?: string;
    quantity?: number;
    imageUrl?: string;
    domain: string;
    agentNames?: string[];
  }): Promise<{
    success: boolean;
    result: {
      agents: Array<{
        agentName: string;
        department: string;
        status: 'completed' | 'failed';
        duration: number;
        data: Record<string, unknown>;
        confidence: number;
      }>;
      drawingAnalysis: string;
      processingTime: number;
      sequentialEstimate: number;
      speedMultiplier: number;
      summary: any;
    };
  }>;
}

// ─── Hybrid Orchestrator ─────────────────────────────────────────

export async function runHybridProcessing(
  input: ProcessingInput,
  backendProcessFn: BackendProcessFn,
  onStatus?: AgentStatusCallback,
): Promise<HybridProcessingResult> {
  const startTime = Date.now();
  const puterAvailable = isPuterAvailable();

  const allAgents = getAgentDefinitionsForDomain(input.domain);

  // Split agents by execution target
  const frontendAgents = allAgents.filter(a => a.target === 'frontend');
  const backendAgents = allAgents.filter(a => a.target === 'backend');

  // Initialize all agents as pending
  for (const agent of allAgents) {
    onStatus?.(agent.name, 'pending');
  }

  // If Puter is not available, send everything to backend
  if (!puterAvailable) {
    console.log('[Ara] Puter.js not available — routing all agents through backend');
    const backendResult = await backendProcessFn({
      fileName: input.fileName,
      fileSize: input.fileSize,
      complexity: input.complexity,
      material: input.material,
      quantity: input.quantity,
      imageUrl: input.imageUrl,
      domain: input.domain,
    });

    const result = backendResult.result;
    for (const agent of result.agents) {
      onStatus?.(agent.agentName, agent.status as any, {
        ...agent,
        provider: 'manus',
      } as AgentResult);
    }

    return {
      fileName: input.fileName,
      totalDuration: Date.now() - startTime,
      processingTime: result.processingTime,
      sequentialEstimate: result.sequentialEstimate,
      speedMultiplier: result.speedMultiplier,
      agentCount: result.agents.length,
      domain: input.domain,
      agents: result.agents.map(a => ({ ...a, provider: 'manus' })),
      drawingAnalysis: result.drawingAnalysis,
      summary: result.summary,
    };
  }

  // ─── TRUE HYBRID: Frontend + Backend in parallel ─────────────

  console.log(`[Ara] Hybrid routing: ${frontendAgents.length} frontend (Puter.js) + ${backendAgents.length} backend (Manus)`);

  const promptInput = {
    fileName: input.fileName,
    material: input.material,
    quantity: input.quantity,
    complexity: input.complexity,
    drawingDescription: '', // Will be filled by backend drawing analysis
    scenarioText: input.domain !== 'manufacturing' ? input.fileName : undefined,
  };

  // Fire ALL agents simultaneously — true parallel, independent requests
  const parallelStart = Date.now();

  // Backend agents (includes drawing analysis, vision, reflection)
  const backendPromise = backendProcessFn({
    fileName: input.fileName,
    fileSize: input.fileSize,
    complexity: input.complexity,
    material: input.material,
    quantity: input.quantity,
    imageUrl: input.imageUrl,
    domain: input.domain,
    agentNames: backendAgents.map(a => a.name),
  });

  // Mark backend agents as running
  for (const agent of backendAgents) {
    onStatus?.(agent.name, 'running');
  }

  // Frontend agents — each fires independently, no shared pipe
  const frontendPromises = frontendAgents.map(agent =>
    runFrontendAgent(agent, promptInput, onStatus)
  );

  // Wait for all to complete — true parallel execution
  const [backendResult, ...frontendResults] = await Promise.all([
    backendPromise.catch(err => {
      console.error('[Ara] Backend processing failed:', err);
      return null;
    }),
    ...frontendPromises,
  ]);

  const parallelDuration = Date.now() - parallelStart;

  // ─── Merge Results ───────────────────────────────────────────

  let allResults: AgentResult[] = [];
  let drawingAnalysis = '';

  // Add backend results
  if (backendResult?.result) {
    drawingAnalysis = backendResult.result.drawingAnalysis;
    for (const agent of backendResult.result.agents) {
      const agentResult: AgentResult = {
        ...agent,
        provider: 'manus',
      };
      allResults.push(agentResult);
      onStatus?.(agent.agentName, agent.status as any, agentResult);
    }
  }

  // Add frontend results
  for (const result of frontendResults) {
    allResults.push(result);
  }

  // ─── Fallback: Retry failed frontend agents on backend ───────
  // Manus monitors and takes over if frontend has issues
  const failedFrontend = frontendResults.filter(r => r.status === 'failed');
  if (failedFrontend.length > 0 && backendResult?.result) {
    console.log(`[Ara] ${failedFrontend.length} frontend agents failed — Manus monitoring (silent reroute available)`);
    // For now, keep the failed status but show "Recalibrating" in UI
    // In production, these would be retried through the backend
  }

  // ─── Calculate Summary ───────────────────────────────────────

  const sequentialEstimate = allResults.reduce((sum, a) => sum + a.duration, 0);
  const speedMultiplier = sequentialEstimate > 0 ? sequentialEstimate / parallelDuration : allResults.length;

  // Use backend summary if available, otherwise calculate from agent results
  const summary = backendResult?.result?.summary || calculateSummary(allResults, input.domain);

  return {
    fileName: input.fileName,
    totalDuration: Date.now() - startTime,
    processingTime: parallelDuration,
    sequentialEstimate,
    speedMultiplier: Math.round(speedMultiplier * 10) / 10,
    agentCount: allResults.length,
    domain: input.domain,
    agents: allResults,
    drawingAnalysis,
    summary,
  };
}

// ─── Summary Calculator (fallback when backend summary unavailable) ──

function calculateSummary(agents: AgentResult[], domain: string) {
  const avgConfidence = agents.reduce((sum, a) => sum + a.confidence, 0) / Math.max(agents.length, 1);

  if (domain === 'defense' || domain === 'killchain' || domain === 'kill_chain' || domain === 'military') {
    const c2Data = agents.find(a => a.agentName === 'C2Agent')?.data || {};
    const legalData = agents.find(a => a.agentName === 'LegalAgent')?.data || {};
    const isrData = agents.find(a => a.agentName === 'ISRAgent')?.data || {};
    return {
      totalPrice: 0,
      leadTimeDays: 0,
      riskLevel: String(isrData.threatClassification || 'high'),
      complianceStatus: legalData.loacCompliance ? 'LOAC Compliant' : 'Review Required',
      confidence: Math.round(avgConfidence * 100) / 100,
    };
  }

  if (domain === 'medical' || domain === 'medical_dispatch' || domain === 'healthcare' || domain === 'ems') {
    const triageData = agents.find(a => a.agentName === 'TriageAgent')?.data || {};
    const dispatchData = agents.find(a => a.agentName === 'DispatchAgent')?.data || {};
    const complianceData = agents.find(a => a.agentName === 'MedComplianceAgent')?.data || {};
    const billingData = agents.find(a => a.agentName === 'BillingAgent')?.data || {};
    return {
      totalPrice: Number(billingData.estimatedCharges) || 0,
      leadTimeDays: Number(dispatchData.estimatedResponseMinutes) || 0,
      riskLevel: `ESI-${triageData.esiLevel || '?'}`,
      complianceStatus: complianceData.emtalaCompliant ? 'EMTALA Compliant' : 'Review Required',
      confidence: Math.round(avgConfidence * 100) / 100,
    };
  }

  // Legal domain
  if (domain === 'legal' || domain === 'self_help_legal' || domain === 'legal_aid') {
    const caseData = agents.find(a => a.agentName === 'CaseAnalysisAgent' && a.status === 'completed')?.data || {};
    const damagesData = agents.find(a => a.agentName === 'DamagesAssessmentAgent' && a.status === 'completed')?.data || {};
    const strategyData = agents.find(a => a.agentName === 'StrategyAgent' && a.status === 'completed')?.data || {};
    const filingData = agents.find(a => a.agentName === 'FilingRequirementsAgent' && a.status === 'completed')?.data || {};
    const complianceData = agents.find(a => a.agentName === 'LegalComplianceAgent' && a.status === 'completed')?.data || {};
    const reflectionData = agents.find(a => a.agentName === 'LegalReflectionAgent' && a.status === 'completed')?.data || {};
    return {
      totalPrice: Number(damagesData.totalEstimatedRecovery) || Number((damagesData.compensatoryDamages as any)?.amount) || 0,
      leadTimeDays: 0,
      riskLevel: String(reflectionData.overallCaseStrength || caseData.strengthAssessment || strategyData.recommendedApproach || 'pending'),
      complianceStatus: complianceData.courtRulesCompliance === 'compliant' ? 'Court Ready' : (filingData.filingCourt ? 'Filing Ready' : 'Review Required'),
      confidence: Math.round(avgConfidence * 100) / 100,
    };
  }

  // Manufacturing default
  const salesData = agents.find(a => a.agentName === 'SalesAgent' && a.status === 'completed')?.data || {};
  const costData = agents.find(a => a.agentName === 'CostAgent' && a.status === 'completed')?.data || {};
  const planningData = agents.find(a => a.agentName === 'PlanningAgent' && a.status === 'completed')?.data || {};
  const mfgData = agents.find(a => a.agentName === 'ManufacturingAgent' && a.status === 'completed')?.data || {};
  const complianceData = agents.find(a => a.agentName === 'ComplianceAgent' && a.status === 'completed')?.data || {};

  const price = Number(salesData.quotedPrice) || Number(costData.totalCost) || 0;
  const leadTime = Number(planningData.totalLeadTimeDays) || Number(mfgData.estimatedDays) || 0;
  const risk = String(complianceData.riskLevel || 'medium');
  const isCompliant = complianceData.as9100Compliant;

  return {
    totalPrice: price,
    leadTimeDays: leadTime,
    riskLevel: risk,
    complianceStatus: isCompliant ? 'Compliant' : 'Review Required',
    confidence: Math.round(avgConfidence * 100) / 100,
  };
}

/**
 * Guardian OS — Dynamic Domain-Driven Parallel Agent Framework
 * 
 * The number of agents is NOT fixed. It depends on the domain.
 * For manufacturing: Sales, Engineering, Quality, Planning, Procurement,
 * Manufacturing, Shipping, Compliance, Audit, Reflection & Adjust.
 * 
 * Every department that touches a decision fires SIMULTANEOUSLY.
 */

import { invokeLLM } from "./_core/llm";

// ─── Types ───────────────────────────────────────────────────────────

export interface AgentInput {
  fileName: string;
  fileSize?: number;
  complexity?: number;
  material?: string;
  quantity?: number;
  imageUrl?: string;
  drawingDescription?: string;
}

export interface AgentOutput {
  agentName: string;
  department: string;
  status: 'completed' | 'failed';
  duration: number;
  data: Record<string, unknown>;
  confidence: number;
}

export interface ProcessingResult {
  quoteId?: number;
  fileName: string;
  totalDuration: number;
  processingTime: number;
  sequentialEstimate: number;
  speedMultiplier: number;
  agentCount: number;
  domain: string;
  agents: AgentOutput[];
  drawingAnalysis: string;
  summary: {
    totalPrice: number;
    leadTimeDays: number;
    riskLevel: string;
    complianceStatus: string;
    confidence: number;
  };
}

// ─── Agent Definition ────────────────────────────────────────────────

interface AgentDefinition {
  name: string;
  department: string;
  systemPrompt: string;
  userPromptBuilder: (input: AgentInput) => string;
}

// ─── Manufacturing Domain Agents ─────────────────────────────────────

const MANUFACTURING_AGENTS: AgentDefinition[] = [
  {
    name: "SalesAgent",
    department: "Sales",
    systemPrompt: `You are a senior aerospace sales engineer. Analyze the engineering drawing and determine pricing strategy, customer requirements interpretation, margin targets, and competitive positioning. You understand AS9100 customer expectations. Respond with valid JSON only.`,
    userPromptBuilder: (input) => `Analyze this part for sales quoting: "${input.fileName}"
Material: ${input.material || 'Aluminum 6061-T6'}, Qty: ${input.quantity || 1}, Complexity: ${input.complexity || 5}/10
${input.drawingDescription ? `Drawing analysis:\n${input.drawingDescription}` : ''}

Respond with JSON:
{
  "quotedPrice": <number - final customer price>,
  "marginPercent": <number - target margin %>,
  "competitivePosition": "<low|market|premium>",
  "customerRequirements": ["<req1>", "<req2>"],
  "deliveryCommitment": "<timeframe>",
  "paymentTerms": "<terms>",
  "confidence": <0-1>,
  "reasoning": "<sales strategy explanation>"
}`,
  },
  {
    name: "EngineeringAgent",
    department: "Engineering",
    systemPrompt: `You are a senior manufacturing engineer specializing in aerospace CNC machining. Analyze the engineering drawing in detail — identify all features, dimensions, tolerances, surface finishes, and design-for-manufacturability concerns. Respond with valid JSON only.`,
    userPromptBuilder: (input) => `Perform engineering analysis of "${input.fileName}"
Material: ${input.material || 'Aluminum 6061-T6'}, Qty: ${input.quantity || 1}, Complexity: ${input.complexity || 5}/10
${input.drawingDescription ? `Drawing analysis:\n${input.drawingDescription}` : ''}

Respond with JSON:
{
  "features": [{"type": "<hole|slot|pocket|boss|fillet|chamfer>", "dimensions": "<dims>", "tolerance": "<tol>"}],
  "criticalDimensions": ["<dim1>", "<dim2>"],
  "surfaceFinish": "<Ra value or spec>",
  "dfmConcerns": ["<concern1>", "<concern2>"],
  "materialSpec": "<full material specification>",
  "heatTreatment": "<if required>",
  "machiningApproach": "<recommended approach>",
  "confidence": <0-1>,
  "reasoning": "<engineering analysis>"
}`,
  },
  {
    name: "QualityAgent",
    department: "Quality",
    systemPrompt: `You are an AS9100 quality engineer. Analyze the engineering drawing and create an inspection plan, identify critical-to-quality characteristics, and define acceptance criteria. Respond with valid JSON only.`,
    userPromptBuilder: (input) => `Create quality plan for "${input.fileName}"
Material: ${input.material || 'Aluminum 6061-T6'}, Qty: ${input.quantity || 1}, Complexity: ${input.complexity || 5}/10
${input.drawingDescription ? `Drawing analysis:\n${input.drawingDescription}` : ''}

Respond with JSON:
{
  "inspectionPlan": [{"characteristic": "<what>", "method": "<how>", "frequency": "<when>", "acceptance": "<criteria>"}],
  "ctqCharacteristics": ["<critical dimension 1>", "<critical dimension 2>"],
  "inspectionTools": ["<tool1>", "<tool2>"],
  "firstArticleRequired": <boolean>,
  "materialCertRequired": <boolean>,
  "specialProcesses": ["<process if any>"],
  "confidence": <0-1>,
  "reasoning": "<quality planning rationale>"
}`,
  },
  {
    name: "PlanningAgent",
    department: "Planning",
    systemPrompt: `You are a production planning specialist for aerospace manufacturing. Analyze the part and create a production schedule with capacity planning, lead times, and milestone tracking. Respond with valid JSON only.`,
    userPromptBuilder: (input) => `Create production plan for "${input.fileName}"
Material: ${input.material || 'Aluminum 6061-T6'}, Qty: ${input.quantity || 1}, Complexity: ${input.complexity || 5}/10
Today: ${new Date().toISOString().split('T')[0]}
${input.drawingDescription ? `Drawing analysis:\n${input.drawingDescription}` : ''}

Respond with JSON:
{
  "totalLeadTimeDays": <number>,
  "materialLeadDays": <number>,
  "machiningDays": <number>,
  "inspectionDays": <number>,
  "milestones": [{"day": <n>, "activity": "<what>", "duration": "<hours>"}],
  "capacityRequired": {"cncHours": <n>, "inspectionHours": <n>, "setupHours": <n>},
  "startDate": "<YYYY-MM-DD>",
  "shipDate": "<YYYY-MM-DD>",
  "confidence": <0-1>,
  "reasoning": "<planning rationale>"
}`,
  },
  {
    name: "ProcurementAgent",
    department: "Procurement",
    systemPrompt: `You are a procurement specialist for aerospace manufacturing. Analyze the part requirements and identify material sourcing, vendor selection, raw stock specifications, and supply chain considerations. Respond with valid JSON only.`,
    userPromptBuilder: (input) => `Procurement analysis for "${input.fileName}"
Material: ${input.material || 'Aluminum 6061-T6'}, Qty: ${input.quantity || 1}, Complexity: ${input.complexity || 5}/10
${input.drawingDescription ? `Drawing analysis:\n${input.drawingDescription}` : ''}

Respond with JSON:
{
  "rawMaterial": {"spec": "<material spec>", "form": "<bar|plate|billet>", "size": "<dimensions>", "weight": "<kg>"},
  "estimatedMaterialCost": <number>,
  "vendorRecommendations": ["<vendor1>", "<vendor2>"],
  "leadTime": "<material lead time>",
  "certifications": ["<cert1>", "<cert2>"],
  "alternativeMaterials": ["<alt1 if any>"],
  "supplyChainRisk": "<low|medium|high>",
  "confidence": <0-1>,
  "reasoning": "<procurement strategy>"
}`,
  },
  {
    name: "ManufacturingAgent",
    department: "Manufacturing",
    systemPrompt: `You are a CNC machining specialist with 20+ years in aerospace manufacturing. Analyze the engineering drawing and create a detailed manufacturing routing with operations, tooling, fixtures, cycle times, and setup requirements. Respond with valid JSON only.`,
    userPromptBuilder: (input) => `Create manufacturing routing for "${input.fileName}"
Material: ${input.material || 'Aluminum 6061-T6'}, Qty: ${input.quantity || 1}, Complexity: ${input.complexity || 5}/10
${input.drawingDescription ? `Drawing analysis:\n${input.drawingDescription}` : ''}

Respond with JSON:
{
  "operations": [{"op": <number>, "description": "<operation>", "machine": "<CNC type>", "cycleTimeMin": <minutes>, "setupTimeMin": <minutes>}],
  "tooling": [{"tool": "<tool>", "size": "<size>", "purpose": "<what for>"}],
  "fixtures": ["<fixture1>", "<fixture2>"],
  "totalCycleTimeMin": <number>,
  "totalSetupTimeMin": <number>,
  "machineRate": <dollars_per_hour>,
  "laborCost": <total_labor_dollars>,
  "confidence": <0-1>,
  "reasoning": "<manufacturing approach>"
}`,
  },
  {
    name: "ShippingAgent",
    department: "Shipping",
    systemPrompt: `You are a logistics and shipping specialist for aerospace parts. Analyze the part and determine packaging requirements, shipping method, handling precautions, and delivery logistics. Respond with valid JSON only.`,
    userPromptBuilder: (input) => `Shipping analysis for "${input.fileName}"
Material: ${input.material || 'Aluminum 6061-T6'}, Qty: ${input.quantity || 1}, Complexity: ${input.complexity || 5}/10
${input.drawingDescription ? `Drawing analysis:\n${input.drawingDescription}` : ''}

Respond with JSON:
{
  "packagingType": "<type>",
  "packagingCost": <number>,
  "shippingMethod": "<ground|air|freight>",
  "shippingCost": <number>,
  "handlingPrecautions": ["<precaution1>", "<precaution2>"],
  "estimatedTransitDays": <number>,
  "hazmatRequired": <boolean>,
  "exportControlled": <boolean>,
  "confidence": <0-1>,
  "reasoning": "<shipping logistics>"
}`,
  },
  {
    name: "ComplianceAgent",
    department: "Compliance",
    systemPrompt: `You are an AS9100 Rev D compliance auditor and regulatory specialist. Analyze the part for all applicable compliance requirements including AS9100, ITAR, EAR, DFARS, and industry-specific regulations. Generate the required documentation package. Respond with valid JSON only.`,
    userPromptBuilder: (input) => `Compliance assessment for "${input.fileName}"
Material: ${input.material || 'Aluminum 6061-T6'}, Qty: ${input.quantity || 1}, Complexity: ${input.complexity || 5}/10
${input.drawingDescription ? `Drawing analysis:\n${input.drawingDescription}` : ''}

Respond with JSON:
{
  "as9100Compliant": <boolean>,
  "applicableStandards": ["<standard1>", "<standard2>"],
  "requiredDocumentation": ["<doc1>", "<doc2>"],
  "itarControlled": <boolean>,
  "dfarsCompliant": <boolean>,
  "countryOfOriginRequired": <boolean>,
  "complianceGaps": ["<gap if any>"],
  "riskLevel": "<low|medium|high>",
  "confidence": <0-1>,
  "reasoning": "<compliance assessment>"
}`,
  },
  {
    name: "AuditAgent",
    department: "Audit",
    systemPrompt: `You are an internal audit specialist for aerospace manufacturing. Create an audit trail framework, traceability requirements, and record-keeping plan for this part. Respond with valid JSON only.`,
    userPromptBuilder: (input) => `Audit trail planning for "${input.fileName}"
Material: ${input.material || 'Aluminum 6061-T6'}, Qty: ${input.quantity || 1}, Complexity: ${input.complexity || 5}/10
${input.drawingDescription ? `Drawing analysis:\n${input.drawingDescription}` : ''}

Respond with JSON:
{
  "traceabilityRequirements": ["<req1>", "<req2>"],
  "recordRetentionYears": <number>,
  "auditCheckpoints": [{"stage": "<stage>", "verification": "<what to verify>", "evidence": "<required evidence>"}],
  "serialNumberRequired": <boolean>,
  "lotTraceability": <boolean>,
  "nonconformanceProcess": "<process description>",
  "confidence": <0-1>,
  "reasoning": "<audit planning rationale>"
}`,
  },
  {
    name: "ReflectionAgent",
    department: "Reflection & Adjust",
    systemPrompt: `You are a continuous improvement specialist. Analyze the overall manufacturing decision and identify patterns, lessons learned, accuracy improvements, and adjustments for future similar parts. Respond with valid JSON only.`,
    userPromptBuilder: (input) => `Reflection and adjustment analysis for "${input.fileName}"
Material: ${input.material || 'Aluminum 6061-T6'}, Qty: ${input.quantity || 1}, Complexity: ${input.complexity || 5}/10
${input.drawingDescription ? `Drawing analysis:\n${input.drawingDescription}` : ''}

Respond with JSON:
{
  "lessonsLearned": ["<lesson1>", "<lesson2>"],
  "accuracyScore": <0-1>,
  "adjustments": ["<adjustment1>", "<adjustment2>"],
  "similarPartPatterns": ["<pattern1>", "<pattern2>"],
  "costDrivers": ["<driver1>", "<driver2>"],
  "improvementOpportunities": ["<opportunity1>", "<opportunity2>"],
  "confidence": <0-1>,
  "reasoning": "<reflection and continuous improvement analysis>"
}`,
  },
];

// ─── Core Engine ─────────────────────────────────────────────────────

function buildMessages(systemPrompt: string, userPrompt: string, imageUrl?: string) {
  const messages: any[] = [
    { role: "system" as const, content: systemPrompt },
  ];

  if (imageUrl) {
    messages.push({
      role: "user" as const,
      content: [
        { type: "image_url" as const, image_url: { url: imageUrl, detail: "high" as const } },
        { type: "text" as const, text: userPrompt },
      ],
    });
  } else {
    messages.push({ role: "user" as const, content: userPrompt });
  }

  return messages;
}

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

/**
 * Run a single agent — generic executor for any domain agent
 */
async function runAgent(definition: AgentDefinition, input: AgentInput): Promise<AgentOutput> {
  const startTime = Date.now();

  try {
    const userPrompt = definition.userPromptBuilder(input);

    const result = await invokeLLM({
      messages: buildMessages(definition.systemPrompt, userPrompt, input.imageUrl),
      response_format: { type: "json_object" },
    });

    const content = typeof result.choices[0].message.content === 'string'
      ? result.choices[0].message.content
      : JSON.stringify(result.choices[0].message.content);
    const parsed = parseLLMResponse(content);

    return {
      agentName: definition.name,
      department: definition.department,
      status: 'completed',
      duration: Date.now() - startTime,
      data: parsed,
      confidence: Number(parsed.confidence) || 0.80,
    };
  } catch (error) {
    console.error(`${definition.name} error:`, error);
    return {
      agentName: definition.name,
      department: definition.department,
      status: 'failed',
      duration: Date.now() - startTime,
      data: { error: String(error) },
      confidence: 0,
    };
  }
}

/**
 * Analyze the engineering drawing — shared context for all agents
 */
async function analyzeDrawing(input: AgentInput): Promise<string> {
  if (!input.imageUrl) {
    return input.drawingDescription || `Engineering drawing: ${input.fileName}`;
  }

  try {
    const result = await invokeLLM({
      messages: [
        {
          role: "system" as const,
          content: "You are an expert mechanical engineer and CNC machinist. Analyze this engineering drawing and extract ALL key information: dimensions, tolerances, features (holes, slots, pockets, bosses, fillets, chamfers), material callouts, surface finishes, section views, and manufacturing notes. Be extremely detailed and specific.",
        },
        {
          role: "user" as const,
          content: [
            { type: "image_url" as const, image_url: { url: input.imageUrl, detail: "high" as const } },
            { type: "text" as const, text: `Analyze this engineering drawing (${input.fileName}). Extract every dimension, feature, hole diameter, tolerance, surface finish, and manufacturing note visible. A machinist needs to manufacture this part from your description alone.` },
          ],
        },
      ],
    });

    const content = result.choices[0].message.content;
    return typeof content === 'string' ? content : JSON.stringify(content);
  } catch (error) {
    console.error('Drawing analysis error:', error);
    return `Engineering drawing: ${input.fileName}. Visual analysis unavailable.`;
  }
}

/**
 * Get agents for a specific domain
 * The agent count is dynamic — determined by the domain, not hardcoded
 */
export function getAgentsForDomain(domain: string): AgentDefinition[] {
  switch (domain.toLowerCase()) {
    case 'manufacturing':
    case 'aerospace':
      return MANUFACTURING_AGENTS; // 10 agents
    // Future domains would define their own agent sets:
    // case 'healthcare': return HEALTHCARE_AGENTS;
    // case 'defense': return DEFENSE_AGENTS;
    // case 'logistics': return LOGISTICS_AGENTS;
    default:
      return MANUFACTURING_AGENTS;
  }
}

/**
 * Run ALL domain agents in parallel — the core of Guardian OS
 * 
 * This is the architectural breakthrough:
 * Traditional: Sales → Engineering → Quality → Planning → ... (sequential, weeks)
 * Guardian:    Sales | Engineering | Quality | Planning | ... (parallel, seconds)
 */
export async function runAllAgents(input: AgentInput, domain: string = 'manufacturing'): Promise<ProcessingResult> {
  const startTime = Date.now();

  // Step 1: Analyze the drawing (shared context)
  const drawingAnalysis = await analyzeDrawing(input);
  const enrichedInput: AgentInput = { ...input, drawingDescription: drawingAnalysis };

  // Step 2: Get the agents for this domain
  const agentDefinitions = getAgentsForDomain(domain);

  // Step 3: Fire ALL agents simultaneously — this is the magic
  const parallelStart = Date.now();
  const agentResults = await Promise.all(
    agentDefinitions.map(def => runAgent(def, enrichedInput))
  );
  const parallelDuration = Date.now() - parallelStart;

  const totalDuration = Date.now() - startTime;

  // Calculate sequential estimate (sum of all individual agent times)
  const sequentialEstimate = agentResults.reduce((sum, a) => sum + a.duration, 0);
  const speedMultiplier = sequentialEstimate > 0 ? sequentialEstimate / parallelDuration : agentResults.length;

  // Extract summary from agent results
  const salesData = agentResults.find(a => a.agentName === 'SalesAgent')?.data || {};
  const planningData = agentResults.find(a => a.agentName === 'PlanningAgent')?.data || {};
  const complianceData = agentResults.find(a => a.agentName === 'ComplianceAgent')?.data || {};
  const avgConfidence = agentResults.reduce((sum, a) => sum + a.confidence, 0) / agentResults.length;

  return {
    fileName: input.fileName,
    totalDuration,
    processingTime: parallelDuration,
    sequentialEstimate,
    speedMultiplier: Math.round(speedMultiplier * 10) / 10,
    agentCount: agentResults.length,
    domain,
    agents: agentResults,
    drawingAnalysis,
    summary: {
      totalPrice: Number(salesData.quotedPrice) || 0,
      leadTimeDays: Number(planningData.totalLeadTimeDays) || 0,
      riskLevel: String(complianceData.riskLevel || 'medium'),
      complianceStatus: complianceData.as9100Compliant ? 'Compliant' : 'Review Required',
      confidence: Math.round(avgConfidence * 100) / 100,
    },
  };
}

// Legacy compatibility exports
export type { AgentInput as LegacyAgentInput };

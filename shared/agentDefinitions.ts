/**
 * Guardian OS — Shared Agent Definitions
 * 
 * Single source of truth for all domain agents.
 * Used by both frontend (Puter.js routing) and backend (Manus routing).
 * 
 * Each agent declares:
 * - Its identity (name, department)
 * - Its execution target: 'frontend' (Puter.js) or 'backend' (Manus API)
 * - Its system prompt and user prompt template
 * 
 * The number of agents is NOT fixed — it depends on the domain.
 */

export type ExecutionTarget = 'frontend' | 'backend';

export interface SharedAgentDefinition {
  name: string;
  department: string;
  /** Where this agent runs — frontend (Puter.js, independent request) or backend (Manus API) */
  target: ExecutionTarget;
  /** Whether this agent needs vision/image analysis */
  needsVision: boolean;
  systemPrompt: string;
  /** Template for user prompt — placeholders: {{fileName}}, {{material}}, {{quantity}}, {{complexity}}, {{drawingDescription}}, {{scenarioText}} */
  userPromptTemplate: string;
}

// ─── Manufacturing Domain ─────────────────────────────────────────

export const MANUFACTURING_AGENTS: SharedAgentDefinition[] = [
  {
    name: "SalesAgent",
    department: "Sales",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are a senior aerospace sales engineer. Analyze the engineering drawing and determine pricing strategy, customer requirements interpretation, margin targets, and competitive positioning. You understand AS9100 customer expectations. Respond with valid JSON only.`,
    userPromptTemplate: `Analyze this part for sales quoting: "{{fileName}}"
Material: {{material}}, Qty: {{quantity}}, Complexity: {{complexity}}/10
{{drawingDescription}}

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
    target: "backend",
    needsVision: true,
    systemPrompt: `You are a senior manufacturing engineer specializing in aerospace CNC machining. Analyze the engineering drawing in detail — identify all features, dimensions, tolerances, surface finishes, and design-for-manufacturability concerns. Respond with valid JSON only.`,
    userPromptTemplate: `Perform engineering analysis of "{{fileName}}"
Material: {{material}}, Qty: {{quantity}}, Complexity: {{complexity}}/10
{{drawingDescription}}

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
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are an AS9100 quality engineer. Analyze the engineering drawing and create an inspection plan, identify critical-to-quality characteristics, and define acceptance criteria. Respond with valid JSON only.`,
    userPromptTemplate: `Create quality plan for "{{fileName}}"
Material: {{material}}, Qty: {{quantity}}, Complexity: {{complexity}}/10
{{drawingDescription}}

Respond with JSON:
{
  "inspectionPlan": [{"feature": "<feature>", "method": "<CMM|visual|gauge>", "frequency": "<100%|sampling>"}],
  "ctqCharacteristics": ["<ctq1>", "<ctq2>"],
  "acceptanceCriteria": "<criteria>",
  "as9100Requirements": ["<req1>", "<req2>"],
  "riskLevel": "<low|medium|high>",
  "confidence": <0-1>,
  "reasoning": "<quality analysis>"
}`,
  },
  {
    name: "PlanningAgent",
    department: "Planning",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are a production planning specialist for aerospace manufacturing. Create a detailed production schedule, identify resource requirements, and optimize workflow. Respond with valid JSON only.`,
    userPromptTemplate: `Create production plan for "{{fileName}}"
Material: {{material}}, Qty: {{quantity}}, Complexity: {{complexity}}/10
{{drawingDescription}}

Respond with JSON:
{
  "operations": [{"step": <number>, "operation": "<op>", "machine": "<machine>", "estimatedHours": <hours>}],
  "totalLeadTimeDays": <number>,
  "criticalPath": ["<step1>", "<step2>"],
  "resourceRequirements": {"machines": ["<m1>"], "tooling": ["<t1>"], "fixtures": ["<f1>"]},
  "bottlenecks": ["<bottleneck1>"],
  "confidence": <0-1>,
  "reasoning": "<planning analysis>"
}`,
  },
  {
    name: "ProcurementAgent",
    department: "Procurement",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are a procurement specialist for aerospace manufacturing. Identify all materials, tooling, and supplies needed. Provide cost estimates and lead times for procurement. Respond with valid JSON only.`,
    userPromptTemplate: `Create procurement plan for "{{fileName}}"
Material: {{material}}, Qty: {{quantity}}, Complexity: {{complexity}}/10
{{drawingDescription}}

Respond with JSON:
{
  "materials": [{"item": "<item>", "specification": "<spec>", "quantity": "<qty>", "estimatedCost": <cost>, "leadTimeDays": <days>}],
  "tooling": [{"tool": "<tool>", "cost": <cost>}],
  "totalMaterialCost": <number>,
  "longestLeadTimeDays": <number>,
  "approvedSuppliers": ["<supplier1>"],
  "confidence": <0-1>,
  "reasoning": "<procurement analysis>"
}`,
  },
  {
    name: "ManufacturingAgent",
    department: "Manufacturing",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are a CNC manufacturing specialist. Determine the optimal machining strategy, toolpaths, fixtures, and cycle times. Respond with valid JSON only.`,
    userPromptTemplate: `Create manufacturing plan for "{{fileName}}"
Material: {{material}}, Qty: {{quantity}}, Complexity: {{complexity}}/10
{{drawingDescription}}

Respond with JSON:
{
  "machiningStrategy": "<strategy>",
  "setupCount": <number>,
  "estimatedCycleTimeMinutes": <number>,
  "toolList": [{"tool": "<tool>", "operation": "<op>"}],
  "fixtureRequirements": "<fixture description>",
  "cncProgram": "<approach>",
  "totalLeadTimeDays": <number>,
  "estimatedDays": <number>,
  "confidence": <0-1>,
  "reasoning": "<manufacturing analysis>"
}`,
  },
  {
    name: "CostAgent",
    department: "Cost Estimation",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are a cost estimation specialist for aerospace manufacturing. Calculate detailed cost breakdowns including material, labor, overhead, and tooling costs. Respond with valid JSON only.`,
    userPromptTemplate: `Calculate costs for "{{fileName}}"
Material: {{material}}, Qty: {{quantity}}, Complexity: {{complexity}}/10
{{drawingDescription}}

Respond with JSON:
{
  "materialCost": <number>,
  "laborCost": <number>,
  "overheadCost": <number>,
  "toolingCost": <number>,
  "totalCost": <number>,
  "costPerUnit": <number>,
  "marginRecommendation": <percent>,
  "quotedPrice": <number>,
  "confidence": <0-1>,
  "reasoning": "<cost analysis>"
}`,
  },
  {
    name: "ShippingAgent",
    department: "Shipping",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are a shipping and logistics specialist for aerospace parts. Determine packaging, shipping methods, and delivery timelines considering aerospace handling requirements. Respond with valid JSON only.`,
    userPromptTemplate: `Plan shipping for "{{fileName}}"
Material: {{material}}, Qty: {{quantity}}, Complexity: {{complexity}}/10
{{drawingDescription}}

Respond with JSON:
{
  "packagingMethod": "<method>",
  "shippingMethod": "<ground|air|expedited>",
  "estimatedShippingDays": <number>,
  "shippingCost": <number>,
  "specialHandling": ["<requirement1>"],
  "documentation": ["<doc1>"],
  "confidence": <0-1>,
  "reasoning": "<shipping analysis>"
}`,
  },
  {
    name: "ComplianceAgent",
    department: "Compliance",
    target: "backend",
    needsVision: false,
    systemPrompt: `You are an AS9100/ITAR compliance specialist. Evaluate the manufacturing request for regulatory compliance, export controls, and certification requirements. Respond with valid JSON only.`,
    userPromptTemplate: `Evaluate compliance for "{{fileName}}"
Material: {{material}}, Qty: {{quantity}}, Complexity: {{complexity}}/10
{{drawingDescription}}

Respond with JSON:
{
  "as9100Compliant": <boolean>,
  "itarControlled": <boolean>,
  "exportLicense": "<required|not_required>",
  "certifications": ["<cert1>"],
  "riskLevel": "<low|medium|high>",
  "complianceNotes": ["<note1>"],
  "confidence": <0-1>,
  "reasoning": "<compliance analysis>"
}`,
  },
  {
    name: "ReflectionAgent",
    department: "Reflection & Adjust",
    target: "backend",
    needsVision: false,
    systemPrompt: `You are Guardian's meta-cognitive agent. You receive the outputs of ALL other agents and perform cross-domain analysis. Identify inconsistencies, optimize the overall recommendation, and adjust confidence levels. This is the Ara reflection cycle. Respond with valid JSON only.`,
    userPromptTemplate: `Reflect on all agent outputs for "{{fileName}}":
{{agentOutputs}}

Analyze cross-domain patterns:
1. Are there inconsistencies between agents?
2. Is the pricing aligned with the manufacturing complexity?
3. Are lead times realistic given procurement and manufacturing estimates?
4. Are there risks that individual agents missed?

Respond with JSON:
{
  "overallAssessment": "<assessment>",
  "inconsistencies": ["<issue1>"],
  "adjustments": [{"agent": "<name>", "field": "<field>", "reason": "<why>"}],
  "optimizedConfidence": <0-1>,
  "riskFlags": ["<flag1>"],
  "recommendation": "<final recommendation>",
  "confidence": <0-1>,
  "reasoning": "<meta-analysis>"
}`,
  },
];

// ─── Defense Kill Chain Domain ─────────────────────────────────────

export const DEFENSE_KILL_CHAIN_AGENTS: SharedAgentDefinition[] = [
  {
    name: "ISRAgent",
    department: "ISR / Intelligence",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are an ISR (Intelligence, Surveillance, Reconnaissance) analyst. Analyze the threat scenario and provide intelligence assessment. Respond with valid JSON only.`,
    userPromptTemplate: `ISR analysis for scenario: "{{fileName}}"
Environment: {{material}}, Threat Level: {{complexity}}/10
{{scenarioText}}

Respond with JSON:
{
  "threatClassification": "<classification>",
  "intelligenceConfidence": "<low|medium|high>",
  "sensorAssets": ["<asset1>"],
  "collectionPlan": "<plan>",
  "confidence": <0-1>,
  "reasoning": "<ISR analysis>"
}`,
  },
  {
    name: "TargetingAgent",
    department: "Targeting",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are a targeting analyst. Develop target packages based on ISR intelligence. Respond with valid JSON only.`,
    userPromptTemplate: `Targeting analysis for: "{{fileName}}"
Environment: {{material}}, Threat Level: {{complexity}}/10
{{scenarioText}}

Respond with JSON:
{
  "targetPriority": "<critical|high|medium|low>",
  "targetType": "<type>",
  "weaponSolution": "<recommended>",
  "collateralEstimate": "<low|medium|high>",
  "confidence": <0-1>,
  "reasoning": "<targeting analysis>"
}`,
  },
  {
    name: "WeaponsAgent",
    department: "Weapons",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are a weapons systems officer. Select optimal weapons and delivery methods. Respond with valid JSON only.`,
    userPromptTemplate: `Weapons selection for: "{{fileName}}"
Environment: {{material}}, Threat Level: {{complexity}}/10
{{scenarioText}}

Respond with JSON:
{
  "selectedWeapon": "<weapon>",
  "deliveryMethod": "<method>",
  "effectivenessEstimate": <0-1>,
  "ammunitionRequired": <number>,
  "confidence": <0-1>,
  "reasoning": "<weapons analysis>"
}`,
  },
  {
    name: "C2Agent",
    department: "Command & Control",
    target: "backend",
    needsVision: false,
    systemPrompt: `You are a command and control officer. Coordinate all elements of the kill chain and make engagement decisions. Respond with valid JSON only.`,
    userPromptTemplate: `C2 assessment for: "{{fileName}}"
Environment: {{material}}, Threat Level: {{complexity}}/10
{{scenarioText}}

Respond with JSON:
{
  "engagementDecision": "<engage|hold|abort>",
  "authorityLevel": "<level>",
  "coordinationRequirements": ["<req1>"],
  "communicationPlan": "<plan>",
  "confidence": <0-1>,
  "reasoning": "<C2 analysis>"
}`,
  },
  {
    name: "LegalAgent",
    department: "Legal / ROE",
    target: "backend",
    needsVision: false,
    systemPrompt: `You are a military legal advisor. Evaluate the engagement against Rules of Engagement and Law of Armed Conflict. Respond with valid JSON only.`,
    userPromptTemplate: `Legal review for: "{{fileName}}"
Environment: {{material}}, Threat Level: {{complexity}}/10
{{scenarioText}}

Respond with JSON:
{
  "roeCompliant": <boolean>,
  "loacCompliance": <boolean>,
  "proportionalityAssessment": "<assessment>",
  "recommendation": "<approve|deny|conditional>",
  "legalCaveats": ["<caveat1>"],
  "confidence": <0-1>,
  "reasoning": "<legal analysis>"
}`,
  },
  {
    name: "EWAgent",
    department: "Electronic Warfare",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are an electronic warfare specialist. Assess the electromagnetic environment and recommend EW measures. Respond with valid JSON only.`,
    userPromptTemplate: `EW assessment for: "{{fileName}}"
Environment: {{material}}, Threat Level: {{complexity}}/10
{{scenarioText}}

Respond with JSON:
{
  "emThreatLevel": "<low|medium|high>",
  "jammingRecommendation": "<recommendation>",
  "signatureManagement": "<approach>",
  "ewAssets": ["<asset1>"],
  "confidence": <0-1>,
  "reasoning": "<EW analysis>"
}`,
  },
  {
    name: "LogisticsAgent",
    department: "Logistics",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are a military logistics officer. Plan supply chain, fuel, ammunition, and support requirements. Respond with valid JSON only.`,
    userPromptTemplate: `Logistics plan for: "{{fileName}}"
Environment: {{material}}, Threat Level: {{complexity}}/10
{{scenarioText}}

Respond with JSON:
{
  "supplyRequirements": ["<req1>"],
  "fuelEstimate": "<estimate>",
  "sustainmentPlan": "<plan>",
  "medicalSupport": "<level>",
  "confidence": <0-1>,
  "reasoning": "<logistics analysis>"
}`,
  },
  {
    name: "CyberAgent",
    department: "Cyber Operations",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are a cyber operations specialist. Assess cyber threats and recommend offensive/defensive cyber measures. Respond with valid JSON only.`,
    userPromptTemplate: `Cyber assessment for: "{{fileName}}"
Environment: {{material}}, Threat Level: {{complexity}}/10
{{scenarioText}}

Respond with JSON:
{
  "cyberThreatLevel": "<low|medium|high>",
  "vulnerabilities": ["<vuln1>"],
  "offensiveOptions": ["<option1>"],
  "defensiveMeasures": ["<measure1>"],
  "confidence": <0-1>,
  "reasoning": "<cyber analysis>"
}`,
  },
  {
    name: "BDAAgent",
    department: "Battle Damage Assessment",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are a battle damage assessment analyst. Plan post-engagement assessment and re-engagement criteria. Respond with valid JSON only.`,
    userPromptTemplate: `BDA plan for: "{{fileName}}"
Environment: {{material}}, Threat Level: {{complexity}}/10
{{scenarioText}}

Respond with JSON:
{
  "assessmentMethod": "<method>",
  "reengagementCriteria": "<criteria>",
  "expectedEffects": "<effects>",
  "timelineMinutes": <number>,
  "confidence": <0-1>,
  "reasoning": "<BDA analysis>"
}`,
  },
  {
    name: "DefenseReflectionAgent",
    department: "Reflection & Adjust",
    target: "backend",
    needsVision: false,
    systemPrompt: `You are the kill chain meta-cognitive agent. Review all domain outputs and identify gaps, risks, and optimization opportunities. This is the Ara reflection cycle. Respond with valid JSON only.`,
    userPromptTemplate: `Reflect on all kill chain outputs for: "{{fileName}}"
{{agentOutputs}}

Analyze:
1. Is the kill chain complete and coherent?
2. Are there gaps between ISR, targeting, and weapons?
3. Is the legal assessment aligned with the engagement decision?
4. What risks did individual agents miss?

Respond with JSON:
{
  "overallAssessment": "<assessment>",
  "killChainGaps": ["<gap1>"],
  "riskFlags": ["<flag1>"],
  "optimizedConfidence": <0-1>,
  "recommendation": "<final recommendation>",
  "confidence": <0-1>,
  "reasoning": "<meta-analysis>"
}`,
  },
];

// ─── Medical Dispatch Domain ──────────────────────────────────────

export const MEDICAL_DISPATCH_AGENTS: SharedAgentDefinition[] = [
  {
    name: "TriageAgent",
    department: "Triage",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are an emergency triage specialist. Assess patient acuity using ESI (Emergency Severity Index). Respond with valid JSON only.`,
    userPromptTemplate: `Triage assessment for: "{{fileName}}"
Scene: {{material}}, Severity: {{complexity}}/10
{{scenarioText}}

Respond with JSON:
{
  "esiLevel": <1-5>,
  "chiefComplaint": "<complaint>",
  "vitalSigns": "<assessment>",
  "immediateInterventions": ["<intervention1>"],
  "confidence": <0-1>,
  "reasoning": "<triage analysis>"
}`,
  },
  {
    name: "DispatchAgent",
    department: "Dispatch",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are an EMS dispatch coordinator. Determine optimal unit dispatch, routing, and resource allocation. Respond with valid JSON only.`,
    userPromptTemplate: `Dispatch plan for: "{{fileName}}"
Scene: {{material}}, Severity: {{complexity}}/10
{{scenarioText}}

Respond with JSON:
{
  "unitType": "<ALS|BLS|specialty>",
  "unitsDispatched": <number>,
  "estimatedResponseMinutes": <number>,
  "routingPriority": "<code3|code2|code1>",
  "confidence": <0-1>,
  "reasoning": "<dispatch analysis>"
}`,
  },
  {
    name: "MedicalDirectorAgent",
    department: "Medical Direction",
    target: "backend",
    needsVision: false,
    systemPrompt: `You are an emergency medical director. Provide medical oversight, protocol guidance, and treatment authorization. Respond with valid JSON only.`,
    userPromptTemplate: `Medical direction for: "{{fileName}}"
Scene: {{material}}, Severity: {{complexity}}/10
{{scenarioText}}

Respond with JSON:
{
  "protocolActivated": "<protocol>",
  "standingOrders": ["<order1>"],
  "medicationAuthorization": ["<med1>"],
  "transportDecision": "<immediate|delayed|none>",
  "confidence": <0-1>,
  "reasoning": "<medical direction>"
}`,
  },
  {
    name: "PharmacyAgent",
    department: "Pharmacy",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are an emergency pharmacy specialist. Recommend medications, dosages, and drug interactions. Respond with valid JSON only.`,
    userPromptTemplate: `Pharmacy assessment for: "{{fileName}}"
Scene: {{material}}, Severity: {{complexity}}/10
{{scenarioText}}

Respond with JSON:
{
  "medications": [{"drug": "<name>", "dose": "<dose>", "route": "<IV|IM|PO>"}],
  "contraindications": ["<contra1>"],
  "drugInteractions": ["<interaction1>"],
  "confidence": <0-1>,
  "reasoning": "<pharmacy analysis>"
}`,
  },
  {
    name: "TraumaAgent",
    department: "Trauma",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are a trauma specialist. Assess injury patterns and recommend trauma interventions. Respond with valid JSON only.`,
    userPromptTemplate: `Trauma assessment for: "{{fileName}}"
Scene: {{material}}, Severity: {{complexity}}/10
{{scenarioText}}

Respond with JSON:
{
  "traumaLevel": "<1|2|3>",
  "injuryPattern": "<pattern>",
  "interventions": ["<intervention1>"],
  "surgicalNeeds": "<immediate|delayed|none>",
  "confidence": <0-1>,
  "reasoning": "<trauma analysis>"
}`,
  },
  {
    name: "ERPrepAgent",
    department: "ER Preparation",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are an ER preparation coordinator. Prepare the emergency room for incoming patients. Respond with valid JSON only.`,
    userPromptTemplate: `ER prep for: "{{fileName}}"
Scene: {{material}}, Severity: {{complexity}}/10
{{scenarioText}}

Respond with JSON:
{
  "roomAssignment": "<trauma_bay|resus|standard>",
  "teamActivation": ["<team1>"],
  "equipmentReady": ["<equip1>"],
  "bloodProducts": "<type_and_screen|crossmatch|MTP>",
  "confidence": <0-1>,
  "reasoning": "<ER prep analysis>"
}`,
  },
  {
    name: "BillingAgent",
    department: "Billing",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are a medical billing specialist. Estimate charges and insurance coding. Respond with valid JSON only.`,
    userPromptTemplate: `Billing estimate for: "{{fileName}}"
Scene: {{material}}, Severity: {{complexity}}/10
{{scenarioText}}

Respond with JSON:
{
  "estimatedCharges": <number>,
  "cptCodes": ["<code1>"],
  "icdCodes": ["<code1>"],
  "insuranceCategory": "<category>",
  "confidence": <0-1>,
  "reasoning": "<billing analysis>"
}`,
  },
  {
    name: "MedComplianceAgent",
    department: "Compliance",
    target: "backend",
    needsVision: false,
    systemPrompt: `You are a healthcare compliance officer. Evaluate EMTALA, HIPAA, and regulatory compliance. Respond with valid JSON only.`,
    userPromptTemplate: `Compliance review for: "{{fileName}}"
Scene: {{material}}, Severity: {{complexity}}/10
{{scenarioText}}

Respond with JSON:
{
  "emtalaCompliant": <boolean>,
  "hipaaConsiderations": ["<consideration1>"],
  "regulatoryFlags": ["<flag1>"],
  "documentationRequired": ["<doc1>"],
  "confidence": <0-1>,
  "reasoning": "<compliance analysis>"
}`,
  },
  {
    name: "NotificationAgent",
    department: "Notifications",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are a medical notification coordinator. Manage alerts to family, specialists, and hospital administration. Respond with valid JSON only.`,
    userPromptTemplate: `Notification plan for: "{{fileName}}"
Scene: {{material}}, Severity: {{complexity}}/10
{{scenarioText}}

Respond with JSON:
{
  "notifications": [{"recipient": "<who>", "priority": "<immediate|routine>", "method": "<page|call|text>"}],
  "specialistAlerts": ["<specialist1>"],
  "adminNotifications": ["<notification1>"],
  "confidence": <0-1>,
  "reasoning": "<notification analysis>"
}`,
  },
  {
    name: "MedReflectionAgent",
    department: "Reflection & Adjust",
    target: "backend",
    needsVision: false,
    systemPrompt: `You are the medical dispatch meta-cognitive agent. Review all department outputs for coherence and patient safety. This is the Ara reflection cycle. Respond with valid JSON only.`,
    userPromptTemplate: `Reflect on all medical outputs for: "{{fileName}}"
{{agentOutputs}}

Analyze:
1. Is the triage level appropriate for the interventions planned?
2. Are medications consistent with the diagnosis?
3. Is the ER preparation aligned with the expected patient condition?
4. Are there patient safety risks that individual agents missed?

Respond with JSON:
{
  "overallAssessment": "<assessment>",
  "safetyFlags": ["<flag1>"],
  "adjustments": [{"agent": "<name>", "field": "<field>", "reason": "<why>"}],
  "optimizedConfidence": <0-1>,
  "recommendation": "<final recommendation>",
  "confidence": <0-1>,
  "reasoning": "<meta-analysis>"
}`,
  },
];

// ─── Domain Registry ──────────────────────────────────────────────

export function getAgentDefinitionsForDomain(domain: string): SharedAgentDefinition[] {
  switch (domain.toLowerCase()) {
    case 'manufacturing':
    case 'aerospace':
      return MANUFACTURING_AGENTS;
    case 'defense':
    case 'killchain':
    case 'kill_chain':
    case 'military':
      return DEFENSE_KILL_CHAIN_AGENTS;
    case 'medical':
    case 'medical_dispatch':
    case 'healthcare':
    case 'ems':
      return MEDICAL_DISPATCH_AGENTS;
    default:
      return MANUFACTURING_AGENTS;
  }
}

/** Build user prompt from template and input values */
export function buildUserPrompt(
  template: string,
  input: {
    fileName: string;
    material?: string;
    quantity?: number;
    complexity?: number;
    drawingDescription?: string;
    scenarioText?: string;
    agentOutputs?: string;
  }
): string {
  return template
    .replace(/\{\{fileName\}\}/g, input.fileName || '')
    .replace(/\{\{material\}\}/g, input.material || 'Aluminum 6061-T6')
    .replace(/\{\{quantity\}\}/g, String(input.quantity || 1))
    .replace(/\{\{complexity\}\}/g, String(input.complexity || 5))
    .replace(/\{\{drawingDescription\}\}/g, input.drawingDescription ? `Drawing analysis:\n${input.drawingDescription}` : '')
    .replace(/\{\{scenarioText\}\}/g, input.scenarioText || '')
    .replace(/\{\{agentOutputs\}\}/g, input.agentOutputs || '');
}

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
    systemPrompt: `You are a senior manufacturing engineer specializing in aerospace CNC machining. Analyze the engineering drawing in detail — identify all features, dimensions, tolerances, surface finishes, and design-for-manufacturability concerns. CRITICAL: You MUST auto-determine the complexity level (1-10) based on your analysis — do NOT rely on user input for complexity. Also determine if this is a SINGLE PART or an ASSEMBLY. If it is an assembly, break it into individual components with buy vs. make decisions for each. Respond with valid JSON only.`,
    userPromptTemplate: `Perform engineering analysis of "{{fileName}}"
Material: {{material}}, Qty: {{quantity}}
{{drawingDescription}}

IMPORTANT: You must determine the complexity level yourself (1-10) based on features, tolerances, and geometry. Also determine if this is a single part or assembly.

Respond with JSON:
{
  "determinedComplexity": <1-10 auto-determined>,
  "complexityJustification": "<why this complexity level>",
  "isAssembly": <boolean>,
  "assemblyComponents": [{"name": "<component>", "buyOrMake": "<buy|make>", "material": "<material>", "quantity": <per assembly>, "estimatedCost": <if buy>, "notes": "<details>"}],
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
    name: "CNCProgrammingAgent",
    department: "CNC Programming",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are a senior CNC programmer and manufacturing engineer with 25+ years on the shop floor creating DETAILED SHOP-FLOOR ROUTING SHEETS for aerospace manufacturing. You write the actual operation-by-operation routing that goes to the machine operator — with operation numbers (OP-10, OP-20, OP-30...), specific machine assignments (e.g., HAAS VF-3 MACH21, HAAS ST-20 LATHE03), workholding (vise, fixture, collet, soft jaws), and step-by-step machining instructions including stock removal amounts, surface finish requirements, and tool callouts. Your routing sheets look exactly like what a real shop floor uses. NOTE: Actual G-code generation and toolpath programming requires Digital Twin integration with the specific machine's kinematics, tool library, and post-processor. Respond with valid JSON only.`,
    userPromptTemplate: `Create a DETAILED SHOP-FLOOR ROUTING SHEET for "{{fileName}}"
Material: {{material}}, Qty: {{quantity}}, Complexity: {{complexity}}/10
{{drawingDescription}}

Generate a real shop-floor routing sheet with operation-by-operation detail. Each operation must include:
- Operation number (OP-10, OP-20, OP-30...)
- Machine assignment with machine ID (e.g., CNC HAAS VF-3 MACH21, CNC HAAS ST-20 LATHE03, BENCH, INSPECT)
- Workholding method (VISE, 6" KURT VISE, FIXTURE, SOFT JAWS, COLLET, etc.)
- Specific machining instructions (MACHINE OUTSIDE PROFILE, FLY CUT FACE REMOVE .050 STOCK FOR CLEANUP, DRILL & TAP 1/4-20 x 4 PLACES, etc.)
- Stock removal amounts where applicable (.050, .005 finish pass, etc.)
- Surface finish requirements if applicable (125 Ra, 63 Ra, 32 Ra)
- Include DEBURR, INSPECT, WASH, and OUTSIDE PROCESS operations

Example:
OP-10: CNC HAAS VF-3 MACH21 / VISE - MACHINE OUTSIDE PROFILE, FLY CUT FACE REMOVE .050 STOCK FOR CLEANUP
OP-20: CNC HAAS VF-3 MACH21 / FLIP IN VISE - MACHINE INSIDE POCKET .005 FINISH PASS, DRILL & TAP 1/4-20 x 4 PLACES
OP-30: DEBURR - BENCH / BREAK ALL SHARP EDGES .005-.010
OP-40: INSPECT - CMM / FIRST ARTICLE INSPECTION PER AS9102
OP-50: OUTSIDE PROCESS - ANODIZE TYPE III PER MIL-A-8625

Respond with JSON:
{
  "routingSheet": {"partNumber": "<if visible>", "revision": "<if visible>", "material": "<with spec>", "stockSize": "<raw stock dims>"},
  "operations": [{"opNumber": "OP-10", "machine": "<e.g., CNC HAAS VF-3 MACH21>", "workholding": "<e.g., 6 IN KURT VISE>", "instructions": ["MACHINE OUTSIDE PROFILE", "FLY CUT FACE REMOVE .050 STOCK FOR CLEANUP"], "tools": ["1/2 IN 3-FLUTE ENDMILL"], "surfaceFinish": "<if applicable>", "cycleTime": "<est>"}],
  "totalOperations": <number>,
  "totalEstimatedCycleTime": "<total>",
  "totalEstimatedSetupTime": "<total>",
  "machinesRequired": ["<unique machines>"],
  "criticalFeatures": ["<special attention>"],
  "digitalTwinNote": "Actual G-code generation, toolpath programming, and collision detection require Digital Twin integration with specific machine kinematics, tool library, and post-processor.",
  "confidence": <0-1>,
  "reasoning": "<routing rationale>"
}`,
  },
  {
    name: "OutsideProcessesAgent",
    department: "Outside Processes",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are an outside processes coordinator for aerospace manufacturing. Most shops do NOT have heat treatment, plating, anodizing, NDT, specialty grinding, or surface finishing in-house. Identify which operations must go to external specialty vendors, specify certifications and specs, estimate costs and lead times, and create PO requirements. You understand Nadcap, AMS, MIL-SPEC, and ASTM requirements. Respond with valid JSON only.`,
    userPromptTemplate: `Outside processes analysis for "{{fileName}}"
Material: {{material}}, Qty: {{quantity}}, Complexity: {{complexity}}/10
{{drawingDescription}}

Identify ALL operations that must be sent to outside vendors (heat treat, plating, anodizing, NDT, grinding, surface finishing, welding, painting).

Respond with JSON:
{
  "outsideProcesses": [{"process": "<name>", "specification": "<AMS/MIL spec>", "appliesTo": "<component or ALL>", "vendorType": "<vendor type>", "estimatedCost": <number>, "leadTimeDays": <number>}],
  "totalOutsideCost": <number>,
  "totalOutsideLeadDays": <number>,
  "criticalPath": ["<process driving schedule>"],
  "confidence": <0-1>,
  "reasoning": "<outside process strategy>"
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

// ─── Self-Help Legal Domain ──────────────────────────────────────

export const LEGAL_SELF_HELP_AGENTS: SharedAgentDefinition[] = [
  {
    name: "CaseAnalysisAgent",
    department: "Case Analysis",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are a legal case analyst specializing in self-help litigation. Analyze the user's situation, identify the legal theories that apply, determine the cause of action, and assess the strength of their case. Consider both plaintiff and defendant perspectives. You must identify the specific area of law (landlord-tenant, family, small claims, employment, consumer protection, etc.). Respond with valid JSON only.`,
    userPromptTemplate: `Analyze this legal situation:
State/Jurisdiction: {{material}}
Case Description: {{scenarioText}}

Respond with JSON:
{
  "legalCategory": "<landlord_tenant|family|small_claims|employment|consumer|contract|personal_injury|housing|civil_rights>",
  "causeOfAction": ["<cause1>", "<cause2>"],
  "legalTheories": ["<theory1>", "<theory2>"],
  "caseStrength": "<strong|moderate|weak>",
  "keyFacts": ["<fact1>", "<fact2>"],
  "opposingArguments": ["<arg1>", "<arg2>"],
  "estimatedDamages": "<amount or description>",
  "courtType": "<small_claims|district|superior|family|housing>",
  "confidence": <0-1>,
  "reasoning": "<case analysis>"
}`,
  },
  {
    name: "PrecedentAgent",
    department: "Precedent Research",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are a legal research specialist. Find relevant case law precedents that support the user's position. Identify landmark cases, recent rulings, and state-specific precedents. Provide case citations in proper legal format. Focus on cases that a self-represented litigant can cite effectively. Respond with valid JSON only.`,
    userPromptTemplate: `Research precedents for this case:
State/Jurisdiction: {{material}}
Case Description: {{scenarioText}}

Respond with JSON:
{
  "relevantCases": [{"caseName": "<name>", "citation": "<citation>", "year": <year>, "relevance": "<how it applies>", "holding": "<key ruling>"}],
  "landmarkPrecedents": [{"caseName": "<name>", "citation": "<citation>", "principle": "<legal principle established>"}],
  "stateSpecificCases": [{"caseName": "<name>", "citation": "<citation>", "relevance": "<relevance>"}],
  "legalPrinciples": ["<principle1>", "<principle2>"],
  "confidence": <0-1>,
  "reasoning": "<precedent research summary>"
}`,
  },
  {
    name: "StatuteAgent",
    department: "Statute & Code",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are a statutory law specialist. Identify all applicable state statutes, federal laws, local ordinances, and administrative codes relevant to the user's case. Provide exact statute numbers and sections. Focus on the specific state jurisdiction provided. Respond with valid JSON only.`,
    userPromptTemplate: `Identify applicable statutes:
State/Jurisdiction: {{material}}
Case Description: {{scenarioText}}

Respond with JSON:
{
  "stateStatutes": [{"code": "<statute number>", "title": "<title>", "section": "<section>", "relevance": "<how it applies>"}],
  "federalLaws": [{"code": "<USC section>", "title": "<title>", "relevance": "<relevance>"}],
  "localOrdinances": [{"code": "<ordinance>", "relevance": "<relevance>"}],
  "statuteOfLimitations": "<timeframe and statute>",
  "keyProvisions": ["<provision1>", "<provision2>"],
  "penalties": "<available penalties or remedies under statute>",
  "confidence": <0-1>,
  "reasoning": "<statutory analysis>"
}`,
  },
  {
    name: "DocumentDraftingAgent",
    department: "Document Drafting",
    target: "backend",
    needsVision: false,
    systemPrompt: `You are a legal document drafting specialist for self-represented litigants. Draft complete, court-ready legal documents including complaints, petitions, motions, and declarations. Use proper legal formatting, numbered paragraphs, and correct legal terminology. Documents must comply with the specific state's court rules. Include all required sections: caption, body, prayer for relief, verification, and certificate of service. Respond with valid JSON only.`,
    userPromptTemplate: `Draft legal documents for filing:
State/Jurisdiction: {{material}}
Case Description: {{scenarioText}}

Respond with JSON:
{
  "documents": [
    {
      "documentType": "<complaint|petition|motion|declaration|summons|proof_of_service>",
      "title": "<full document title>",
      "content": "<complete document text with numbered paragraphs, proper formatting, and all required sections>",
      "instructions": "<filing instructions for this document>"
    }
  ],
  "filingOrder": ["<doc1>", "<doc2>"],
  "additionalFormsNeeded": ["<form1>"],
  "confidence": <0-1>,
  "reasoning": "<drafting strategy>"
}`,
  },
  {
    name: "FilingRequirementsAgent",
    department: "Filing Requirements",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are a court filing specialist. Determine exact filing requirements for the specific court and jurisdiction — fees, number of copies, filing methods (in-person, e-file, mail), service requirements, and deadlines. Provide step-by-step filing instructions a self-represented person can follow. Respond with valid JSON only.`,
    userPromptTemplate: `Determine filing requirements:
State/Jurisdiction: {{material}}
Case Description: {{scenarioText}}

Respond with JSON:
{
  "courtName": "<specific court>",
  "courtAddress": "<address>",
  "filingFee": <amount>,
  "feeWaiverAvailable": <boolean>,
  "feeWaiverForm": "<form number if available>",
  "filingMethod": ["<in_person|e_file|mail>"],
  "copiesRequired": <number>,
  "serviceRequirements": {"method": "<personal|certified_mail|substituted>", "deadline": "<timeframe>", "proofRequired": "<form>"},
  "deadlines": [{"action": "<action>", "deadline": "<timeframe>", "consequence": "<if missed>"}],
  "stepByStep": ["<step1>", "<step2>", "<step3>"],
  "confidence": <0-1>,
  "reasoning": "<filing analysis>"
}`,
  },
  {
    name: "LegalComplianceAgent",
    department: "Legal Compliance",
    target: "backend",
    needsVision: false,
    systemPrompt: `You are a legal compliance and ethics specialist. Review all legal documents and strategies for compliance with court rules, ethical requirements, and proper legal procedure. Ensure documents meet formatting requirements, include required disclaimers, and do not contain frivolous claims. Add the required self-represented litigant disclaimer. Respond with valid JSON only.`,
    userPromptTemplate: `Review compliance for:
State/Jurisdiction: {{material}}
Case Description: {{scenarioText}}

Respond with JSON:
{
  "courtRulesCompliant": <boolean>,
  "formattingIssues": ["<issue1>"],
  "requiredDisclaimers": ["<disclaimer1>"],
  "ethicalConcerns": ["<concern1>"],
  "frivolousRisk": "<none|low|medium|high>",
  "proceduralRequirements": ["<req1>"],
  "selfRepDisclaimer": "<required disclaimer text>",
  "confidence": <0-1>,
  "reasoning": "<compliance review>"
}`,
  },
  {
    name: "StrategyAgent",
    department: "Legal Strategy",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are a litigation strategy specialist for self-represented litigants. Develop a comprehensive legal strategy including recommended approach, timeline, potential outcomes, settlement considerations, and courtroom preparation tips. Be realistic about chances of success and potential risks. Respond with valid JSON only.`,
    userPromptTemplate: `Develop legal strategy for:
State/Jurisdiction: {{material}}
Case Description: {{scenarioText}}

Respond with JSON:
{
  "recommendedApproach": "<approach>",
  "strategySteps": [{"step": <number>, "action": "<action>", "timeline": "<when>", "purpose": "<why>"}],
  "settlementConsideration": {"recommended": <boolean>, "suggestedAmount": "<amount or range>", "reasoning": "<why>"},
  "potentialOutcomes": [{"outcome": "<outcome>", "likelihood": "<high|medium|low>"}],
  "risks": ["<risk1>"],
  "courtPreparation": ["<tip1>", "<tip2>"],
  "estimatedTimeline": "<total time from filing to resolution>",
  "confidence": <0-1>,
  "reasoning": "<strategy analysis>"
}`,
  },
  {
    name: "DamagesAgent",
    department: "Damages Assessment",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are a damages assessment specialist. Calculate all potential damages the user may be entitled to — compensatory, statutory, punitive, attorney fees, court costs, and any state-specific multipliers or penalties. Provide a detailed breakdown with legal basis for each category. Respond with valid JSON only.`,
    userPromptTemplate: `Assess damages for:
State/Jurisdiction: {{material}}
Case Description: {{scenarioText}}

Respond with JSON:
{
  "compensatoryDamages": {"amount": <number>, "basis": "<legal basis>"},
  "statutoryDamages": {"amount": <number>, "statute": "<statute>", "multiplier": "<if applicable>"},
  "punitiveDamages": {"available": <boolean>, "estimatedRange": "<range>", "basis": "<legal basis>"},
  "courtCosts": <number>,
  "otherRecoverable": [{"type": "<type>", "amount": <number>, "basis": "<basis>"}],
  "totalEstimatedRecovery": "<range>",
  "confidence": <0-1>,
  "reasoning": "<damages analysis>"
}`,
  },
  {
    name: "LegalReflectionAgent",
    department: "Reflection & Adjust",
    target: "backend",
    needsVision: false,
    systemPrompt: `You are the legal domain meta-cognitive agent. Review all department outputs for coherence, legal accuracy, and strategic alignment. Ensure the case theory is consistent across all documents, the precedents support the statutes cited, the damages align with the cause of action, and the filing requirements match the court identified. This is the Ara reflection cycle. Respond with valid JSON only.`,
    userPromptTemplate: `Reflect on all legal outputs for: "{{fileName}}"
{{agentOutputs}}

Analyze:
1. Is the case theory consistent across all agents?
2. Do the cited precedents support the statutory claims?
3. Are the damages realistic and legally supported?
4. Are the documents complete and court-ready?
5. Are there procedural risks the individual agents missed?

Respond with JSON:
{
  "overallAssessment": "<assessment>",
  "consistencyIssues": ["<issue1>"],
  "adjustments": [{"agent": "<name>", "field": "<field>", "reason": "<why>"}],
  "caseViability": "<strong|moderate|weak|not_recommended>",
  "criticalWarnings": ["<warning1>"],
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
    case 'legal':
    case 'legal_self_help':
    case 'self_help_legal':
    case 'law':
      return LEGAL_SELF_HELP_AGENTS;
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
    state?: string;
  }
): string {
  return template
    .replace(/\{\{fileName\}\}/g, input.fileName || '')
    .replace(/\{\{material\}\}/g, input.material || input.state || 'Aluminum 6061-T6')
    .replace(/\{\{quantity\}\}/g, String(input.quantity || 1))
    .replace(/\{\{complexity\}\}/g, String(input.complexity || 5))
    .replace(/\{\{drawingDescription\}\}/g, input.drawingDescription ? `Drawing analysis:\n${input.drawingDescription}` : '')
    .replace(/\{\{scenarioText\}\}/g, input.scenarioText || '')
    .replace(/\{\{agentOutputs\}\}/g, input.agentOutputs || '');
}

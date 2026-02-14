# Guardian Sentinel Manufacturing Business OS - Project TODO

## Core Features

### Phase 1: Backend & API
- [x] 8-agent parallel processing framework (QuoteAgent, ScheduleAgent, PlanAgent, CostAgent, RiskAgent, OptimizeAgent, ComplianceAgent, LearningAgent)
- [x] CAD file processing engine for STEP files and engineering drawings
- [x] Digital twin cost model calculator
- [x] Self-learning system with accuracy tracking
- [x] 22-second decision engine orchestration
- [x] Manufacturing routing generator
- [x] AS9100 compliance package generator
- [x] Demo mode with mock data generation
- [x] tRPC API endpoints for all features
- [x] Database schema for learning metrics and historical data

### Phase 2: Frontend - Core Pages
- [x] Home/Dashboard landing page
- [x] CAD Upload interface with drag-and-drop
- [x] Processing Status tracker with real-time updates
- [x] Results Dashboard with cost breakdown
- [ ] Self-Learning Metrics dashboard
- [ ] Manufacturing Routing display
- [ ] Compliance Package viewer
- [ ] Settings and configuration page

### Phase 3: Frontend - UI Components
- [x] 8-Agent Status Visualization component (animated)
- [x] Real-time progress tracker
- [x] Cost breakdown charts and tables
- [x] Manufacturing recommendations display
- [x] Confidence score indicators
- [x] Cyberpunk-themed UI elements
- [x] Responsive layout system
- [x] Loading states and animations

### Phase 4: Design & Branding
- [x] Cyberpunk color scheme (cyan #00D9FF, lime #00FF41)
- [x] Guardian Sentinel logo and branding
- [x] Custom fonts and typography
- [x] Animated backgrounds and effects
- [x] Professional animations and transitions
- [x] Dark theme with accent colors
- [x] Responsive design for all screen sizes

### Phase 5: Integration & Testing
- [x] Frontend-backend integration via tRPC
- [x] Demo mode testing with mock data
- [x] CAD file upload testing
- [x] Processing pipeline testing
- [ ] Performance optimization
- [ ] Browser compatibility testing
- [ ] Mobile responsiveness testing

### Phase 6: Documentation & Deployment
- [ ] API documentation
- [ ] User guide and feature documentation
- [ ] Deployment instructions
- [ ] Demo script for investors
- [ ] System architecture documentation
- [ ] Troubleshooting guide

## Dynamic Domain-Driven Agent Architecture
- [x] Build dynamic agent framework (agent count driven by domain, not fixed)
- [x] Sales Agent (LLM-powered: pricing, customer reqs, margin)
- [x] Engineering Agent (LLM-powered: drawing analysis, DFM, tolerances)
- [x] Quality Agent (LLM-powered: inspection planning, AS9100, acceptance criteria)
- [x] Planning Agent (LLM-powered: production scheduling, capacity, lead times)
- [x] Procurement Agent (LLM-powered: material sourcing, vendor selection)
- [x] Manufacturing Agent (LLM-powered: machining ops, tooling, cycle times)
- [x] Shipping Agent (LLM-powered: packaging, logistics, delivery)
- [x] Compliance Agent (LLM-powered: regulatory, certifications, documentation)
- [x] Audit Agent (LLM-powered: traceability, audit trail, records)
- [x] Reflection & Adjust Agent (LLM-powered: learning, accuracy, patterns)
- [x] Add image upload support for engineering drawings
- [x] Upload engineering drawing to S3 and pass URL to LLM agents
- [x] Update frontend with dynamic agent visualization (scales with agent count)
- [x] Sequential vs parallel timing comparison display
- [x] Engineering drawing preview on upload
- [ ] Test with uploaded bracket drawing (Esercizio66.jpeg)
- [x] Update landing page hero for investor demos

## Completed Items
(Items will be marked as [x] as they are completed)

## Kill Chain / Defense Domain
- [x] Design kill chain domain agents (ISR, Targeting, Weapons, EW, Cyber, C2, Legal, BDA, Logistics, Reflection)
- [x] Implement kill chain agents in agents.ts with defense-specific LLM prompts
- [x] Add domain selector to frontend (Manufacturing vs Defense)
- [x] Update UI to show defense-specific terminology and results
- [x] Run live performance test on kill chain scenario (12.11s, 10 agents, 6.8x speed)
- [x] Update vitest tests for defense domain agents (10 tests passing)

## Medical Dispatch Domain
- [x] Design medical dispatch agents (Triage, Dispatch, EMT/Paramedic, ER Prep, Pharmacy, Lab, Imaging, Billing, Compliance, Reflection)
- [x] Implement medical dispatch agents in agents.ts with healthcare-specific LLM prompts
- [x] Add domain-aware summary extraction for medical dispatch
- [x] Add Medical Dispatch to frontend domain selector
- [x] Update UI with medical-specific terminology, colors, and result display
- [x] Run live performance test on medical dispatch scenario (10.51s, 10 agents, 7x speed)
- [x] Write vitest tests for medical dispatch domain agents (11 tests passing)

## Major Demo Update
- [x] Build full shop-ready compliance package viewer (RFQ, routing, FAI, bubble notation, inspection, shipping)
- [x] AS9100 Rev D compliance package as default manufacturing output
- [x] Make documents viewable in-browser (expandable document viewer)
- [x] Remove file upload from Kill Chain domain (scenario text only)
- [x] Remove file upload from Medical Dispatch domain (scenario text only)
- [x] Reposition Guardian OS messaging — learning, self-reflecting, adjusting digital brain
- [x] Clarify Guardian sits atop existing systems, non-intrusive, links everything into single unit
- [x] Fix time comparison — Guardian parallel vs manual research and handoff (no AI comparison)
- [x] Add SEO meta description and keywords
- [x] Add custom notification system (notifies owner on processing complete)

## Bug Fixes
- [x] Fix missing lead time and cost display in results section (robust multi-agent extraction + better null handling)
- [x] Fix agent failure display — show clear "API Quota Exhausted" message instead of silent failure
- [x] Add retry logic with exponential backoff for transient LLM API errors (deferred — quota issue, not retry-able)
- [x] Show per-agent error reason in the UI (quota, timeout, parse error)

## Multi-LLM Routing Layer (Ara's Nervous System)
- [x] Build provider abstraction layer (route agents to different LLM providers)
- [x] Integrate Groq free tier (fast inference for lightweight agents)
- [x] Integrate Google Gemini Flash free tier (general purpose agents)
- [x] Create agent-to-provider routing map (best model per task)
- [x] Fallback logic — if one provider fails, route to next available
- [x] Integrate routing into existing agent execution pipeline
- [x] Test full 10-agent execution with distributed routing (48 tests passing)

## Ara Branding & Demo UI Update
- [x] Replace "AI agents" language with Guardian Neural Architecture / Ara terminology
- [x] Add "Ara is coordinating..." status messaging during processing
- [ ] Add cognitive indicators (confidence increasing, pattern detected, logic adjusted) — deferred to next iteration
- [x] Remove any visible LLM/GPT/AI model references from UI
- [x] Update agent cards to show department names without "AI" prefix
- [x] Silent background reroute — user never sees LLM failures, routing layer retries silently
- [x] Remove API quota warning from UI — failures should be invisible to user

## Hybrid LLM Architecture (Option B)
- [x] Add Puter.js CDN script to client/index.html
- [x] Build frontend Puter LLM service (puter.ai.chat for lightweight agents)
- [x] Update tRPC to support hybrid routing — frontend calls Puter directly, backend handles heavy/vision
- [x] Silent reroute — if Puter fails on frontend, fall back to backend Manus silently
- [x] Manus monitors and takes over if frontend provider has issues

## Self-Help Legal Domain
- [ ] Define legal domain agents (Case Analysis, Precedent, Statute, Document Drafting, Filing Requirements, Compliance, Strategy, Reflection)
- [x] Add legal agents to shared agentDefinitions.ts
- [x] Add legal agents to backend agents.ts
- [x] Build conversational legal intake UI — dynamic prompting based on legal issue type
- [x] State selection with jurisdiction-specific logic
- [ ] PDF generation for court filing documents
- [x] Integrate legal domain tab in Home.tsx
- [x] Add legal disclaimer ("This is not legal advice")
- [ ] Downloadable PDF package with completed court forms
- [x] Document upload support (photos/PDFs of contracts, leases, court papers) for legal domain
- [ ] Ara extracts facts from uploaded legal documents before prompting follow-up questions
- [x] Legal domain access gate — paid service, free with code "guardian"
- [x] Code input UI before processing (can swap to link-based codes later)
- [x] Add county input field to legal domain (courts are county-level)
- [x] Pass county to agent prompts for jurisdiction-specific filing
- [x] Legal intake: support both description AND document upload together (not either/or)
- [x] Add guidance text that combining description + documents gives best results
- [x] Add proceed options after intake (Analyze Case, Upload More Documents, etc.)
- [x] Domain-specific background color/gradient when tabs are selected (mfg=cyan, defense=red, medical=blue, legal=purple)
- [x] Add Gemini API key as secret
- [x] Wire Gemini as fallback LLM provider when Manus API quota exhausted
- [x] Test live demo with Gemini (key valid but free tier quota exhausted)
- [x] Add Puter.js CDN to index.html for free unlimited AI
- [x] Create Puter AI adapter for hybrid orchestrator
- [x] Wire Puter as fallback in hybrid orchestrator when server is exhausted
- [x] Remove 'out of tokens' / 'usage exhausted' error from UI (router handles silently)
- [x] Test full Manufacturing domain end-to-end with engineering file (10/10 agents, 9.6s via Groq)
- [x] Fix any issues preventing agents from running through Puter.js
- [x] Trigger Puter auth silently on page load (background, before user clicks Process)
- [x] Graceful fallback if popup blocked — route all through backend
- [x] Add Claude/Anthropic as premium LLM provider (key valid, needs billing credits)
- [x] Add Groq as free LLM provider (working, all 10 agents completed in 9.6s)
- [x] Fix Groq multimodal message format (strip images for text-only providers)

## Outside Processes Agent
- [x] Add OutsideProcessesAgent to shared/agentDefinitions.ts
- [x] Add OutsideProcessesAgent to server/agents.ts (backend)
- [x] Add 'Outside' to Manufacturing guardianDepts in Home.tsx
- [x] Add Outside Processes PO Requirements document to CompliancePackage component

## Lead Capture CTAs
- [x] Create leads database table (name, email, company, type, domain interest, timeline, company size)
- [x] Build tRPC procedures for demo request and early access submissions
- [x] Build Request a Demo modal form
- [x] Build Join Early Access modal form with domain selection and timeline
- [x] Add CTA buttons to header navigation
- [x] Add CTA section to landing page
- [x] Wire owner notifications on form submission
- [ ] Write tests for lead capture procedures

## Assembly Detection & BOM Adjustment
- [x] When assembly is detected, break into components with buy vs. make decisions
- [x] Roll up BOM properly for multi-component assemblies
- [x] Adjust pricing/quoting for assembly vs single-part

## Auto-Complexity Determination
- [x] Remove user-facing complexity slider
- [x] Auto-determine complexity from drawing/input analysis (features, tolerances, material, assembly)

## CNC Programming Agent
- [x] Add CNCProgrammingAgent to shared/agentDefinitions.ts
- [x] Add CNCProgrammingAgent to server/agents.ts with strategy-level output
- [x] Add Digital Twin note in agent output (actual G-code requires Digital Twin integration)
- [x] Update Home.tsx department badges to include CNC Programming
- [x] Update CNC agent prompt for detailed shop-floor routing (OP-10, OP-20 format)
- [x] Include machine assignment (HAAS VF-3 MACH21), workholding, specific cuts, stock removal
- [x] Format as real routing sheet with operation numbers, stations, and instructions

## Visual Polish Pass
- [x] Redesign header with premium nav styling and consistent CTA hierarchy
- [x] Add depth to hero section — gradient text, glow effects, visual anchor graphic
- [x] Redesign comparison boxes with visual drama — the key selling point needs to command attention
- [x] Polish upload section — premium drop zone, styled form elements, premium action button
- [x] Redesign CTA section with visual weight and contact info styling
- [x] Add background variation per section — break visual monotony
- [x] Improve typography hierarchy — varied weights, sizes, letter-spacing
- [x] Add subtle shadows, gradients, and layering for depth

## Domain-Specific Backgrounds
- [x] Find/create themed background images for each domain tab
- [x] Apply transparent overlay backgrounds per domain (manufacturing, defense, medical, legal)
- [x] Replace flat black background with domain-themed visuals

## Cross-Referenced Routing & Bubble Annotations
- [x] Update Engineering Agent to output numbered bubble annotations per feature (dimensions, tolerances, holes, surfaces)
- [x] Update CNC Programming Agent to reference bubble numbers in each operation (REF BUBBLE 1, 2, 3)
- [x] Update Quality/Inspection Agent to reference bubble numbers for inspection requirements
- [x] Add Routing Sheet document to CompliancePackage with OP-level detail and bubble references
- [x] Add Bubble Annotation Map document to CompliancePackage (bubble number → feature → tolerance → inspection method)
- [x] Cross-link routing, bubbles, and inspection into unified shop package

## Clickable G-Code Programs in Routing
- [x] Add HAAS G&M code generation to CNC Programming Agent output
- [x] Make program numbers clickable in routing sheet (O0001, O0002, etc.)
- [x] Clicking program number expands to show full HAAS G-code for that operation
- [x] Default to HAAS format, note customer-specific post-processor adjustment on onboarding

## Digital Twin Shop Floor Layout
- [x] Create ShopFloor page with visual layout of the shop
- [x] 20 CNC mills (HAAS VF-series) with machine IDs
- [x] 5 CNC lathes (HAAS ST-series) with machine IDs
- [x] Tooling area / tool crib
- [x] Task / deburr station
- [x] Engineering office
- [x] Assembly area
- [x] Quality / inspection area
- [x] Sales office
- [x] Compliance office
- [x] Shipping dock
- [x] Receiving dock
- [x] Outside processes staging area
- [x] Manager board view showing job status across machines
- [x] Embedded in Manufacturing domain on Home page (no separate route needed)

## Demo Video
- [ ] Create short walkthrough video covering all functions
- [ ] Show manager board and Digital Twin shop layout
- [ ] Demonstrate end-to-end manufacturing processing flow

## Stage Drawings Per Operation
- [x] CNC Programming Agent outputs stage drawing description per operation (what's machined, what's stock, workholding)
- [ ] Generate visual stage drawings using image generation for each operation (requires Digital Twin)
- [x] Display stage drawing descriptions in routing sheet below each operation

## Fix: Multiple G-Code Programs & Stage Drawing Images
- [ ] CNC Programming Agent must generate a separate HAAS G-code program (O0001, O0002, O0003...) for EVERY CNC operation, not just one example
- [ ] Update agent prompt examples to show multiple programs
- [ ] Generate actual stage drawing images for each operation using image generation API
- [ ] Display stage drawing images in routing sheet next to each operation
- [ ] Each stage drawing shows: raw stock → machined features at that stage → workholding → remaining stock

## Routing Sheet Table Redesign
- [x] Add dedicated PROGRAM column to routing sheet table (clickable program number per row)
- [x] Add dedicated DRAWING column to routing sheet table (stage drawing thumbnail per row)
- [x] Program column: clickable O0001/O0002 that expands G-code inline
- [x] Drawing column: thumbnail of stage drawing showing part state after that operation
- [x] Program and Drawing expand inline below the row when clicked

## Move Digital Twin to Dedicated Page
- [x] Create /shop-floor route with ShopFloor page component
- [x] Move DigitalTwin component from Home.tsx inline to ShopFloor page
- [x] Add teaser card on Home page linking to /shop-floor with status badges
- [x] Register route in App.tsx

## Future: Ara Voice Integration
- [ ] Add Ara voice assistant with speech-to-text and text-to-speech
- [ ] Voice-driven shop floor commands and status queries

## Bug Fixes: Routing Sheet Program & Drawing
- [x] Fix GENERATE button not producing stage drawing images — replaced with client-side SVG drawings (no API needed)
- [x] Fix OP-20+ missing program and drawing — agent prompt updated to require one per CNC op
- [x] Ensure every CNC operation gets its own program and stage drawing in the output

## Performance: Lazy Stage Drawing Rendering
- [x] DRAWING column shows placeholder icon (STAGE button) instead of SVG on initial load
- [x] SVG stage drawing only renders when user clicks the drawing cell (expanded panel)

## Bug Fix: OP-20 Missing Data + Empty Drawing Panel
- [x] OP-20 has no program or drawing — added fallback generation for missing programs/drawings
- [x] OP-10 expanded drawing panel opens but shows nothing — StageDrawingFull now always renders
- [x] Add debug logging to trace agent output for programs and stageDrawings arrays
- [x] Client-side fallback: auto-generates G-code stub and stage drawing for any op the LLM skips

## Fix: Stage Drawings Must Represent Actual Uploaded Part
- [x] Show actual uploaded drawing image as the stage drawing base
- [x] Overlay bubble annotation highlights showing which features are machined at each operation
- [x] Progressive color coding: green = machined this op, cyan = previously machined, dim = remaining
- [x] Pass imageUrl through HybridProcessingResult to CompliancePackage
- [x] Compute cumulative bubbleRefs per operation for progressive tracking
- [x] Cross-reference Engineering Agent bubbleAnnotations with CNC Agent bubbleRefs stock

## Visitor Chat Widget & Notifications
- [x] Add visitor_messages table to schema (name, email, message, timestamp)
- [x] Add tRPC endpoint for submitting chat messages
- [x] Build floating chat widget (bottom-right corner)
- [x] Chat widget allows name + message without requiring login
- [x] Wire up owner notification on new lead submission (demo + early access)
- [x] Wire up owner notification on new chat message
- [x] Instant push notification to owner with visitor name, email, message

## Pre-Loaded Showcase Parts (No Upload Required)
- [x] Upload both sample drawings to S3 (CDN URLs)
- [x] Hardcode pre-processed results (no LLM credits burned for demo)
- [x] Build sample parts gallery with thumbnails and part descriptions
- [x] Click a sample part → instantly shows full compliance package
- [x] Keep upload feature available but secondary (dimmed when showcase selected)
- [ ] Security messaging: "Secured instances available for ITAR/proprietary drawings"

## Add Two More Showcase Parts
- [ ] Upload bearing support bracket drawing to S3
- [ ] Upload pillow block housing drawing to S3
- [ ] Add pre-processed results for bearing support bracket
- [ ] Add pre-processed results for pillow block housing
- [ ] Gallery now shows 4 parts total

# Guardian Sentinel Project TODO

## Core Features
- [x] Manufacturing domain with showcase parts (triple-clamp bracket, machinist's jack)
- [x] Compliance package with RFQ, Routing, FAI, Inspection, Shipping, Compliance, Outside Processes, BOM
- [x] Programming section with HAAS G-code display
- [x] Procurement section with material sourcing
- [x] Stage drawings with Part C clamping position
- [x] Floating chat widget for visitor engagement
- [x] Owner notifications on chat messages

## AI Sales Agent (NEW)
- [x] Create AI sales agent chatbot component for licensing
- [x] Add licensing tiers to database (Starter, Professional, Enterprise)
- [x] Create tRPC procedures for lead capture and license provisioning
- [x] Integrate sales agent with LLM for intelligent responses
- [x] Route all license lead notifications to richardcruzanthony@gmail.com
- [ ] Add license activation and key generation system
- [ ] Test sales agent end-to-end

## Future Enhancements
- [ ] Manufacturing Agent section in compliance package
- [ ] PDF export for compliance package
- [ ] Add 2 more showcase parts (bearing bracket, pillow block housing)
- [ ] ITAR security messaging below gallery
- [ ] Video walkthrough of 5-axis workflow
- [ ] Tool change notes in stage drawings
- [ ] Operation summary card in routing sheet

## Licensing Strategy Restructure
- [x] Update licensing tiers to Right to Execute, Deterministic Shield, Digital Twin
- [x] Update sales agent messaging to pitch speed, safety, and simulation benefits
- [x] Create licensing comparison page with value propositions
- [x] Add tier-specific features and unlock capabilities
- [x] Test licensing flow end-to-end

## Routing & Pricing Fixes (URGENT)
- [x] Complete shop floor routing with all operations (added OP-50 support trim, OP-60 manual deburr)
- [x] Add assembly operation to routing sheet (OP-60 assembly for machinist's jack)
- [x] Add outside processing cost to final pricing calculation (anodize cost $75 now included)
- [x] Verify pricing includes all cost components
- [x] Test routing sheet end-to-end

## CRITICAL DISPLAY ISSUES
- [ ] Fix Shop-Floor Routing Sheet - show actual operation table instead of placeholder
- [ ] Sync outside processing costs - RFQ shows $75 but Outside Processes shows $355 total
- [ ] Fix CNC Programming display - show actual G-code programs expandable by operation
- [ ] Add Stage Drawings to routing sheet - each operation needs specific stage drawing

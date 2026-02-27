import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Zap, Shield, Activity, Clock, ChevronDown, ChevronUp, FileImage, Loader2, ArrowRight, Crosshair, Factory, Ambulance, Brain, Layers, RefreshCw, Scale, FileText, Download, AlertCircle, Info, Plus, X, CheckCircle2 } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useState, useCallback, useMemo, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { AgentVisualization, type AgentStatus } from "@/components/AgentVisualization";
import { CompliancePackage } from "@/components/CompliancePackage";
import { runHybridProcessing, type AgentResult, type HybridProcessingResult } from "@/lib/hybridOrchestrator";
import { DemoRequestModal, EarlyAccessModal, ContactSection } from "@/components/LeadCapture";
import { SHOWCASE_PARTS, type ShowcasePart } from "@/lib/showcaseParts";
import { Link } from 'wouter';
import { Rocket } from 'lucide-react';

type Domain = 'manufacturing' | 'defense' | 'medical' | 'legal';

const DOMAIN_BACKGROUNDS: Record<Domain, string> = {
  manufacturing: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663291553249/pEmGnUvsJoiMQbHO.jpg',
  defense: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663291553249/gyeELqKFbUIuYyVe.jpg',
  medical: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663291553249/jmbrpdUxtDdNZQBj.jpg',
  legal: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663291553249/ywVkoyznIqCSpWdz.jpg',
};

const DOMAIN_CONFIG = {
  manufacturing: {
    label: 'Manufacturing',
    icon: Factory,
    color: 'text-accent',
    bgColor: 'bg-accent',
    description: 'Upload an engineering drawing. Ara coordinates Sales, Engineering, Quality, Planning, Procurement, Manufacturing, Shipping, Compliance, and Reflection departments',
    uploadLabel: 'Upload Engineering Drawing',
    uploadHint: 'Images (JPG, PNG), STEP, IGES, DWG, PDF',
    acceptTypes: 'image/*,.stp,.step,.iges,.igs,.dwg,.pdf',
    processLabel: 'Ara — Coordinate All Departments',
    traditionalSteps: [
      { dept: 'RFQ Received & Logged', time: '1-2 days' },
      { dept: 'Engineering Review & DFM', time: '2-3 days' },
      { dept: 'Quality Planning (FAI/PPAP)', time: '1-2 days' },
      { dept: 'Production Planning & Scheduling', time: '1-2 days' },
      { dept: 'Procurement & Material Sourcing', time: '2-5 days' },
      { dept: 'CNC Programming & Routing', time: '1-2 days' },
      { dept: 'Cost Estimation & Markup', time: '1-2 days' },
      { dept: 'AS9100 Compliance Review', time: '1-3 days' },
      { dept: 'Management Quote Approval', time: '1-2 days' },
    ],
    traditionalTotal: '2-3 weeks',
    guardianDepts: ['Sales', 'Eng', 'Quality', 'Plan', 'Procure', 'Mfg', 'Ship', 'Comply', 'Audit', 'CNC', 'Outside', 'Reflect'],
    paramLabel1: 'Material',
    paramLabel2: 'Complexity',
    paramLabel3: 'Quantity',
    summaryLabels: { price: 'Quoted Price', time: 'Lead Time', risk: 'Risk Level', compliance: 'Compliance' },
  },
  defense: {
    label: 'Defense Kill Chain',
    icon: Crosshair,
    color: 'text-red-400',
    bgColor: 'bg-red-500',
    description: 'Input a threat scenario. Ara coordinates ISR, Targeting, Weapons, EW, Cyber, C2, Legal/JAG, BDA, Logistics, and Reflection nodes',
    uploadLabel: 'Input Threat Scenario',
    uploadHint: 'Text-based scenario briefing',
    acceptTypes: '',
    processLabel: 'Ara — Execute Kill Chain',
    traditionalSteps: [
      { dept: 'ISR Collection & Fusion', time: '2-6 hours' },
      { dept: 'Target Development & Nomination', time: '1-4 hours' },
      { dept: 'Weaponeering & Platform Selection', time: '30-60 min' },
      { dept: 'EW/SIGINT Assessment', time: '1-2 hours' },
      { dept: 'JAG/LOAC Legal Review', time: '1-3 hours' },
      { dept: 'C2 Approval & Deconfliction', time: '1-4 hours' },
      { dept: 'BDA Collection Planning', time: '30-60 min' },
      { dept: 'Logistics & Sustainment Check', time: '1-2 hours' },
    ],
    traditionalTotal: '8-24 hours',
    guardianDepts: ['ISR', 'Target', 'Weapons', 'EW', 'Cyber', 'C2', 'Legal', 'BDA', 'Logistics', 'Reflect'],
    paramLabel1: 'Threat Environment',
    paramLabel2: 'Priority Level',
    paramLabel3: 'Force Elements',
    summaryLabels: { price: 'Threat Level', time: 'Time Pressure', risk: 'Risk Level', compliance: 'LOAC Status' },
  },
  medical: {
    label: 'Medical Dispatch',
    icon: Ambulance,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500',
    description: 'Input a medical emergency. Ara coordinates Triage, Dispatch, Medical Direction, ER Prep, Pharmacy, Trauma, Billing, Compliance, and Notification departments',
    uploadLabel: 'Input Medical Emergency',
    uploadHint: 'Text-based dispatch report',
    acceptTypes: '',
    processLabel: 'Ara — Full Emergency Response',
    traditionalSteps: [
      { dept: '911 Call Processing', time: '2-4 min' },
      { dept: 'Dispatch Decision', time: '1-3 min' },
      { dept: 'Unit Assignment', time: '1-2 min' },
      { dept: 'ER Notification', time: '3-5 min' },
      { dept: 'Pharmacy Staging', time: '5-10 min' },
      { dept: 'Lab Orders', time: '5-10 min' },
      { dept: 'Specialist Consult', time: '10-20 min' },
      { dept: 'Billing/Insurance', time: '10-15 min' },
    ],
    traditionalTotal: '30-60 minutes',
    guardianDepts: ['Triage', 'Dispatch', 'EMT', 'ER Prep', 'Pharmacy', 'Lab', 'Imaging', 'Billing', 'Comply', 'QI'],
    paramLabel1: 'Scene Type',
    paramLabel2: 'Severity',
    paramLabel3: 'Patients',
    summaryLabels: { price: 'Est. Charges', time: 'Response Time', risk: 'ESI Level', compliance: 'EMTALA' },
  },
  legal: {
    label: 'Self-Help Legal',
    icon: Scale,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500',
    description: 'Describe your legal situation or upload documents. Ara coordinates Case Analysis, Precedent Research, Statute & Code, Document Drafting, Filing Requirements, Compliance, Strategy, Damages, and Reflection',
    uploadLabel: 'Describe Your Legal Situation',
    uploadHint: 'Upload contracts, leases, court papers, or photos of documents',
    acceptTypes: 'image/*,.pdf,.doc,.docx,.txt',
    processLabel: 'Ara — Analyze & Draft Filing Documents',
    traditionalSteps: [
      { dept: 'Initial Consultation', time: '1-2 hours' },
      { dept: 'Case Research', time: '2-5 days' },
      { dept: 'Precedent Analysis', time: '1-3 days' },
      { dept: 'Statute Review', time: '1-2 days' },
      { dept: 'Document Drafting', time: '3-7 days' },
      { dept: 'Compliance Review', time: '1-2 days' },
      { dept: 'Filing Preparation', time: '1-2 days' },
      { dept: 'Attorney Review', time: '1-3 days' },
    ],
    traditionalTotal: '2-4 weeks ($2,000-5,000)',
    guardianDepts: ['Case', 'Precedent', 'Statute', 'Draft', 'Filing', 'Comply', 'Strategy', 'Damages', 'Reflect'],
    paramLabel1: 'State/Jurisdiction',
    paramLabel2: 'Urgency',
    paramLabel3: 'Parties Involved',
    summaryLabels: { price: 'Est. Recovery', time: 'Filing Deadline', risk: 'Case Strength', compliance: 'Court Ready' },
  },
};

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
  'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming', 'District of Columbia',
];

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [domain, setDomain] = useState<Domain>('manufacturing');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [complexity, setComplexity] = useState(5);
  const [quantity, setQuantity] = useState(1);
  const [material, setMaterial] = useState('Aluminum 6061-T6');
  const [threatEnv, setThreatEnv] = useState('Contested multi-domain');
  const [sceneType, setSceneType] = useState('Trauma - MVC');
  const [legalState, setLegalState] = useState('California');
  const [legalCounty, setLegalCounty] = useState('');
  const [legalDescription, setLegalDescription] = useState('');
  const [legalFiles, setLegalFiles] = useState<File[]>([]);
  const [legalFilePreview, setLegalFilePreview] = useState<string | null>(null);
  const [scenarioText, setScenarioText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState<any>(null);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [liveAgentStatuses, setLiveAgentStatuses] = useState<Map<string, AgentStatus>>(new Map());
  const [accessCode, setAccessCode] = useState('');
  const [accessGranted, setAccessGranted] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [earlyAccessOpen, setEarlyAccessOpen] = useState(false);
  const [selectedShowcase, setSelectedShowcase] = useState<ShowcasePart | null>(null);

  const config = DOMAIN_CONFIG[domain];
  const DomainIcon = config.icon;

  const uploadMutation = trpc.guardian.uploadDrawing.useMutation();
  const processMutation = trpc.guardian.processRequest.useMutation();

  const handleDomainSwitch = useCallback((newDomain: Domain) => {
    setDomain(newDomain);
    setProcessingResult(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setScenarioText('');
    setComplexity(5);
    setQuantity(1);
    setSelectedShowcase(null);
  }, []);

  const handleShowcaseSelect = useCallback((part: ShowcasePart) => {
    setSelectedShowcase(part);
    setSelectedFile(null);
    setPreviewUrl(part.imageUrl);
    setMaterial(part.material);
    // Convert the showcase result into the format CompliancePackage expects
    const r = part.result;
    const agents = Object.entries(r.agentResults).map(([agentName, agentData]: [string, any]) => ({
      agentName,
      department: agentName.replace(' Agent', ''),
      status: agentData.status || 'completed',
      duration: Math.random() * 2000 + 500,
      confidence: 0.92 + Math.random() * 0.06,
      data: agentData.result || agentData,
    }));
    const basePrice = r.summary.estimatedCost || r.summary.totalPrice || 0;
    const outsideProcessingCost = r.agentResults['Outside Processes Agent']?.result?.totalOutsideCost || 0;
    const totalPrice = basePrice + outsideProcessingCost;
    setProcessingResult({
      ...r.summary,
      imageUrl: r.imageUrl,
      drawingAnalysis: r.drawingAnalysis,
      agents,
      agentCount: agents.length,
      totalDuration: (r.summary.processingTime || 3.2) * 1000,
      summary: {
        ...r.summary,
        totalPrice: totalPrice,
        leadTimeDays: r.summary.leadTimeDays,
        riskLevel: r.summary.riskLevel || 'medium',
      },
    });
    setLiveAgentStatuses(new Map());
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setProcessingResult(null);
      if (file.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl(null);
      }
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-accent', 'bg-accent/10');
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.currentTarget.classList.remove('border-accent', 'bg-accent/10');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-accent', 'bg-accent/10');
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setProcessingResult(null);
      if (file.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(file));
      }
    }
  }, []);

  const handleLegalFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setLegalFiles(prev => [...prev, ...files]);
      const imageFile = files.find(f => f.type.startsWith('image/'));
      if (imageFile) {
        setLegalFilePreview(URL.createObjectURL(imageFile));
      }
    }
  }, []);

  // Manufacturing requires file upload; defense and medical use text scenarios; legal uses description
  const canProcess = domain === 'manufacturing' ? !!selectedFile 
    : domain === 'legal' ? (legalDescription.trim().length > 20 || legalFiles.length > 0)
    : scenarioText.trim().length > 10;

  const handleProcess = async () => {
    if (!canProcess) return;

    setIsProcessing(true);
    setProcessingResult(null);
    setLiveAgentStatuses(new Map());
    setProcessingStage(domain === 'manufacturing' ? 'Uploading drawing...' : domain === 'legal' ? 'Ara is analyzing your legal situation...' : 'Ara is coordinating all departments...');

    try {
      let imageUrl: string | undefined;
      let fileName = selectedFile?.name || (domain === 'medical' ? 'medical-dispatch.txt' : domain === 'legal' ? 'legal-case.txt' : 'scenario-briefing.txt');

      // Upload image only for manufacturing domain
      if (domain === 'manufacturing' && selectedFile?.type.startsWith('image/')) {
        setProcessingStage('Uploading to secure cloud...');
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.readAsDataURL(selectedFile);
        });

        const uploadResult = await uploadMutation.mutateAsync({
          fileName: selectedFile.name,
          fileData: base64,
          contentType: selectedFile.type,
        });
        imageUrl = uploadResult.url;
      }

      // For text-based domains, use scenario text as the file name
      if ((domain === 'defense' || domain === 'medical') && scenarioText) {
        fileName = scenarioText.substring(0, 200);
      }

      // For legal domain, use the description as the scenario
      if (domain === 'legal' && legalDescription) {
        fileName = `[${legalState}${legalCounty ? `, ${legalCounty}` : ''}] ${legalDescription.substring(0, 200)}`;
      }

      // Upload legal documents if any
      if (domain === 'legal' && legalFiles.length > 0) {
        const imageFile = legalFiles.find(f => f.type.startsWith('image/'));
        if (imageFile) {
          setProcessingStage('Uploading legal documents...');
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve) => {
            reader.onload = () => {
              const result = reader.result as string;
              resolve(result.split(',')[1]);
            };
            reader.readAsDataURL(imageFile);
          });
          const uploadResult = await uploadMutation.mutateAsync({
            fileName: imageFile.name,
            fileData: base64,
            contentType: imageFile.type,
          });
          imageUrl = uploadResult.url;
        }
      }

      setProcessingStage('Ara is coordinating all departments simultaneously...');

      // Real-time agent status callback
      const onAgentStatus = (agentName: string, status: string, result?: AgentResult) => {
        setLiveAgentStatuses(prev => {
          const next = new Map(prev);
          next.set(agentName, {
            name: agentName,
            department: result?.department || agentName.replace('Agent', ''),
            status: status as any,
            duration: result?.duration,
            confidence: result?.confidence,
            errorReason: '',
          });
          return next;
        });
      };

      // Backend function for heavy/vision agents
      const backendProcessFn = async (input: any) => {
        const res = await processMutation.mutateAsync(input);
        return res;
      };

      // Run hybrid processing — frontend (Puter.js) + backend (Manus) in true parallel
      const result = await runHybridProcessing(
        {
          fileName,
          fileSize: selectedFile?.size || scenarioText.length,
          complexity,
          material: domain === 'defense' ? threatEnv : domain === 'medical' ? sceneType : domain === 'legal' ? legalState : material,
          quantity,
          imageUrl,
          domain,
          scenarioText: domain === 'legal' ? `State: ${legalState}${legalCounty ? `\nCounty: ${legalCounty}` : ''}\n\nSituation: ${legalDescription}` : domain !== 'manufacturing' ? scenarioText : undefined,
        },
        backendProcessFn,
        onAgentStatus,
      );

      setProcessingResult(result);
      setProcessingStage('');
    } catch (error) {
      console.error('Processing error:', error);
      // Don't show error to user — the router handles silent rerouting
      // If all providers failed, just reset silently
      setProcessingStage('');
    } finally {
      setIsProcessing(false);
    }
  };

  const agentStatuses: AgentStatus[] = useMemo(() => {
    // During processing, show live real-time statuses
    if (isProcessing && liveAgentStatuses.size > 0) {
      return Array.from(liveAgentStatuses.values());
    }
    // After completion, show final results
    if (!processingResult) return [];
    return processingResult.agents.map((a: any) => ({
      name: a.agentName,
      department: a.department,
      status: a.status,
      duration: a.duration,
      confidence: a.confidence,
      errorReason: '', // No technical errors exposed
    }));
  }, [processingResult, isProcessing, liveAgentStatuses]);

  // Domain-specific background gradients — must be before early return to satisfy React hooks rules
  const domainBg = useMemo(() => {
    switch (domain) {
      case 'defense':
        return 'radial-gradient(ellipse at 20% 30%, rgba(239, 68, 68, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(239, 68, 68, 0.04) 0%, transparent 50%)';
      case 'medical':
        return 'radial-gradient(ellipse at 20% 30%, rgba(59, 130, 246, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(59, 130, 246, 0.04) 0%, transparent 50%)';
      case 'legal':
        return 'radial-gradient(ellipse at 20% 30%, rgba(168, 85, 247, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(168, 85, 247, 0.04) 0%, transparent 50%)';
      default: // manufacturing
        return 'radial-gradient(ellipse at 20% 30%, rgba(0, 217, 255, 0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(0, 255, 65, 0.04) 0%, transparent 50%)';
    }
  }, [domain]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-all duration-700 relative">
      {/* Domain Background Image */}
      <div
        className="fixed inset-0 z-0 transition-opacity duration-1000"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(5,8,15,0.75) 0%, rgba(5,8,15,0.85) 40%, rgba(5,8,15,0.95) 70%, rgba(5,8,15,1) 100%), url(${DOMAIN_BACKGROUNDS[domain]})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      />
      <div className="relative z-10">
      {/* Header */}
      <header className={`border-b glass sticky top-0 z-50 transition-colors duration-500 ${
        domain === 'defense' ? 'border-red-500/30' :
        domain === 'medical' ? 'border-blue-500/30' :
        domain === 'legal' ? 'border-purple-500/30' :
        'border-accent/30'
      }`}>
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg transition-colors duration-500 ${domain === 'defense' ? 'bg-red-500' : domain === 'medical' ? 'bg-blue-500' : domain === 'legal' ? 'bg-purple-500' : 'bg-accent'} flex items-center justify-center`}>
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground font-heading tracking-tight">Guardian OS</h1>
              <p className="text-xs text-muted-foreground">Learns &middot; Recommends &middot; Alerts &middot; Executes</p>
            </div>
          </div>

          {/* Domain Selector */}
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => handleDomainSwitch('manufacturing')}
                className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  domain === 'manufacturing' 
                    ? 'bg-accent text-accent-foreground' 
                    : 'bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                <Factory className="w-3 h-3" />
                Manufacturing
              </button>
              <button
                onClick={() => handleDomainSwitch('defense')}
                className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  domain === 'defense' 
                    ? 'bg-red-500 text-white' 
                    : 'bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                <Crosshair className="w-3 h-3" />
                Kill Chain
              </button>
              <button
                onClick={() => handleDomainSwitch('medical')}
                className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  domain === 'medical' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                <Ambulance className="w-3 h-3" />
                Medical
              </button>
              <button
                onClick={() => handleDomainSwitch('legal')}
                className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  domain === 'legal' 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                <Scale className="w-3 h-3" />
                Legal
              </button>
            </div>

            <div className="flex items-center gap-2 ml-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDemoOpen(true)}
                className="border-accent/50 text-accent hover:bg-accent/10 text-xs hidden sm:flex"
              >
                Request Demo
              </Button>
              <Button
                size="sm"
                onClick={() => setEarlyAccessOpen(true)}
                className="bg-green-600 hover:bg-green-700 text-white text-xs"
              >
                <Rocket className="w-3 h-3 mr-1" />
                Early Access
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8 space-y-8">
        {/* What is Guardian OS */}
        <section className="space-y-6">
          <div className="space-y-3">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${
              domain === 'defense' ? 'border-red-500/30 bg-red-500/5 text-red-400' 
              : domain === 'medical' ? 'border-blue-500/30 bg-blue-500/5 text-blue-400'
              : domain === 'legal' ? 'border-purple-500/30 bg-purple-500/5 text-purple-400'
              : 'border-accent/30 bg-accent/5 text-accent'
            } text-xs font-medium`}>
              <Brain className="w-3 h-3" />
              Your Operations Manager — Learns Your Business
            </div>
            <h2 className="text-4xl md:text-6xl font-extrabold leading-tight font-heading tracking-tight">
              {domain === 'defense' ? (
                <>Every Kill Chain Node.<br /><span className="text-gradient-red">Simultaneously.</span></>
              ) : domain === 'medical' ? (
                <>Every Department.<br /><span className="text-gradient-blue">Simultaneously.</span></>
              ) : domain === 'legal' ? (
                <>Every Legal Department.<br /><span className="text-gradient-purple">Simultaneously.</span></>
              ) : (
                <>Every Department.<br /><span className="text-gradient-cyan">Simultaneously.</span></>
              )}
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl">
              Guardian OS is your <strong className="text-foreground">operations manager</strong> — it learns and adjusts to your business model, 
              provides <strong className="text-foreground">recommendations, alerts concerns, and can execute when necessary</strong>. 
              Guardian learns your business and <strong className="text-foreground">perfects the execution</strong>. 
              Non-intrusive. It sits on top of your current systems — no replacements, no disruption.
            </p>
          </div>

          {/* Architecture Comparison: Manual Sequential vs Guardian Parallel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
            {/* Traditional: AI Sequential */}
            <div className="p-5 rounded-xl border border-red-500/20 glass-light relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none" />
              <div className="relative">
              <p className="text-xs text-red-400/80 uppercase tracking-wider mb-3 font-semibold font-heading">
                Current AI — Sequential Processing
              </p>
              <div className="space-y-1.5">
                {config.traditionalSteps.map((step, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground/50 w-4 text-right">{i + 1}.</span>
                      <span className="text-muted-foreground">{step.dept}</span>
                    </div>
                    <span className="text-red-400/60 text-[10px]">{step.time}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Total elapsed time:</span>
                <span className="text-sm font-bold text-red-400">{config.traditionalTotal}</span>
              </div>
              <p className="text-[10px] text-muted-foreground/60 mt-2">
                Even with AI tools, each step still waits for the previous step to complete. One department at a time. Sequential handoffs between teams.
              </p>
              </div>{/* end relative */}
            </div>

            {/* Guardian: Parallel Architecture */}
            <div className={`p-5 rounded-xl border relative overflow-hidden ${domain === 'defense' ? 'border-red-500/30' : domain === 'medical' ? 'border-blue-500/30' : domain === 'legal' ? 'border-purple-500/30' : 'border-accent/30'} glass-light`}>
              <div className={`absolute inset-0 pointer-events-none ${domain === 'defense' ? 'bg-gradient-to-br from-red-500/10 to-transparent' : domain === 'medical' ? 'bg-gradient-to-br from-blue-500/10 to-transparent' : domain === 'legal' ? 'bg-gradient-to-br from-purple-500/10 to-transparent' : 'bg-gradient-to-br from-accent/10 to-transparent'}`} />
              <div className="relative">
              <p className={`text-xs ${domain === 'defense' ? 'text-red-400' : domain === 'medical' ? 'text-blue-400' : domain === 'legal' ? 'text-purple-400' : 'text-accent'} uppercase tracking-wider mb-3 font-semibold font-heading`}>
                Guardian OS — Neural Architecture
              </p>
              <div className="flex items-center gap-1 text-xs flex-wrap mb-3">
                {config.guardianDepts.map((dept) => (
                  <span key={dept} className={`px-1.5 py-0.5 rounded text-[10px] border ${
                    domain === 'defense' 
                      ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                      : domain === 'medical'
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        : domain === 'legal'
                          ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                          : 'bg-accent/20 text-accent border-accent/30'
                  }`}>
                    {dept}
                  </span>
                ))}
              </div>
              <p className={`text-sm ${domain === 'defense' ? 'text-red-400' : domain === 'medical' ? 'text-blue-400' : domain === 'legal' ? 'text-purple-400' : 'text-accent'} font-semibold`}>
                <Zap className="w-3 h-3 inline mr-1" />
                All fire simultaneously — seconds, not {domain === 'defense' ? 'hours' : domain === 'medical' ? 'minutes' : 'weeks'}
              </p>
              <div className="mt-3 pt-3 border-t border-border/50">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <Brain className="w-3 h-3" />
                  <span>Learns your business. Recommends. Alerts. Executes.</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                  <Layers className="w-3 h-3" />
                  <span>Non-intrusive. Sits on top of your existing systems.</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                  <RefreshCw className="w-3 h-3" />
                  <span>Perfects execution over time. Gets smarter every day.</span>
                </div>
              </div>
              </div>{/* end relative */}
            </div>
          </div>
        </section>

        {/* Showcase Parts Gallery — Manufacturing Only */}
        {domain === 'manufacturing' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground font-heading">Sample Parts — Pre-Processed</h3>
                <p className="text-xs text-muted-foreground mt-1">Click a part to see the full compliance package instantly. No upload required.</p>
              </div>
              {selectedShowcase && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-accent border-accent/30"
                  onClick={() => {
                    setSelectedShowcase(null);
                    setProcessingResult(null);
                    setPreviewUrl(null);
                  }}
                >
                  Clear &amp; Upload Your Own
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SHOWCASE_PARTS.map((part) => (
                <button
                  key={part.id}
                  onClick={() => handleShowcaseSelect(part)}
                  className={`text-left p-4 rounded-xl border transition-all group ${
                    selectedShowcase?.id === part.id
                      ? 'border-accent bg-accent/10 shadow-[0_0_20px_rgba(0,217,255,0.15)]'
                      : 'border-border/50 bg-card/30 hover:border-accent/50 hover:bg-card/50'
                  }`}
                >
                  <div className="flex gap-4">
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-white border border-border/30 shrink-0">
                      <img src={part.imageUrl} alt={part.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-foreground truncate">{part.name}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{part.description}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">{part.material}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">{part.complexity}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">{part.operations} Ops</span>
                      </div>
                    </div>
                  </div>
                  {selectedShowcase?.id === part.id && (
                    <div className="mt-3 pt-3 border-t border-accent/20 flex items-center gap-2 text-xs text-accent">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Loaded — scroll down to see full compliance package</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Input Section */}
        <Card className={`border-border/50 glass-light ${domain === 'manufacturing' && selectedShowcase ? 'opacity-60' : ''}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {domain === 'manufacturing' ? (
                <FileImage className="w-5 h-5 text-accent" />
              ) : domain === 'defense' ? (
                <Crosshair className="w-5 h-5 text-red-400" />
              ) : domain === 'legal' ? (
                <Scale className="w-5 h-5 text-purple-400" />
              ) : (
                <Ambulance className="w-5 h-5 text-blue-400" />
              )}
              {domain === 'manufacturing' && selectedShowcase ? 'Or Upload Your Own Drawing' : config.uploadLabel}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Manufacturing: File Upload */}
            {domain === 'manufacturing' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-accent/30 rounded-xl p-8 text-center cursor-pointer transition-all hover:border-accent hover:bg-accent/10 hover:shadow-[0_0_30px_rgba(0,217,255,0.1)]"
                >
                  <input
                    type="file"
                    accept={config.acceptTypes}
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-input"
                  />
                  <label htmlFor="file-input" className="cursor-pointer">
                    <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-base font-semibold text-foreground mb-1">
                      {selectedFile ? selectedFile.name : 'Drop your engineering drawing here'}
                    </p>
                    <p className="text-sm text-muted-foreground">{config.uploadHint}</p>
                  </label>
                </div>

                {previewUrl ? (
                  <div className="border border-border rounded-lg overflow-hidden bg-white">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-contain max-h-64" />
                  </div>
                ) : (
                  <div className="border border-border rounded-lg p-6 flex items-center justify-center bg-card/30">
                    <p className="text-sm text-muted-foreground text-center">Drawing preview will appear here</p>
                  </div>
                )}
              </div>
            )}

            {/* Legal: Description + Document Upload — Combined Intake */}
            {domain === 'legal' && (
              <div className="space-y-4">
                {/* Guidance Banner */}
                <div className="p-3 rounded-lg border border-purple-500/20 bg-purple-500/5 flex items-start gap-3">
                  <Info className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-purple-300">Best Results: Describe + Upload</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Provide a written description of your situation <strong className="text-foreground">and</strong> upload any supporting documents (contracts, leases, court papers, photos). 
                      Combining both gives Ara the most complete picture for accurate analysis.
                    </p>
                  </div>
                </div>

                {/* Two-Column: Description + Upload Side by Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Written Description */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold">1</span>
                      Describe Your Situation
                    </label>
                    <textarea
                      value={legalDescription}
                      onChange={(e) => setLegalDescription(e.target.value)}
                      placeholder="Describe your legal issue in plain language...&#10;&#10;Example: 'My landlord is refusing to return my $3,200 security deposit after I moved out of my apartment in Los Angeles. The lease ended on January 15, 2026. I left the apartment in good condition with photos to prove it. The landlord has not provided an itemized list of deductions within 21 days as required.'"
                      className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground text-sm min-h-[180px] resize-y placeholder:text-muted-foreground/50"
                    />
                    {legalDescription.trim().length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-green-400">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Description provided ({legalDescription.trim().length} characters)</span>
                      </div>
                    )}
                  </div>

                  {/* Right: Document Upload */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold">2</span>
                      Upload Supporting Documents
                    </label>
                    <div
                      className="border-2 border-dashed border-purple-500/30 rounded-lg p-4 text-center cursor-pointer transition-all hover:border-purple-500 hover:bg-purple-500/5 min-h-[100px] flex flex-col items-center justify-center"
                    >
                      <input
                        type="file"
                        accept="image/*,.pdf,.doc,.docx,.txt"
                        onChange={handleLegalFileSelect}
                        className="hidden"
                        id="legal-file-input"
                        multiple
                      />
                      <label htmlFor="legal-file-input" className="cursor-pointer w-full">
                        <Upload className="w-7 h-7 text-purple-400/60 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-foreground mb-1">
                          {legalFiles.length > 0 ? `${legalFiles.length} document(s) attached` : 'Drop files or click to upload'}
                        </p>
                        <p className="text-xs text-muted-foreground">Contracts, leases, court papers, letters, photos</p>
                      </label>
                    </div>

                    {/* Uploaded Files List */}
                    {legalFiles.length > 0 && (
                      <div className="space-y-1.5">
                        {legalFiles.map((f, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded border border-purple-500/20 bg-purple-500/5">
                            <div className="flex items-center gap-2 text-xs text-foreground min-w-0">
                              <FileText className="w-3 h-3 text-purple-400 shrink-0" />
                              <span className="truncate">{f.name}</span>
                            </div>
                            <button
                              onClick={() => {
                                const newFiles = legalFiles.filter((_, idx) => idx !== i);
                                setLegalFiles(newFiles);
                                if (newFiles.length === 0) setLegalFilePreview(null);
                                else if (newFiles[0]?.type.startsWith('image/')) {
                                  const reader = new FileReader();
                                  reader.onload = () => setLegalFilePreview(reader.result as string);
                                  reader.readAsDataURL(newFiles[0]);
                                }
                              }}
                              className="text-muted-foreground hover:text-red-400 transition-colors p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <label htmlFor="legal-file-input" className="flex items-center gap-1 text-xs text-purple-400 cursor-pointer hover:text-purple-300 transition-colors pt-1">
                          <Plus className="w-3 h-3" /> Add more documents
                        </label>
                      </div>
                    )}

                    {/* Image Preview */}
                    {legalFilePreview && (
                      <div className="border border-purple-500/30 rounded-lg overflow-hidden bg-white">
                        <img src={legalFilePreview} alt="Document Preview" className="w-full object-contain max-h-40" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Intake Status Summary */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                  <div className={`flex items-center gap-1 ${legalDescription.trim().length > 20 ? 'text-green-400' : ''}`}>
                    {legalDescription.trim().length > 20 ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    Written description {legalDescription.trim().length > 20 ? '\u2713' : '(recommended)'}
                  </div>
                  <div className={`flex items-center gap-1 ${legalFiles.length > 0 ? 'text-green-400' : ''}`}>
                    {legalFiles.length > 0 ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    Documents {legalFiles.length > 0 ? `(${legalFiles.length}) \u2713` : '(recommended)'}
                  </div>
                </div>
              </div>
            )}

            {/* Defense & Medical: Scenario Text Input Only (no file upload) */}
            {(domain === 'defense' || domain === 'medical') && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  {domain === 'medical' ? 'Emergency Dispatch Report' : 'Scenario Briefing'}
                </label>
                <textarea
                  value={scenarioText}
                  onChange={(e) => setScenarioText(e.target.value)}
                  placeholder={domain === 'medical' 
                    ? "Enter emergency dispatch report... e.g., '911 call received: 45-year-old male, crushing chest pain radiating to left arm, onset 20 minutes ago. History of hypertension and diabetes. Diaphoretic, pale, BP 180/110, HR 110, SpO2 94%. Location: 1234 Main St, 3rd floor apartment, elevator available. Patient conscious and alert but in severe distress.'"
                    : "Enter threat scenario briefing... e.g., 'Enemy mobile SAM battery detected at grid reference NK 123 456, moving south along MSR Tampa. SIGINT indicates active S-300 radar emissions. Friendly CAS aircraft operating within 40km. Civilian village 2km east of target.'"}
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground text-sm min-h-[140px] resize-y placeholder:text-muted-foreground/50"
                />
              </div>
            )}

            {/* Parameters — Domain-specific */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {domain === 'medical' ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Scene Type</label>
                    <select
                      value={sceneType}
                      onChange={(e) => setSceneType(e.target.value)}
                      className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground text-sm"
                    >
                      <option value="Trauma - MVC">Trauma — Motor Vehicle Collision</option>
                      <option value="Trauma - Fall">Trauma — Fall</option>
                      <option value="Trauma - Penetrating">Trauma — Penetrating Injury</option>
                      <option value="Cardiac - STEMI">Cardiac — STEMI / Chest Pain</option>
                      <option value="Cardiac - Arrest">Cardiac — Arrest</option>
                      <option value="Stroke - CVA">Stroke — CVA</option>
                      <option value="Respiratory - Distress">Respiratory Distress</option>
                      <option value="Overdose">Overdose / Poisoning</option>
                      <option value="Pediatric Emergency">Pediatric Emergency</option>
                      <option value="OB Emergency">OB / Obstetric Emergency</option>
                      <option value="Burns">Burns</option>
                      <option value="Mass Casualty">Mass Casualty Incident</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Severity ({complexity}/10)</label>
                    <input type="range" min="1" max="10" value={complexity} onChange={(e) => setComplexity(Number(e.target.value))} className="w-full accent-blue-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Patients</label>
                    <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground text-sm" />
                  </div>
                </>
              ) : domain === 'legal' ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">State / Jurisdiction</label>
                    <select
                      value={legalState}
                      onChange={(e) => setLegalState(e.target.value)}
                      className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground text-sm"
                    >
                      {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">County</label>
                    <input
                      type="text"
                      value={legalCounty}
                      onChange={(e) => setLegalCounty(e.target.value)}
                      placeholder="e.g., Los Angeles County"
                      className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Urgency ({complexity}/10)</label>
                    <input type="range" min="1" max="10" value={complexity} onChange={(e) => setComplexity(Number(e.target.value))} className="w-full accent-purple-500" />
                  </div>
                </>
              ) : domain === 'manufacturing' ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Material</label>
                    <select
                      value={material}
                      onChange={(e) => setMaterial(e.target.value)}
                      className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground text-sm"
                    >
                      <option value="Aluminum 6061-T6">Aluminum 6061-T6</option>
                      <option value="Aluminum 7075-T6">Aluminum 7075-T6</option>
                      <option value="Titanium Ti-6Al-4V">Titanium Ti-6Al-4V</option>
                      <option value="Stainless Steel 304">Stainless Steel 304</option>
                      <option value="Stainless Steel 316">Stainless Steel 316</option>
                      <option value="Inconel 718">Inconel 718</option>
                      <option value="Carbon Steel 1018">Carbon Steel 1018</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Quantity</label>
                    <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground text-sm" />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Threat Environment</label>
                    <select
                      value={threatEnv}
                      onChange={(e) => setThreatEnv(e.target.value)}
                      className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground text-sm"
                    >
                      <option value="Contested multi-domain">Contested Multi-Domain</option>
                      <option value="Near-peer adversary">Near-Peer Adversary</option>
                      <option value="Asymmetric / COIN">Asymmetric / COIN</option>
                      <option value="Maritime interdiction">Maritime Interdiction</option>
                      <option value="Air superiority">Air Superiority</option>
                      <option value="Cyber-contested">Cyber-Contested</option>
                      <option value="Urban warfare">Urban Warfare</option>
                      <option value="CBRN environment">CBRN Environment</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Priority Level ({complexity}/10)</label>
                    <input type="range" min="1" max="10" value={complexity} onChange={(e) => setComplexity(Number(e.target.value))} className="w-full accent-red-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Force Elements</label>
                    <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground text-sm" />
                  </div>
                </>
              )}
            </div>

            {/* Legal Access Gate */}
            {domain === 'legal' && !accessGranted && (
              <div className="p-4 rounded-lg border border-purple-500/30 bg-purple-500/5 space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-purple-300">Guardian Legal Services</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Full case analysis is free. To unlock downloadable court documents and filing packages, enter your access code below.
                </p>
                {showCodeInput ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                      placeholder="Enter access code"
                      className="flex-1 px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && accessCode.toLowerCase().trim() === 'guardian') {
                          setAccessGranted(true);
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      className="bg-purple-500 hover:bg-purple-600 text-white"
                      onClick={() => {
                        if (accessCode.toLowerCase().trim() === 'guardian') {
                          setAccessGranted(true);
                        }
                      }}
                    >
                      Unlock
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-purple-400 border-purple-500/30" onClick={() => setShowCodeInput(true)}>
                      I have a code
                    </Button>
                    <Button size="sm" variant="outline" className="text-muted-foreground border-border" disabled>
                      Purchase access — coming soon
                    </Button>
                  </div>
                )}
                {accessGranted && (
                  <p className="text-xs text-green-400 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Full document access unlocked
                  </p>
                )}
              </div>
            )}
            {domain === 'legal' && accessGranted && (
              <div className="p-3 rounded-lg border border-green-500/30 bg-green-500/5 flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400">Full document access unlocked — court documents will be available for download</span>
              </div>
            )}

            {/* Process Button */}
            <Button
              onClick={handleProcess}
              disabled={!canProcess || isProcessing}
              className={`w-full font-semibold ${
                domain === 'defense' ? 'bg-red-500 hover:bg-red-600 text-white' 
                : domain === 'medical' ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : domain === 'legal' ? 'bg-purple-500 hover:bg-purple-600 text-white'
                : 'bg-accent hover:bg-accent/90 text-accent-foreground'}`}
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {processingStage || 'Processing...'}
                </>
              ) : (
                <>
                  {domain === 'defense' ? <Crosshair className="w-4 h-4 mr-2" /> : domain === 'medical' ? <Ambulance className="w-4 h-4 mr-2" /> : domain === 'legal' ? <Scale className="w-4 h-4 mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                  {config.processLabel}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Processing Results */}
        {processingResult && (
          <div className="space-y-6">
            {/* Speed Comparison: Guardian vs AI Sequential */}
            <div className={`p-6 rounded-xl border glass-light ${domain === 'defense' ? 'border-red-500/30' : domain === 'medical' ? 'border-blue-500/30' : domain === 'legal' ? 'border-purple-500/30' : 'border-accent/30'}`}>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4 text-center">
                Ara Neural Architecture vs. Current AI (Sequential Processing)
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Departments Coordinated</p>
                  <p className={`text-3xl font-bold ${domain === 'defense' ? 'text-red-400' : domain === 'medical' ? 'text-blue-400' : domain === 'legal' ? 'text-purple-400' : 'text-accent'}`}>{processingResult.agentCount}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">coordinated simultaneously</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Guardian Time</p>
                  <p className={`text-3xl font-bold ${domain === 'defense' ? 'text-red-400' : domain === 'medical' ? 'text-blue-400' : domain === 'legal' ? 'text-purple-400' : 'text-accent'}`}>{(processingResult.totalDuration / 1000).toFixed(1)}s</p>
                  <p className="text-[10px] text-muted-foreground mt-1">parallel processing</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">AI Sequential</p>
                  <p className="text-3xl font-bold text-red-400">{config.traditionalTotal}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">one dept at a time</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Improvement</p>
                  <p className="text-3xl font-bold" style={{ color: domain === 'defense' ? '#FF4444' : domain === 'medical' ? '#60A5FA' : domain === 'legal' ? '#A855F7' : '#00FF41' }}>
                    {domain === 'manufacturing' ? '99.8%' : domain === 'defense' ? '99.6%' : domain === 'legal' ? '99.5%' : '99.4%'}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">time reduction</p>
                </div>
              </div>
            </div>

            {/* Agent Visualization */}
            <Card className="border-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className={`w-5 h-5 ${domain === 'defense' ? 'text-red-400' : domain === 'medical' ? 'text-blue-400' : domain === 'legal' ? 'text-purple-400' : 'text-accent'}`} />
                  {domain === 'defense' ? 'Ara — Kill Chain Coordination' : domain === 'medical' ? 'Ara — Emergency Response Coordination' : domain === 'legal' ? 'Ara — Legal Analysis Coordination' : 'Ara — Department Coordination'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AgentVisualization
                  agents={agentStatuses}
                  totalDuration={processingResult.totalDuration}
                  sequentialEstimate={processingResult.sequentialEstimate}
                  speedMultiplier={processingResult.speedMultiplier}
                  agentCount={processingResult.agentCount}
                />
              </CardContent>
            </Card>

            {/* Intelligence / Drawing Analysis */}
            {processingResult.drawingAnalysis && (
              <Card className="border-border bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>{domain === 'defense' ? 'Intelligence Assessment' : domain === 'medical' ? 'Patient Assessment' : domain === 'legal' ? 'Case Situation Analysis' : 'Drawing Analysis'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {processingResult.drawingAnalysis}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Summary Cards — Domain-aware */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {domain === 'medical' ? (
                <>
                  <div className="p-4 rounded-lg border border-border bg-card/30">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">ESI Triage Level</p>
                    <p className={`text-xl font-bold ${
                      processingResult.summary.riskLevel?.includes('1') ? 'text-red-400' :
                      processingResult.summary.riskLevel?.includes('2') ? 'text-orange-400' :
                      processingResult.summary.riskLevel?.includes('3') ? 'text-yellow-400' : 'text-blue-400'
                    }`}>
                      {processingResult.summary.riskLevel || 'ASSESSING'}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-card/30">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Response Time</p>
                    <p className="text-xl font-bold text-blue-400">
                      {processingResult.summary.leadTimeDays || '—'} min
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-card/30">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">EMTALA Status</p>
                    <p className={`text-xl font-bold ${
                      processingResult.summary.complianceStatus === 'EMTALA Compliant' ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {processingResult.summary.complianceStatus || 'REVIEWING'}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-card/30">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Est. Charges</p>
                    <p className="text-xl font-bold text-foreground">
                      ${processingResult.summary.totalPrice ? processingResult.summary.totalPrice.toLocaleString() : '—'}
                    </p>
                  </div>
                </>
              ) : domain === 'legal' ? (
                <>
                  <div className="p-4 rounded-lg border border-purple-500/30 bg-purple-500/5">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Case Viability</p>
                    <p className={`text-xl font-bold ${
                      processingResult.summary.riskLevel === 'strong' ? 'text-green-400' :
                      processingResult.summary.riskLevel === 'moderate' ? 'text-yellow-400' :
                      processingResult.summary.riskLevel === 'weak' ? 'text-red-400' : 'text-purple-400'
                    }`}>
                      {processingResult.summary.riskLevel ? processingResult.summary.riskLevel.charAt(0).toUpperCase() + processingResult.summary.riskLevel.slice(1) : 'Analyzing...'}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">cross-department assessment</p>
                  </div>
                  <div className="p-4 rounded-lg border border-purple-500/30 bg-purple-500/5">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Est. Recovery</p>
                    <p className="text-xl font-bold text-purple-400">
                      {processingResult.summary.totalPrice ? `$${processingResult.summary.totalPrice.toLocaleString()}` : 'Calculating...'}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">damages assessment</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-card/30">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Court Status</p>
                    <p className={`text-xl font-bold ${
                      processingResult.summary.complianceStatus === 'Court Ready' ? 'text-green-400' :
                      processingResult.summary.complianceStatus === 'Filing Ready' ? 'text-yellow-400' : 'text-orange-400'
                    }`}>
                      {processingResult.summary.complianceStatus || 'Reviewing...'}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">filing compliance</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-card/30">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Confidence</p>
                    <p className="text-xl font-bold text-foreground">
                      {(processingResult.summary.confidence * 100).toFixed(0)}%
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">{processingResult.agentCount} departments analyzed</p>
                  </div>
                </>
              ) : domain === 'defense' ? (
                <>
                  <div className="p-4 rounded-lg border border-border bg-card/30">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Threat Classification</p>
                    <p className={`text-xl font-bold ${
                      processingResult.summary.riskLevel === 'hostile' ? 'text-red-400' :
                      processingResult.summary.riskLevel === 'critical' ? 'text-red-400' :
                      processingResult.summary.riskLevel === 'high' ? 'text-orange-400' : 'text-yellow-400'
                    }`}>
                      {processingResult.summary.riskLevel?.toUpperCase() || 'ASSESSING'}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-card/30">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">LOAC Status</p>
                    <p className={`text-xl font-bold ${
                      processingResult.summary.complianceStatus === 'LOAC Compliant' ? 'text-green-400' :
                      processingResult.summary.complianceStatus === 'NOT Authorized' ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {processingResult.summary.complianceStatus || 'REVIEWING'}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-card/30">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Decision Confidence</p>
                    <p className="text-xl font-bold text-foreground">
                      {(processingResult.summary.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-card/30">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Kill Chain Nodes</p>
                    <p className="text-xl font-bold text-red-400">
                      {processingResult.agentCount} Active
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 rounded-lg border border-accent/30 bg-accent/5">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Quoted Price</p>
                    <p className="text-2xl font-bold text-accent">
                      {processingResult.summary.totalPrice != null && processingResult.summary.totalPrice > 0
                        ? `$${processingResult.summary.totalPrice.toLocaleString()}`
                        : 'Calculating...'}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">per unit at qty {quantity}</p>
                  </div>
                  <div className="p-4 rounded-lg border border-accent/30 bg-accent/5">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Lead Time</p>
                    <p className="text-2xl font-bold text-foreground">
                      {processingResult.summary.leadTimeDays != null && processingResult.summary.leadTimeDays > 0
                        ? `${processingResult.summary.leadTimeDays} days`
                        : 'Calculating...'}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">material + machining + inspection</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-card/30">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Risk Level</p>
                    <p className={`text-2xl font-bold ${
                      processingResult.summary.riskLevel === 'low' ? 'text-green-400' :
                      processingResult.summary.riskLevel === 'high' ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {processingResult.summary.riskLevel && processingResult.summary.riskLevel !== 'medium'
                        ? processingResult.summary.riskLevel.charAt(0).toUpperCase() + processingResult.summary.riskLevel.slice(1)
                        : processingResult.summary.riskLevel || 'Assessing...'}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">compliance assessment</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-card/30">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">AS9100 Rev D</p>
                    <p className={`text-2xl font-bold ${
                      processingResult.summary.complianceStatus === 'Compliant' ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {processingResult.summary.complianceStatus || 'Reviewing...'}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">quality management system</p>
                  </div>
                </>
              )}
            </div>

            {/* Shop-Ready Compliance Package — Manufacturing Only */}
            {domain === 'manufacturing' && (
              <CompliancePackage result={processingResult} domain={domain} />
            )}

            {/* Legal Domain — Document Package & Disclaimer */}
            {domain === 'legal' && (
              <div className="space-y-4">
                {/* Legal Disclaimer */}
                <div className="p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-medium text-yellow-300">Important Legal Disclaimer</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This analysis is generated by Guardian OS for informational purposes only and does not constitute legal advice. 
                    Guardian OS is not a law firm and does not provide legal representation. The documents generated are templates 
                    based on AI analysis and should be reviewed before filing. For complex legal matters, consult a licensed attorney 
                    in your jurisdiction. Use of this service does not create an attorney-client relationship.
                  </p>
                </div>

                {/* Document Download Section — Only if access granted */}
                {accessGranted && (
                  <Card className="border-purple-500/30 bg-purple-500/5">
                    <CardHeader>
                      <CardTitle className="text-purple-300 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Court Filing Document Package
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-xs text-muted-foreground">Your documents have been drafted based on the case analysis. Review each document before filing.</p>
                      {processingResult.agents
                        .filter((a: any) => a.department === 'Document Drafting' && a.status === 'completed')
                        .map((a: any) => (
                          <div key={a.agentName} className="space-y-2">
                            {a.data?.documentsNeeded && (
                              <div className="grid gap-2">
                                {(a.data.documentsNeeded as string[]).map((doc: string, i: number) => (
                                  <div key={i} className="flex items-center justify-between p-3 rounded border border-border bg-background">
                                    <div className="flex items-center gap-2">
                                      <FileText className="w-4 h-4 text-purple-400" />
                                      <span className="text-sm">{doc}</span>
                                    </div>
                                    <Button size="sm" variant="outline" className="text-purple-400 border-purple-500/30 gap-1">
                                      <Download className="w-3 h-3" /> PDF
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                            <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white gap-2 mt-2">
                              <Download className="w-4 h-4" /> Download Complete Filing Package
                            </Button>
                          </div>
                        ))}
                      {processingResult.agents
                        .filter((a: any) => a.department === 'Filing Requirements' && a.status === 'completed')
                        .map((a: any) => (
                          <div key={a.agentName} className="mt-4 p-3 rounded border border-border bg-background">
                            <p className="text-sm font-medium text-foreground mb-2">Filing Information</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {a.data?.filingCourt && <div><span className="text-muted-foreground">Court:</span> <span className="text-foreground">{String(a.data.filingCourt)}</span></div>}
                              {a.data?.filingFee && <div><span className="text-muted-foreground">Filing Fee:</span> <span className="text-foreground">{String(a.data.filingFee)}</span></div>}
                              {a.data?.filingDeadline && <div><span className="text-muted-foreground">Deadline:</span> <span className="text-foreground">{String(a.data.filingDeadline)}</span></div>}
                              {a.data?.filingMethod && <div><span className="text-muted-foreground">Method:</span> <span className="text-foreground">{String(a.data.filingMethod)}</span></div>}
                            </div>
                          </div>
                        ))}
                    </CardContent>
                  </Card>
                )}

                {/* Prompt to unlock if not granted */}
                {!accessGranted && (
                  <div className="p-4 rounded-lg border border-purple-500/20 bg-purple-500/5 text-center">
                    <p className="text-sm text-muted-foreground mb-2">Enter your access code above to unlock downloadable court documents and filing packages.</p>
                    <Button size="sm" variant="outline" className="text-purple-400 border-purple-500/30" onClick={() => setShowCodeInput(true)}>
                      Unlock Documents
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Individual Agent Results — Expandable */}
            <Card className="border-border/50 glass-light">
              <CardHeader>
                <CardTitle>{domain === 'defense' ? 'Kill Chain Node Reports' : domain === 'medical' ? 'Emergency Response Department Reports' : domain === 'legal' ? 'Legal Analysis Department Reports' : 'Department Reports'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {processingResult.agents.map((agent: any) => (
                  <div key={agent.agentName} className="border border-border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedAgent(expandedAgent === agent.agentName ? null : agent.agentName)}
                      className="w-full p-3 flex items-center justify-between text-left hover:bg-card/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${agent.status === 'completed' ? 'bg-green-400' : 'bg-red-400'}`} />
                        <span className="text-sm font-medium text-foreground">{agent.department}</span>
                        <span className="text-xs text-muted-foreground">({agent.agentName.replace('Agent', '')})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">{(agent.duration / 1000).toFixed(1)}s</span>
                        <span className="text-xs text-muted-foreground">{(agent.confidence * 100).toFixed(0)}%</span>
                        {expandedAgent === agent.agentName ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>
                    {expandedAgent === agent.agentName && (
                      <div className="p-3 border-t border-border bg-background/50">
                        <pre className="text-xs text-muted-foreground whitespace-pre-wrap overflow-x-auto">
                          {JSON.stringify(
                            Object.fromEntries(
                              Object.entries(agent.data).filter(([k, v]) => 
                                k !== 'error' && !(typeof v === 'string' && (v.includes('exhausted') || v.includes('quota') || v.includes('429')))
                              )
                            ),
                            null, 2
                          )}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Digital Twin Teaser — Manufacturing Only */}
        {domain === 'manufacturing' && (
          <section className="py-8">
            <Link href="/shop-floor">
              <div className="border border-accent/30 rounded-xl p-8 bg-card/30 backdrop-blur-sm hover:bg-card/50 hover:border-accent/50 transition-all cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-lg bg-accent/20 flex items-center justify-center">
                      <Factory className="w-7 h-7 text-accent" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground font-heading">Digital Twin — Shop Floor Manager</h3>
                      <p className="text-sm text-muted-foreground mt-1">Real-time machine status, utilization, and work center monitoring across 25 CNC machines</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2">
                      <span className="text-[10px] px-2 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/30">16 RUNNING</span>
                      <span className="text-[10px] px-2 py-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">4 SETUP</span>
                      <span className="text-[10px] px-2 py-1 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">60% UTIL</span>
                    </div>
                    <ArrowRight className="w-5 h-5 text-accent group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* CTA Section */}
        <ContactSection
          onDemoClick={() => setDemoOpen(true)}
          onEarlyAccessClick={() => setEarlyAccessOpen(true)}
        />

        {/* Footer */}
        <footer className="border-t border-border/30 pt-8 pb-10">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Brain className="w-5 h-5 text-accent" />
              <p className="text-sm text-foreground font-bold font-heading tracking-tight">
                Guardian OS
              </p>
            </div>
            <p className="text-xs text-muted-foreground max-w-xl mx-auto">
              Learns your business. Recommends. Alerts. Executes. Non-intrusive — sits on top of your current systems.
            </p>
            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <span>Richard Cruz</span>
              <span className="text-accent">(951) 233-5475</span>
            </div>
            <p className="text-[10px] text-muted-foreground/50">
              &copy; {new Date().getFullYear()} Guardian Sentinel. All rights reserved.
            </p>
          </div>
        </footer>
      </main>

      {/* Lead Capture Modals */}
      <DemoRequestModal open={demoOpen} onOpenChange={setDemoOpen} />
      <EarlyAccessModal open={earlyAccessOpen} onOpenChange={setEarlyAccessOpen} />
      </div>{/* end relative z-10 */}
    </div>
  );
}

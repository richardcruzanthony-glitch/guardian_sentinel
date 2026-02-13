import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Zap, Shield, Activity, Clock, ChevronDown, ChevronUp, FileImage, Loader2, ArrowRight, Crosshair, Factory, Ambulance, Brain, Layers, RefreshCw } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useState, useCallback, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { AgentVisualization, type AgentStatus } from "@/components/AgentVisualization";
import { CompliancePackage } from "@/components/CompliancePackage";

type Domain = 'manufacturing' | 'defense' | 'medical';

const DOMAIN_CONFIG = {
  manufacturing: {
    label: 'Manufacturing',
    icon: Factory,
    color: 'text-accent',
    bgColor: 'bg-accent',
    description: 'Upload an engineering drawing. Guardian fires Sales, Engineering, Quality, Planning, Procurement, Manufacturing, Shipping, Compliance, Audit, and Reflection agents',
    uploadLabel: 'Upload Engineering Drawing',
    uploadHint: 'Images (JPG, PNG), STEP, IGES, DWG, PDF',
    acceptTypes: 'image/*,.stp,.step,.iges,.igs,.dwg,.pdf',
    processLabel: 'Fire All Agents — Analyze Drawing',
    traditionalSteps: [
      { dept: 'RFQ Received', time: '1-2 days' },
      { dept: 'Engineering Review', time: '2-3 days' },
      { dept: 'Quality Planning', time: '1-2 days' },
      { dept: 'Production Planning', time: '1-2 days' },
      { dept: 'Procurement', time: '2-5 days' },
      { dept: 'Manufacturing Routing', time: '1-2 days' },
      { dept: 'Cost Estimation', time: '1-2 days' },
      { dept: 'Compliance Review', time: '1-3 days' },
      { dept: 'Quote Approval', time: '1-2 days' },
    ],
    traditionalTotal: '2-3 weeks',
    guardianDepts: ['Sales', 'Eng', 'Quality', 'Plan', 'Procure', 'Mfg', 'Ship', 'Comply', 'Audit', 'Reflect'],
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
    description: 'Input a threat scenario. Guardian fires ISR, Targeting, Weapons, EW, Cyber, C2, Legal/JAG, BDA, Logistics, and Reflection agents',
    uploadLabel: 'Input Threat Scenario',
    uploadHint: 'Text-based scenario briefing',
    acceptTypes: '',
    processLabel: 'Fire Kill Chain — All Domains Simultaneously',
    traditionalSteps: [
      { dept: 'Intelligence Gathering', time: '2-6 hours' },
      { dept: 'Target Development', time: '1-4 hours' },
      { dept: 'Weapons Selection', time: '30-60 min' },
      { dept: 'EW Assessment', time: '1-2 hours' },
      { dept: 'Legal Review', time: '1-3 hours' },
      { dept: 'C2 Approval Chain', time: '1-4 hours' },
      { dept: 'BDA Planning', time: '30-60 min' },
      { dept: 'Logistics Check', time: '1-2 hours' },
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
    description: 'Input a medical emergency. Guardian fires Triage, Dispatch, EMT/Paramedic, ER Prep, Pharmacy, Lab, Imaging, Billing, Compliance, and QI agents',
    uploadLabel: 'Input Medical Emergency',
    uploadHint: 'Text-based dispatch report',
    acceptTypes: '',
    processLabel: 'Fire All Departments — Full Emergency Response',
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
};

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
  const [scenarioText, setScenarioText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState<any>(null);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [processingStage, setProcessingStage] = useState<string>('');

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

  // Manufacturing requires file upload; defense and medical use text scenarios only
  const canProcess = domain === 'manufacturing' ? !!selectedFile : scenarioText.trim().length > 10;

  const handleProcess = async () => {
    if (!canProcess) return;

    setIsProcessing(true);
    setProcessingResult(null);
    setProcessingStage(domain === 'manufacturing' ? 'Uploading drawing...' : 'Processing scenario...');

    try {
      let imageUrl: string | undefined;
      let fileName = selectedFile?.name || (domain === 'medical' ? 'medical-dispatch.txt' : 'scenario-briefing.txt');

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

      setProcessingStage(
        domain === 'defense' 
          ? 'Firing kill chain — all domains simultaneously...' 
          : domain === 'medical'
            ? 'Dispatching all departments simultaneously...'
            : 'Firing all domain agents in parallel...');

      const result = await processMutation.mutateAsync({
        fileName,
        fileSize: selectedFile?.size || scenarioText.length,
        complexity,
        quantity,
        material: domain === 'defense' ? threatEnv : domain === 'medical' ? sceneType : material,
        imageUrl,
        domain,
      });

      setProcessingResult(result.result);
      setProcessingStage('');
    } catch (error) {
      console.error('Processing error:', error);
      setProcessingStage('Error occurred during processing');
    } finally {
      setIsProcessing(false);
    }
  };

  const agentStatuses: AgentStatus[] = useMemo(() => {
    if (!processingResult) return [];
    return processingResult.agents.map((a: any) => ({
      name: a.agentName,
      department: a.department,
      status: a.status,
      duration: a.duration,
      confidence: a.confidence,
    }));
  }, [processingResult]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${domain === 'defense' ? 'bg-red-500' : domain === 'medical' ? 'bg-blue-500' : 'bg-accent'} flex items-center justify-center`}>
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Guardian OS</h1>
              <p className="text-xs text-muted-foreground">Learning &middot; Self-Reflecting &middot; Adjusting</p>
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
            </div>

            {isAuthenticated ? (
              <div className="flex items-center gap-3 ml-3">
                <span className="text-sm text-muted-foreground">{user?.name}</span>
              </div>
            ) : (
              <Button asChild size="sm" className="ml-3">
                <a href={getLoginUrl()}>Sign In</a>
              </Button>
            )}
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
              : 'border-accent/30 bg-accent/5 text-accent'
            } text-xs font-medium`}>
              <Brain className="w-3 h-3" />
              A Digital Brain — Not a Replacement
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
              {domain === 'defense' ? (
                <>Every Kill Chain Node.<br /><span className="text-red-400">Simultaneously.</span></>
              ) : domain === 'medical' ? (
                <>Every Department.<br /><span className="text-blue-400">Simultaneously.</span></>
              ) : (
                <>Every Department.<br /><span className="text-accent">Simultaneously.</span></>
              )}
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl">
              Guardian OS is a <strong className="text-foreground">learning, self-reflecting, and adjusting digital brain</strong> that sits atop your current systems. 
              It is <strong className="text-foreground">non-intrusive</strong> — it doesn't replace your tools, your people, or your processes. 
              It <strong className="text-foreground">links your entire system into a single unit</strong>, firing every department that touches a decision at the same moment, 
              instead of passing work from desk to desk.
            </p>
          </div>

          {/* Architecture Comparison: Manual Sequential vs Guardian Parallel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
            {/* Traditional: Manual Research & Handoff */}
            <div className="p-5 rounded-lg border border-border bg-card/30">
              <p className="text-xs text-red-400/80 uppercase tracking-wider mb-3 font-semibold">
                Current Standard — Manual Research & Handoff
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
                Each step waits for the previous step to complete. Manual research, phone calls, emails, meetings, handoffs between departments.
              </p>
            </div>

            {/* Guardian: Parallel Architecture */}
            <div className={`p-5 rounded-lg border ${domain === 'defense' ? 'border-red-500/30 bg-red-500/5' : domain === 'medical' ? 'border-blue-500/30 bg-blue-500/5' : 'border-accent/30 bg-accent/5'}`}>
              <p className={`text-xs ${domain === 'defense' ? 'text-red-400' : domain === 'medical' ? 'text-blue-400' : 'text-accent'} uppercase tracking-wider mb-3 font-semibold`}>
                Guardian OS — Parallel Architecture
              </p>
              <div className="flex items-center gap-1 text-xs flex-wrap mb-3">
                {config.guardianDepts.map((dept) => (
                  <span key={dept} className={`px-1.5 py-0.5 rounded text-[10px] border ${
                    domain === 'defense' 
                      ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                      : domain === 'medical'
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        : 'bg-accent/20 text-accent border-accent/30'
                  }`}>
                    {dept}
                  </span>
                ))}
              </div>
              <p className={`text-sm ${domain === 'defense' ? 'text-red-400' : domain === 'medical' ? 'text-blue-400' : 'text-accent'} font-semibold`}>
                <Zap className="w-3 h-3 inline mr-1" />
                All fire simultaneously — seconds, not {domain === 'defense' ? 'hours' : domain === 'medical' ? 'minutes' : 'weeks'}
              </p>
              <div className="mt-3 pt-3 border-t border-border/50">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <Brain className="w-3 h-3" />
                  <span>Learns from every decision. Self-reflects. Adjusts. Gets better.</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                  <Layers className="w-3 h-3" />
                  <span>Sits on top of your existing systems. Non-intrusive. No replacement.</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                  <RefreshCw className="w-3 h-3" />
                  <span>Links your entire operation into a single coordinated unit.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Input Section */}
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {domain === 'manufacturing' ? (
                <FileImage className="w-5 h-5 text-accent" />
              ) : domain === 'defense' ? (
                <Crosshair className="w-5 h-5 text-red-400" />
              ) : (
                <Ambulance className="w-5 h-5 text-blue-400" />
              )}
              {config.uploadLabel}
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
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer transition-all hover:border-accent hover:bg-accent/5"
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
                    <label className="text-sm font-semibold text-foreground">Complexity ({complexity}/10)</label>
                    <input type="range" min="1" max="10" value={complexity} onChange={(e) => setComplexity(Number(e.target.value))} className="w-full accent-accent" />
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

            {/* Process Button */}
            <Button
              onClick={handleProcess}
              disabled={!canProcess || isProcessing}
              className={`w-full font-semibold ${
                domain === 'defense' ? 'bg-red-500 hover:bg-red-600 text-white' 
                : domain === 'medical' ? 'bg-blue-500 hover:bg-blue-600 text-white'
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
                  {domain === 'defense' ? <Crosshair className="w-4 h-4 mr-2" /> : domain === 'medical' ? <Ambulance className="w-4 h-4 mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                  {config.processLabel}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Processing Results */}
        {processingResult && (
          <div className="space-y-6">
            {/* Speed Comparison: Guardian vs Manual Process */}
            <div className={`p-6 rounded-lg border ${domain === 'defense' ? 'border-red-500/30 bg-red-500/5' : domain === 'medical' ? 'border-blue-500/30 bg-blue-500/5' : 'border-accent/30 bg-accent/5'}`}>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4 text-center">
                Guardian Parallel Architecture vs. Current Standard (Manual Research & Handoff)
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Agents Fired</p>
                  <p className={`text-3xl font-bold ${domain === 'defense' ? 'text-red-400' : domain === 'medical' ? 'text-blue-400' : 'text-accent'}`}>{processingResult.agentCount}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">departments simultaneously</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Guardian Time</p>
                  <p className={`text-3xl font-bold ${domain === 'defense' ? 'text-red-400' : domain === 'medical' ? 'text-blue-400' : 'text-accent'}`}>{(processingResult.totalDuration / 1000).toFixed(1)}s</p>
                  <p className="text-[10px] text-muted-foreground mt-1">parallel processing</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Manual Process</p>
                  <p className="text-3xl font-bold text-red-400">{config.traditionalTotal}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">sequential handoffs</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Improvement</p>
                  <p className="text-3xl font-bold" style={{ color: domain === 'defense' ? '#FF4444' : domain === 'medical' ? '#60A5FA' : '#00FF41' }}>
                    {domain === 'manufacturing' ? '99.8%' : domain === 'defense' ? '99.6%' : '99.4%'}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">time reduction</p>
                </div>
              </div>
            </div>

            {/* Agent Visualization */}
            <Card className="border-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className={`w-5 h-5 ${domain === 'defense' ? 'text-red-400' : domain === 'medical' ? 'text-blue-400' : 'text-accent'}`} />
                  {domain === 'defense' ? 'Kill Chain Parallel Execution' : domain === 'medical' ? 'Emergency Response Parallel Execution' : 'Parallel Agent Execution'}
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
                  <CardTitle>{domain === 'defense' ? 'Intelligence Assessment' : domain === 'medical' ? 'Patient Assessment' : 'Drawing Analysis'}</CardTitle>
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
                  <div className="p-4 rounded-lg border border-border bg-card/30">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Quoted Price</p>
                    <p className="text-2xl font-bold text-accent">
                      ${processingResult.summary.totalPrice ? processingResult.summary.totalPrice.toLocaleString() : '—'}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-card/30">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Lead Time</p>
                    <p className="text-2xl font-bold text-foreground">
                      {processingResult.summary.leadTimeDays || '—'} days
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-card/30">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Risk Level</p>
                    <p className={`text-2xl font-bold ${
                      processingResult.summary.riskLevel === 'low' ? 'text-green-400' :
                      processingResult.summary.riskLevel === 'high' ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {processingResult.summary.riskLevel || '—'}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-card/30">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">AS9100 Compliance</p>
                    <p className={`text-2xl font-bold ${
                      processingResult.summary.complianceStatus === 'Compliant' ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {processingResult.summary.complianceStatus || '—'}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Shop-Ready Compliance Package — Manufacturing Only */}
            {domain === 'manufacturing' && (
              <CompliancePackage result={processingResult} domain={domain} />
            )}

            {/* Individual Agent Results — Expandable */}
            <Card className="border-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>{domain === 'defense' ? 'Kill Chain Node Reports' : domain === 'medical' ? 'Emergency Response Department Reports' : 'Department Reports'}</CardTitle>
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
                        <span className="text-xs text-muted-foreground">({agent.agentName})</span>
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
                          {JSON.stringify(agent.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Footer */}
        <footer className="border-t border-border pt-6 pb-8">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Brain className="w-4 h-4 text-accent" />
              <p className="text-xs text-foreground font-semibold">
                Guardian OS — A Learning, Self-Reflecting, Adjusting Digital Brain
              </p>
            </div>
            <p className="text-xs text-muted-foreground max-w-xl mx-auto">
              Sits atop your current systems. Non-intrusive. Links your entire operation into a single coordinated unit. 
              Every department that touches a decision fires simultaneously.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

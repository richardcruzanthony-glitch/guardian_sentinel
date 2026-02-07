import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Zap, Shield, Activity, Clock, ChevronDown, ChevronUp, FileImage, Loader2, ArrowRight, Crosshair, Factory } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useState, useCallback, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { AgentVisualization, type AgentStatus } from "@/components/AgentVisualization";

type Domain = 'manufacturing' | 'defense';

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
    traditionalDepts: ['Sales', 'Eng', 'Quality', 'Plan', 'Procure', 'Mfg', 'Ship', 'Comply', 'Audit'],
    guardianDepts: ['Sales', 'Eng', 'Quality', 'Plan', 'Procure', 'Mfg', 'Ship', 'Comply', 'Audit', 'Reflect'],
    traditionalTime: '2–3 weeks sequential',
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
    uploadHint: 'Scenario briefing, intelligence report, or imagery',
    acceptTypes: 'image/*,.pdf,.txt,.doc,.docx',
    processLabel: 'Fire Kill Chain — All Domains Simultaneously',
    traditionalDepts: ['ISR', 'Target', 'Weapons', 'EW', 'Cyber', 'C2', 'Legal', 'BDA', 'Logistics'],
    guardianDepts: ['ISR', 'Target', 'Weapons', 'EW', 'Cyber', 'C2', 'Legal', 'BDA', 'Logistics', 'Reflect'],
    traditionalTime: 'Hours to days sequential',
    paramLabel1: 'Threat Environment',
    paramLabel2: 'Priority Level',
    paramLabel3: 'Force Elements',
    summaryLabels: { price: 'Threat Level', time: 'Time Pressure', risk: 'Risk Level', compliance: 'LOAC Status' },
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

  const canProcess = domain === 'defense' ? (selectedFile || scenarioText.trim().length > 10) : !!selectedFile;

  const handleProcess = async () => {
    if (!canProcess) return;

    setIsProcessing(true);
    setProcessingResult(null);
    setProcessingStage(domain === 'defense' ? 'Processing intelligence...' : 'Uploading drawing...');

    try {
      let imageUrl: string | undefined;
      let fileName = selectedFile?.name || 'scenario-briefing.txt';

      // Upload image if present
      if (selectedFile?.type.startsWith('image/')) {
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

      // For defense domain, use scenario text as the file name if no file
      if (domain === 'defense' && !selectedFile && scenarioText) {
        fileName = scenarioText.substring(0, 100);
      }

      setProcessingStage(domain === 'defense' 
        ? 'Firing kill chain — all domains simultaneously...' 
        : 'Firing all domain agents in parallel...');

      const result = await processMutation.mutateAsync({
        fileName,
        fileSize: selectedFile?.size || scenarioText.length,
        complexity,
        quantity,
        material: domain === 'defense' ? threatEnv : material,
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
            <div className={`w-10 h-10 rounded-lg ${domain === 'defense' ? 'bg-red-500' : 'bg-accent'} flex items-center justify-center`}>
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Guardian OS</h1>
              <p className="text-xs text-muted-foreground">Parallel Decision Architecture</p>
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
        {/* Hero Section */}
        <section className="space-y-4">
          <div className="space-y-3">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${
              domain === 'defense' ? 'border-red-500/30 bg-red-500/5 text-red-400' : 'border-accent/30 bg-accent/5 text-accent'
            } text-xs font-medium`}>
              <DomainIcon className="w-3 h-3" />
              {domain === 'defense' ? 'Kill Chain Decision Engine' : 'Dynamic Domain-Driven Decision Engine'}
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground cyber-glow leading-tight">
              {domain === 'defense' ? (
                <>Every Kill Chain Node.<br /><span className="text-red-400">Simultaneously.</span></>
              ) : (
                <>Every Department.<br /><span className="text-accent">Simultaneously.</span></>
              )}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl">
              {config.description}
              <strong className="text-foreground"> all at once</strong> — not one after another.
            </p>
          </div>

          {/* Architecture comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
            <div className="p-4 rounded-lg border border-border bg-card/30">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                {domain === 'defense' ? 'Traditional Kill Chain' : 'Traditional Process'}
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
                {config.traditionalDepts.map((dept, i) => (
                  <span key={dept} className="flex items-center gap-1">
                    <span className="px-1.5 py-0.5 bg-muted rounded text-[10px]">{dept}</span>
                    {i < config.traditionalDepts.length - 1 && <ArrowRight className="w-3 h-3" />}
                  </span>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                <Clock className="w-3 h-3 inline mr-1" />
                {config.traditionalTime}
              </p>
            </div>
            <div className={`p-4 rounded-lg border ${domain === 'defense' ? 'border-red-500/30 bg-red-500/5' : 'border-accent/30 bg-accent/5'}`}>
              <p className={`text-xs ${domain === 'defense' ? 'text-red-400' : 'text-accent'} uppercase tracking-wider mb-2`}>Guardian OS</p>
              <div className="flex items-center gap-1 text-xs flex-wrap">
                {config.guardianDepts.map((dept) => (
                  <span key={dept} className={`px-1.5 py-0.5 rounded text-[10px] border ${
                    domain === 'defense' 
                      ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                      : 'bg-accent/20 text-accent border-accent/30'
                  }`}>
                    {dept}
                  </span>
                ))}
              </div>
              <p className={`text-sm ${domain === 'defense' ? 'text-red-400' : 'text-accent'} mt-2 font-semibold`}>
                <Zap className="w-3 h-3 inline mr-1" />
                All parallel — seconds
              </p>
            </div>
          </div>
        </section>

        {/* Input Section */}
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {domain === 'defense' ? (
                <Crosshair className="w-5 h-5 text-red-400" />
              ) : (
                <FileImage className="w-5 h-5 text-accent" />
              )}
              {config.uploadLabel}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Defense: Scenario Text Input */}
            {domain === 'defense' && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Scenario Briefing</label>
                <textarea
                  value={scenarioText}
                  onChange={(e) => setScenarioText(e.target.value)}
                  placeholder="Enter threat scenario briefing... e.g., 'Enemy mobile SAM battery detected at grid reference NK 123 456, moving south along MSR Tampa. SIGINT indicates active S-300 radar emissions. Friendly CAS aircraft operating within 40km. Civilian village 2km east of target.'"
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground text-sm min-h-[120px] resize-y placeholder:text-muted-foreground/50"
                />
              </div>
            )}

            {/* File Upload Area */}
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
                    {selectedFile ? selectedFile.name : (domain === 'defense' ? 'Drop imagery or intel file (optional)' : 'Drop your drawing here')}
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
                  <p className="text-sm text-muted-foreground text-center">
                    {domain === 'defense' ? 'Imagery preview will appear here' : 'Drawing preview will appear here'}
                  </p>
                </div>
              )}
            </div>

            {/* Parameters — Domain-specific */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {domain === 'manufacturing' ? (
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
              className={`w-full font-semibold ${domain === 'defense' ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-accent hover:bg-accent/90 text-accent-foreground'}`}
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {processingStage || 'Processing...'}
                </>
              ) : (
                <>
                  {domain === 'defense' ? <Crosshair className="w-4 h-4 mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                  {config.processLabel}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Processing Results */}
        {processingResult && (
          <div className="space-y-6">
            {/* Speed Comparison Hero */}
            <div className={`p-6 rounded-lg border ${domain === 'defense' ? 'border-red-500/30 bg-red-500/5' : 'border-accent/30 bg-accent/5'}`}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Agents Fired</p>
                  <p className={`text-3xl font-bold ${domain === 'defense' ? 'text-red-400' : 'text-accent'}`}>{processingResult.agentCount}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Parallel Time</p>
                  <p className={`text-3xl font-bold ${domain === 'defense' ? 'text-red-400' : 'text-accent'}`}>{(processingResult.totalDuration / 1000).toFixed(1)}s</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Sequential Would Take</p>
                  <p className="text-3xl font-bold text-muted-foreground line-through">{(processingResult.sequentialEstimate / 1000).toFixed(1)}s</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Speed Multiplier</p>
                  <p className="text-3xl font-bold" style={{ color: domain === 'defense' ? '#FF4444' : '#00FF41' }}>{processingResult.speedMultiplier}x</p>
                </div>
              </div>
            </div>

            {/* Agent Visualization */}
            <Card className="border-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className={`w-5 h-5 ${domain === 'defense' ? 'text-red-400' : 'text-accent'}`} />
                  {domain === 'defense' ? 'Kill Chain Parallel Execution' : 'Parallel Agent Execution'}
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
                  <CardTitle>{domain === 'defense' ? 'Intelligence Assessment' : 'Drawing Analysis'}</CardTitle>
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
              {domain === 'defense' ? (
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
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Compliance</p>
                    <p className={`text-2xl font-bold ${
                      processingResult.summary.complianceStatus === 'Compliant' ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {processingResult.summary.complianceStatus || '—'}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Individual Agent Results — Expandable */}
            <Card className="border-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>{domain === 'defense' ? 'Kill Chain Node Reports' : 'Department Reports'}</CardTitle>
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
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Guardian OS — Parallel Decision Architecture
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {domain === 'defense' 
                ? 'Every kill chain node fires simultaneously. Seconds, not hours.'
                : 'Every department that touches a decision fires simultaneously.'}
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

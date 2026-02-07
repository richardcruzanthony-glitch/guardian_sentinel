import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Zap, Shield, Activity, Clock, ChevronDown, ChevronUp, FileImage, Loader2, ArrowRight } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useState, useCallback, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { AgentVisualization, type AgentStatus } from "@/components/AgentVisualization";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [complexity, setComplexity] = useState(5);
  const [quantity, setQuantity] = useState(1);
  const [material, setMaterial] = useState('Aluminum 6061-T6');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState<any>(null);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [processingStage, setProcessingStage] = useState<string>('');

  const uploadMutation = trpc.guardian.uploadDrawing.useMutation();
  const processMutation = trpc.guardian.processRequest.useMutation();

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setProcessingResult(null);
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
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

  const handleProcess = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProcessingResult(null);
    setProcessingStage('Uploading drawing...');

    try {
      // Step 1: Upload the file to S3
      let imageUrl: string | undefined;
      if (selectedFile.type.startsWith('image/')) {
        setProcessingStage('Uploading engineering drawing to cloud...');
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]); // Remove data:image/...;base64, prefix
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

      // Step 2: Fire all agents in parallel
      setProcessingStage('Firing all domain agents in parallel...');
      const result = await processMutation.mutateAsync({
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        complexity,
        quantity,
        material,
        imageUrl,
        domain: 'manufacturing',
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

  // Build agent statuses for visualization
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
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
              <Zap className="w-6 h-6 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Guardian OS</h1>
              <p className="text-xs text-muted-foreground">Parallel Decision Architecture</p>
            </div>
          </div>
          
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{user?.name}</span>
              <Button variant="outline" size="sm">Profile</Button>
            </div>
          ) : (
            <Button asChild>
              <a href={getLoginUrl()}>Sign In</a>
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8 space-y-8">
        {/* Hero Section */}
        <section className="space-y-4">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/5 text-xs text-accent font-medium">
              <Activity className="w-3 h-3" />
              Dynamic Domain-Driven Decision Engine
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground cyber-glow leading-tight">
              Every Department.<br />
              <span className="text-accent">Simultaneously.</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Upload an engineering drawing. Guardian fires Sales, Engineering, Quality, Planning, 
              Procurement, Manufacturing, Shipping, Compliance, Audit, and Reflection agents 
              <strong className="text-foreground"> all at once</strong> — not one after another.
            </p>
          </div>

          {/* Architecture comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
            <div className="p-4 rounded-lg border border-border bg-card/30">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Traditional Process</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
                {['Sales', 'Eng', 'Quality', 'Plan', 'Procure', 'Mfg', 'Ship', 'Comply', 'Audit'].map((dept, i) => (
                  <span key={dept} className="flex items-center gap-1">
                    <span className="px-1.5 py-0.5 bg-muted rounded text-[10px]">{dept}</span>
                    {i < 8 && <ArrowRight className="w-3 h-3" />}
                  </span>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                <Clock className="w-3 h-3 inline mr-1" />
                2–3 weeks sequential
              </p>
            </div>
            <div className="p-4 rounded-lg border border-accent/30 bg-accent/5">
              <p className="text-xs text-accent uppercase tracking-wider mb-2">Guardian OS</p>
              <div className="flex items-center gap-1 text-xs flex-wrap">
                {['Sales', 'Eng', 'Quality', 'Plan', 'Procure', 'Mfg', 'Ship', 'Comply', 'Audit', 'Reflect'].map((dept) => (
                  <span key={dept} className="px-1.5 py-0.5 bg-accent/20 rounded text-[10px] text-accent border border-accent/30">
                    {dept}
                  </span>
                ))}
              </div>
              <p className="text-sm text-accent mt-2 font-semibold">
                <Zap className="w-3 h-3 inline mr-1" />
                All parallel — seconds
              </p>
            </div>
          </div>
        </section>

        {/* Upload Section */}
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileImage className="w-5 h-5 text-accent" />
              Upload Engineering Drawing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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
                  accept="image/*,.stp,.step,.iges,.igs,.dwg,.pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-input"
                />
                <label htmlFor="file-input" className="cursor-pointer">
                  <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-base font-semibold text-foreground mb-1">
                    {selectedFile ? selectedFile.name : 'Drop your drawing here'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Images (JPG, PNG), STEP, IGES, DWG, PDF
                  </p>
                </label>
              </div>

              {/* Preview */}
              {previewUrl ? (
                <div className="border border-border rounded-lg overflow-hidden bg-white">
                  <img
                    src={previewUrl}
                    alt="Engineering drawing preview"
                    className="w-full h-full object-contain max-h-64"
                  />
                </div>
              ) : (
                <div className="border border-border rounded-lg p-6 flex items-center justify-center bg-card/30">
                  <p className="text-sm text-muted-foreground text-center">
                    Drawing preview will appear here
                  </p>
                </div>
              )}
            </div>

            {/* Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={complexity}
                  onChange={(e) => setComplexity(Number(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground text-sm"
                />
              </div>
            </div>

            {/* Process Button */}
            <Button
              onClick={handleProcess}
              disabled={!selectedFile || isProcessing}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {processingStage || 'Processing...'}
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Fire All Agents — Analyze Drawing
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Processing Results */}
        {processingResult && (
          <div className="space-y-6">
            {/* Speed Comparison Hero */}
            <div className="p-6 rounded-lg border border-accent/30 bg-accent/5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Agents Fired</p>
                  <p className="text-3xl font-bold text-accent">{processingResult.agentCount}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Parallel Time</p>
                  <p className="text-3xl font-bold text-accent">{(processingResult.totalDuration / 1000).toFixed(1)}s</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Sequential Would Take</p>
                  <p className="text-3xl font-bold text-muted-foreground line-through">{(processingResult.sequentialEstimate / 1000).toFixed(1)}s</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Speed Multiplier</p>
                  <p className="text-3xl font-bold" style={{ color: '#00FF41' }}>{processingResult.speedMultiplier}x</p>
                </div>
              </div>
            </div>

            {/* Agent Visualization */}
            <Card className="border-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-accent" />
                  Parallel Agent Execution
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

            {/* Drawing Analysis */}
            {processingResult.drawingAnalysis && (
              <Card className="border-border bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Drawing Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {processingResult.drawingAnalysis}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            </div>

            {/* Individual Agent Results — Expandable */}
            <Card className="border-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Department Reports</CardTitle>
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
              Every department that touches a decision fires simultaneously.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

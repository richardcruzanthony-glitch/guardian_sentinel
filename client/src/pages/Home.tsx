import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Zap, Shield, TrendingUp } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { AgentVisualization } from "@/components/AgentVisualization";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [complexity, setComplexity] = useState(5);
  const [quantity, setQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState<any>(null);

  const demoMutation = trpc.demo.processRequest.useMutation();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-accent', 'bg-accent/10');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('border-accent', 'bg-accent/10');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-accent', 'bg-accent/10');
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleProcess = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    try {
      const result = await demoMutation.mutateAsync({
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        complexity,
        quantity,
      });
      setProcessingResult(result.result);
    } catch (error) {
      console.error('Processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

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
              <h1 className="text-xl font-bold text-foreground">Guardian Sentinel</h1>
              <p className="text-xs text-muted-foreground">Manufacturing Business OS</p>
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
          <div className="space-y-2">
            <h2 className="text-4xl font-bold text-foreground cyber-glow">
              AI-Powered Manufacturing Analysis
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Upload your CAD files and get instant manufacturing quotes, schedules, cost analysis, and optimization recommendations in 22 seconds.
            </p>
          </div>
        </section>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <Zap className="w-6 h-6 text-accent mb-2" />
              <CardTitle className="text-lg">22-Second Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                8 parallel agents process your design simultaneously for instant results.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <TrendingUp className="w-6 h-6 text-accent mb-2" />
              <CardTitle className="text-lg">Self-Learning</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                System improves accuracy with every quote, reaching 85%+ precision.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <Shield className="w-6 h-6 text-accent mb-2" />
              <CardTitle className="text-lg">AS9100 Compliant</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Aerospace & defense manufacturing standards built-in.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Upload Section */}
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Upload CAD File</CardTitle>
            <CardDescription>Drag and drop or click to select a STEP file</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Upload Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer transition-all hover:border-accent hover:bg-accent/5"
            >
              <input
                type="file"
                accept=".stp,.step,.iges,.igs,.dwg"
                onChange={handleFileSelect}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input" className="cursor-pointer">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-lg font-semibold text-foreground mb-1">
                  {selectedFile ? selectedFile.name : 'Drop your CAD file here'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports STEP, IGES, DWG formats
                </p>
              </label>
            </div>

            {/* Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Design Complexity</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={complexity}
                  onChange={(e) => setComplexity(Number(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Current: {complexity}/10</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground"
                />
              </div>
            </div>

            {/* Process Button */}
            <Button
              onClick={handleProcess}
              disabled={!selectedFile || isProcessing}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Analyze Design
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Processing Results */}
        {processingResult && (
          <div className="space-y-6">
            {/* Agent Visualization */}
            <Card className="border-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Processing Status</CardTitle>
              </CardHeader>
              <CardContent>
                <AgentVisualization
                  agents={processingResult.agents.map((a: any) => ({
                    name: a.agentName,
                    status: a.status,
                    duration: a.duration,
                    confidence: a.confidence,
                  }))}
                  totalDuration={processingResult.totalDuration}
                />
              </CardContent>
            </Card>

            {/* Quote Results */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-border bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Quote Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Price</span>
                    <span className="text-2xl font-bold text-accent">${processingResult.quote.totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Material</span>
                      <span>${processingResult.quote.materialCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Labor</span>
                      <span>${processingResult.quote.laborCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Overhead</span>
                      <span>${processingResult.quote.overheadCost.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-border">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Confidence</span>
                      <span className="text-lg font-bold text-accent">{(processingResult.quote.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Schedule</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Estimated Duration</p>
                    <p className="text-2xl font-bold text-accent">{processingResult.schedule.estimatedDays} days</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Start: </span>
                      <span>{processingResult.schedule.startDate}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">End: </span>
                      <span>{processingResult.schedule.endDate}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Cost Breakdown */}
            <Card className="border-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Detailed Cost Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-background rounded-lg border border-border">
                      <p className="text-xs text-muted-foreground mb-1">Materials</p>
                      <p className="text-lg font-bold text-accent">${processingResult.costs.materialCost.toFixed(0)}</p>
                    </div>
                    <div className="p-3 bg-background rounded-lg border border-border">
                      <p className="text-xs text-muted-foreground mb-1">Labor</p>
                      <p className="text-lg font-bold text-accent">${processingResult.costs.laborCost.toFixed(0)}</p>
                    </div>
                    <div className="p-3 bg-background rounded-lg border border-border">
                      <p className="text-xs text-muted-foreground mb-1">Tooling</p>
                      <p className="text-lg font-bold text-accent">${processingResult.costs.toolingCost.toFixed(0)}</p>
                    </div>
                    <div className="p-3 bg-background rounded-lg border border-border">
                      <p className="text-xs text-muted-foreground mb-1">Overhead</p>
                      <p className="text-lg font-bold text-accent">${processingResult.costs.overheadCost.toFixed(0)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card className="border-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Optimization Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {processingResult.optimizations.suggestions.map((suggestion: string, index: number) => (
                    <li key={index} className="flex gap-2 text-sm">
                      <span className="text-accent font-bold">•</span>
                      <span className="text-foreground">{suggestion}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 p-3 bg-accent/10 border border-accent/30 rounded-lg">
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">Potential Savings: </span>
                    <span className="text-accent font-bold">${processingResult.optimizations.potentialCostSavings.toFixed(0)}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

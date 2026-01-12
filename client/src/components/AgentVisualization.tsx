import React from 'react';
import { Zap, CheckCircle2, AlertCircle } from 'lucide-react';

export interface AgentStatus {
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  duration?: number;
  confidence?: number;
}

interface AgentVisualizationProps {
  agents: AgentStatus[];
  totalDuration?: number;
}

export function AgentVisualization({ agents, totalDuration }: AgentVisualizationProps) {
  const getAgentColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-accent text-accent-foreground';
      case 'processing':
        return 'bg-muted text-muted-foreground cyber-pulse';
      case 'failed':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted/50 text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'processing':
        return <Zap className="w-4 h-4 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <div className="w-4 h-4 rounded-full border border-current" />;
    }
  };

  const agentNames = [
    'QuoteAgent',
    'ScheduleAgent',
    'PlanAgent',
    'CostAgent',
    'RiskAgent',
    'OptimizeAgent',
    'ComplianceAgent',
    'LearningAgent',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">8-Agent Parallel Processing</h3>
          <p className="text-sm text-muted-foreground">Real-time manufacturing analysis framework</p>
        </div>
        {totalDuration && (
          <div className="text-right">
            <p className="text-2xl font-bold text-accent">{(totalDuration / 1000).toFixed(2)}s</p>
            <p className="text-xs text-muted-foreground">Processing Time</p>
          </div>
        )}
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {agentNames.map((agentName) => {
          const agent = agents.find(a => a.name === agentName);
          const status = agent?.status || 'pending';
          const confidence = agent?.confidence;

          return (
            <div
              key={agentName}
              className={`p-3 rounded-lg border border-border transition-all duration-300 ${getAgentColor(status)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-1">
                  {getStatusIcon(status)}
                  <span className="text-xs font-semibold truncate">{agentName.replace('Agent', '')}</span>
                </div>
              </div>
              
              {agent?.duration && (
                <p className="text-xs opacity-75">{(agent.duration).toFixed(0)}ms</p>
              )}
              
              {confidence !== undefined && (
                <div className="mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs">Confidence</span>
                    <span className="text-xs font-bold">{(confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-background/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all duration-300"
                      style={{ width: `${confidence * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Processing Timeline */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground">Processing Pipeline</h4>
        <div className="flex items-center gap-2">
          {agentNames.map((_, index) => (
            <React.Fragment key={index}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                index < agents.filter(a => a.status === 'completed').length
                  ? 'bg-accent border-accent text-accent-foreground'
                  : index < agents.filter(a => a.status === 'completed' || a.status === 'processing').length
                  ? 'bg-muted border-muted text-muted-foreground cyber-pulse'
                  : 'bg-background border-border text-muted-foreground'
              }`}>
                {index + 1}
              </div>
              {index < agentNames.length - 1 && (
                <div className={`flex-1 h-1 ${
                  index < agents.filter(a => a.status === 'completed').length
                    ? 'bg-accent'
                    : 'bg-border'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

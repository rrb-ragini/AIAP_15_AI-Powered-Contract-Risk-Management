import { FileText, AlertTriangle, TrendingUp, Flag, PieChart, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { AnalysisJob } from '../App';

interface DashboardProps {
  onViewChange: (view: string, contractId?: string) => void;
  stats?: any;
  jobs?: Record<string, AnalysisJob>;
}

export function Dashboard({ onViewChange, stats, jobs = {} }: DashboardProps) {
  // Compute metrics from actual jobs
  const allJobs = Object.values(jobs).sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return timeB - timeA;
  });
  const completedJobs = allJobs.filter(j => j.status === 'completed');

  // Use stats from server if available, otherwise fallback to computed
  const contractsAnalyzed = stats?.total_contracts ?? completedJobs.length;
  // Note: The backend `high_risk_clauses_contracts` might count contracts with at least one high-risk clause.
  // The frontend fallback here is a simplified version, assuming `risk_level` might be set on the job itself
  // or needs to be re-derived from results if `stats` is not available.
  // For now, let's keep the original logic for highRiskContracts if stats are not present,
  // which iterates through completedJobs to find those with high risk clauses.
  let highRiskContractsComputed = 0;
  let totalRiskyClausesComputed = 0;
  let riskDistComputed = { high: 0, medium: 0, low: 0 };
  let totalScoreComputed = 0; // Used for avgRiskScore fallback

  let bizImpact = { cashFlow: 0, legal: 0, ops: 0 };

  const getBusinessImpactType = (text: string) => {
    const t = text.toLowerCase();
    if (t.includes('payment') || t.includes('fee') || t.includes('price')) return 'cashFlow';
    if (t.includes('termination') || t.includes('liability') || t.includes('indemni')) return 'legal';
    if (t.includes('deliver') || t.includes('service') || t.includes('timeline')) return 'ops';
    return 'other';
  };

  completedJobs.forEach(job => {
    let hasHighRisk = false;
    let maxJobScore = 0;

    const flags = job.results?.filter((c: any) => c.risk_level && c.risk_level.toLowerCase() !== 'none') || [];
    totalRiskyClausesComputed += flags.length;

    flags.forEach((c: any) => {
      const level = c.risk_level.toLowerCase();
      if (level === 'high') { hasHighRisk = true; riskDistComputed.high++; }
      else if (level === 'medium' || level === 'moderate') riskDistComputed.medium++;
      else riskDistComputed.low++;

      if (c.final_risk_score > maxJobScore) {
        maxJobScore = c.final_risk_score;
      }

      const impact = getBusinessImpactType(c.clause_text || '');
      if (impact === 'cashFlow') bizImpact.cashFlow++;
      if (impact === 'legal') bizImpact.legal++;
      if (impact === 'ops') bizImpact.ops++;
    });

    if (hasHighRisk) highRiskContractsComputed++;
    totalScoreComputed += maxJobScore; // or average of clauses, but usually risk score is per contract max
  });

  const highRiskContracts = stats?.high_risk_contracts ?? highRiskContractsComputed;
  const totalRiskyClauses = stats?.total_risky_clauses ?? totalRiskyClausesComputed;
  const avgRiskScore = stats?.avg_risk_score !== undefined ? stats.avg_risk_score.toFixed(1) : (contractsAnalyzed > 0 ? (totalScoreComputed / contractsAnalyzed).toFixed(1) : "0.0");

  const riskDist = stats?.risk_distribution || { high: riskDistComputed.high, medium: riskDistComputed.medium, low: riskDistComputed.low };

  const serverBizImpact = stats?.business_impact;
  if (serverBizImpact) {
    bizImpact = {
      cashFlow: serverBizImpact.cash_flow ?? 0,
      legal: serverBizImpact.legal ?? 0,
      ops: serverBizImpact.ops ?? 0
    };
  }


  const getJobOverallRiskColor = (job: AnalysisJob) => {
    if (!job.results) return 'text-gray-600 bg-gray-50 border-gray-200';
    const hasHigh = job.results.some((c: any) => c.risk_level?.toLowerCase() === 'high');
    const hasMed = job.results.some((c: any) => c.risk_level?.toLowerCase() === 'medium' || c.risk_level?.toLowerCase() === 'moderate');
    if (hasHigh) return 'text-red-700 bg-red-50 border-red-200';
    if (hasMed) return 'text-orange-700 bg-orange-50 border-orange-200';
    return 'text-green-700 bg-green-50 border-green-200';
  };

  const getJobOverallRiskLabel = (job: AnalysisJob) => {
    if (!job.results) return 'N/A';
    const hasHigh = job.results.some((c: any) => c.risk_level?.toLowerCase() === 'high');
    const hasMed = job.results.some((c: any) => c.risk_level?.toLowerCase() === 'medium' || c.risk_level?.toLowerCase() === 'moderate');
    if (hasHigh) return 'High';
    if (hasMed) return 'Medium';
    return 'Low';
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-border px-8 py-6 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Contract Risk Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor business impacts and structural risks across your analyzed contracts.
          </p>
        </div>
        <Button onClick={() => onViewChange('upload')} className="bg-blue-600 hover:bg-blue-700">
          Analyze New Contract
        </Button>
      </div>

      <div className="p-8 space-y-6 overflow-auto">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium text-muted-foreground">Contracts Analyzed</CardTitle>
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contractsAnalyzed}</div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium text-muted-foreground">High Risk Contracts</CardTitle>
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{highRiskContracts}</div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium text-muted-foreground">Risky Clauses</CardTitle>
                <Flag className="w-4 h-4 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRiskyClauses}</div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium text-muted-foreground">Avg Risk Score</CardTitle>
                <TrendingUp className="w-4 h-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgRiskScore}/10</div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium text-muted-foreground">Risk Distribution</CardTitle>
                <PieChart className="w-4 h-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium flex gap-2">
                <span className="text-red-600">{riskDist.high || 0} H</span>
                <span className="text-orange-500">{riskDist.medium || 0} M</span>
                <span className="text-green-600">{riskDist.low || 0} L</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm bg-blue-50 border-blue-100">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold text-blue-900">Business Impact</CardTitle>
                <Briefcase className="w-4 h-4 text-blue-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-1 text-xs font-medium text-blue-800">
                <div className="flex justify-between"><span>Cash Flow:</span> <span>{bizImpact.cashFlow}</span></div>
                <div className="flex justify-between"><span>Legal:</span> <span>{bizImpact.legal}</span></div>
                <div className="flex justify-between"><span>Operational:</span> <span>{bizImpact.ops}</span></div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Recent Contracts Table */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Analysis History</CardTitle>
          </CardHeader>
          <CardContent>
            {allJobs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Contract Name</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date Analyzed</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Overall Risk</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allJobs.map((job) => (
                      <tr key={job.id} className="border-b border-border last:border-0 hover:bg-gray-50/50">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-50 rounded flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="text-sm font-medium truncate max-w-[200px]" title={job.filename}>{job.filename}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-muted-foreground">
                          {new Date(job.timestamp).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
                          })}
                        </td>
                        <td className="py-4 px-4">
                          {job.status === 'analyzing' ? (
                            <span className="text-sm text-blue-600 flex items-center gap-2 font-medium">
                              <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                              Running in Background...
                            </span>
                          ) : job.status === 'completed' ? (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-700">Completed</Badge>
                          ) : (
                            <Badge variant="destructive">Error</Badge>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          {job.status === 'completed' ? (
                            <Badge className={`border ${getJobOverallRiskColor(job)}`}>
                              {(job as any).risk_level || getJobOverallRiskLabel(job)}
                            </Badge>
                          ) : <span className="text-muted-foreground text-sm">-</span>}
                        </td>
                        <td className="py-4 px-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onViewChange('review', job.id)}
                            disabled={job.status !== 'completed'}
                          >
                            View Report
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No Contracts Analyzed</h3>
                <p className="text-sm text-muted-foreground mb-4">Start by uploading a contract to securely analyze its risk.</p>
                <Button onClick={() => onViewChange('upload')}>Upload Contract</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

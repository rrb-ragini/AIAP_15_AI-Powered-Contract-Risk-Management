import { Download, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { mockRiskBreakdown, mockClauseAnalyses } from '../data/mockData';

export function RiskReport() {
  const overallRiskScore = 78;
  const contractName = 'Vendor Service Agreement - Acme Corp';
  
  const getRiskLevel = (score: number) => {
    if (score >= 70) return { label: 'High', color: 'bg-red-500', badgeClass: 'bg-red-100 text-red-700 hover:bg-red-100' };
    if (score >= 40) return { label: 'Medium', color: 'bg-orange-500', badgeClass: 'bg-orange-100 text-orange-700 hover:bg-orange-100' };
    return { label: 'Low', color: 'bg-green-500', badgeClass: 'bg-green-100 text-green-700 hover:bg-green-100' };
  };

  const risk = getRiskLevel(overallRiskScore);

  const chartData = mockRiskBreakdown.map(item => ({
    name: item.category,
    value: item.count,
    riskLevel: item.riskLevel
  }));

  const getBarColor = (riskLevel: string) => {
    if (riskLevel === 'high') return '#dc2626';
    if (riskLevel === 'medium') return '#ea580c';
    return '#16a34a';
  };

  const getRiskBadge = (level: string) => {
    if (level === 'high') return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">High</Badge>;
    if (level === 'medium') return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Medium</Badge>;
    return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Low</Badge>;
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-border px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Risk Summary Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">{contractName}</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download PDF Report
            </Button>
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Export Risk Summary
            </Button>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* Overall Risk Score */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Overall Risk Assessment</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-8">
              <div className="relative w-40 h-40">
                {/* Circular Progress */}
                <svg className="w-40 h-40 transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-gray-200"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 70}`}
                    strokeDashoffset={`${2 * Math.PI * 70 * (1 - overallRiskScore / 100)}`}
                    className={overallRiskScore >= 70 ? 'text-red-500' : overallRiskScore >= 40 ? 'text-orange-500' : 'text-green-500'}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold">{overallRiskScore}</span>
                  <span className="text-sm text-muted-foreground">Risk Score</span>
                </div>
              </div>
              <Badge className={`mt-6 ${risk.badgeClass}`}>
                {risk.label} Risk Level
              </Badge>
              <p className="text-xs text-center text-muted-foreground mt-4 max-w-xs">
                This contract requires immediate attention due to multiple high-risk clauses
              </p>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Risk Breakdown by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry.riskLevel)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Flagged Clauses Table */}
        <Card>
          <CardHeader>
            <CardTitle>Flagged Clauses Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Clause Type
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Risk Level
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Issue
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Suggested Fix
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mockClauseAnalyses.map((clause) => (
                    <tr key={clause.id} className="border-b border-border last:border-0">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {clause.riskLevel === 'high' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                          {clause.riskLevel === 'medium' && <AlertTriangle className="w-4 h-4 text-orange-600" />}
                          {clause.riskLevel === 'low' && <CheckCircle className="w-4 h-4 text-green-600" />}
                          <span className="text-sm font-medium">{clause.clauseType}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {getRiskBadge(clause.riskLevel)}
                      </td>
                      <td className="py-4 px-4 max-w-xs">
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {clause.deviationSummary}
                        </p>
                      </td>
                      <td className="py-4 px-4 max-w-sm">
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {clause.suggestedClause}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        {clause.status === 'reviewed' ? (
                          <Badge variant="secondary">Reviewed</Badge>
                        ) : clause.status === 'accepted' ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Accepted</Badge>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Key Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Key Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4 p-4 bg-red-50 rounded-lg border border-red-200">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-red-900">Critical: Payment Terms</h4>
                  <p className="text-sm text-red-700 mt-1">
                    The 90-day payment window significantly impacts cash flow. Recommend renegotiating to 30-day terms with early payment incentives.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 p-4 bg-red-50 rounded-lg border border-red-200">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-red-900">Critical: Liability Cap</h4>
                  <p className="text-sm text-red-700 mt-1">
                    Liability limited to one month of fees is insufficient. Recommend 12-month cap with carve-outs for gross negligence and IP violations.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-orange-900">Important: Termination Notice</h4>
                  <p className="text-sm text-orange-700 mt-1">
                    15-day termination notice is too short for operational continuity. Recommend extending to 60 days with transition assistance provisions.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

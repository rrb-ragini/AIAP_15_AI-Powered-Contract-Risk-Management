import { FileText, AlertTriangle, TrendingUp, Flag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { mockContracts } from '../data/mockData';

interface DashboardProps {
  onViewChange: (view: string, contractId?: string) => void;
  stats?: any;
}

export function Dashboard({ onViewChange, stats: realStats }: DashboardProps) {
  const stats = {
    totalReviewed: realStats?.total_contracts || 0,
    highRisk: realStats?.high_risk_clauses || 0,
    avgRiskScore: Math.round(realStats?.avg_risk_score || 0),
    clausesFlagged: realStats?.total_clauses || 0
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-600 bg-red-50';
    if (score >= 40) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  const getRiskBadge = (score: number) => {
    if (score >= 70) return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">High Risk</Badge>;
    if (score >= 40) return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Medium Risk</Badge>;
    return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Low Risk</Badge>;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'analyzed') return <Badge variant="secondary">Analyzed</Badge>;
    return <Badge variant="outline">Pending</Badge>;
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-border px-8 py-6">
        <h1 className="text-2xl font-semibold text-gray-900">Contract Risk Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor and analyze contract risks across your organization
        </p>
      </div>

      <div className="p-8 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Contracts Reviewed
                </CardTitle>
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{stats.totalReviewed}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-600">+12%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  High Risk Contracts
                </CardTitle>
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{stats.highRisk}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-red-600">+3</span> requiring attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg Risk Score
                </CardTitle>
                <TrendingUp className="w-4 h-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{stats.avgRiskScore}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-orange-600">Medium</span> risk level
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Clauses Flagged
                </CardTitle>
                <Flag className="w-4 h-4 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{stats.clausesFlagged}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all contracts
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Contracts Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Contracts</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewChange('upload')}
              >
                Upload New
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Contract Name
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Date Uploaded
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Risk Score
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mockContracts.map((contract) => (
                    <tr key={contract.id} className="border-b border-border last:border-0">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-50 rounded flex items-center justify-center">
                            <FileText className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="text-sm font-medium">{contract.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-muted-foreground">
                        {new Date(contract.dateUploaded).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold px-2 py-1 rounded ${getRiskColor(contract.riskScore)}`}>
                            {contract.riskScore}
                          </span>
                          {getRiskBadge(contract.riskScore)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(contract.status)}
                      </td>
                      <td className="py-4 px-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onViewChange('review', contract.id)}
                        >
                          View Report
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

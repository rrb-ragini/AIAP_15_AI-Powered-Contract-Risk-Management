import { useState } from 'react';
import { AlertTriangle, CheckCircle, AlertCircle, MessageSquare, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { ClauseAnalysis } from '../types';

interface ContractReviewProps {
  results: any[];
  filename: string;
  contractText?: string;
}

export function ContractReview({ results, filename, contractText }: ContractReviewProps) {
  // Filter for detected golden clauses to avoid showing every single segment if not a golden clause
  const flaggedClauses = results?.filter(c => c.golden_clause_detected) || [];

  const [selectedClause, setSelectedClause] = useState<any>(flaggedClauses[0] || results?.[0] || {});
  const [editedSuggestion, setEditedSuggestion] = useState(selectedClause?.suggested_correction || '');

  const getRiskIcon = (level: string) => {
    const l = level?.toLowerCase();
    if (l === 'high') return <AlertTriangle className="w-5 h-5" />;
    if (l === 'medium' || l === 'moderate') return <AlertCircle className="w-5 h-5" />;
    return <CheckCircle className="w-5 h-5" />;
  };

  const getRiskColor = (level: string) => {
    const l = level?.toLowerCase();
    if (l === 'high') return 'text-red-600 bg-red-50 border-red-200';
    if (l === 'medium' || l === 'moderate') return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getRiskBadgeColor = (level: string) => {
    const l = level?.toLowerCase();
    if (l === 'high') return 'bg-red-100 text-red-700 hover:bg-red-100';
    if (l === 'medium' || l === 'moderate') return 'bg-orange-100 text-orange-700 hover:bg-orange-100';
    return 'bg-green-100 text-green-700 hover:bg-green-100';
  };

  const highlightText = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, index) => {
      // Check if this line is part of a highlighted clause
      const clause = results?.find(
        (c) => c.clause_id === (index + 1)
      );

      if (clause && clause.golden_clause_detected) {
        const isSelected = clause.clause_id === selectedClause.clause_id;
        const level = clause.risk_level?.toLowerCase();
        const colorClass = level === 'high'
          ? 'bg-red-100 border-l-4 border-red-500'
          : (level === 'medium' || level === 'moderate')
            ? 'bg-orange-100 border-l-4 border-orange-500'
            : 'bg-green-100 border-l-4 border-green-500';

        return (
          <div
            key={index}
            className={`py-1 px-3 cursor-pointer transition-all ${colorClass} ${isSelected ? 'ring-2 ring-blue-500' : ''
              }`}
            onClick={() => {
              setSelectedClause(clause);
              setEditedSuggestion(clause.suggested_correction || '');
            }}
          >
            {line}
          </div>
        );
      }

      return (
        <div key={index} className="py-1 px-3">
          {line}
        </div>
      );
    });
  };

  if (!results || results.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <Card className="w-96 text-center">
          <CardContent className="pt-6">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Analysis Data</h2>
            <p className="text-muted-foreground">Please upload a contract to start the analysis.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-border px-8 py-6">
        <h1 className="text-2xl font-semibold text-gray-900">Contract Review</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {filename || 'Analyzed Document'}
        </p>
      </div>

      {/* Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Document Viewer */}
        <div className="w-1/2 border-r border-border bg-white overflow-auto">
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Contract Document</h2>
              <div className="flex gap-2">
                <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  High Risk
                </Badge>
                <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Medium Risk
                </Badge>
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Compliant
                </Badge>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg border border-border p-4 font-mono text-sm leading-relaxed">
              {highlightText(contractText || 'No contract text available.')}
            </div>
          </div>
        </div>

        {/* Right Panel - AI Risk Analysis */}
        <div className="w-1/2 overflow-auto bg-gray-50">
          <div className="p-6 space-y-6">
            {/* Selected Clause Analysis */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{selectedClause?.golden_clause_type || 'General Clause'}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Clause ID: {selectedClause?.clause_id || 'N/A'}
                    </p>
                  </div>
                  <Badge className={getRiskBadgeColor(selectedClause?.risk_level || 'low')}>
                    {(selectedClause?.risk_level || 'LOW').toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Original Clause */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Original Clause</h4>
                  <div className="bg-gray-50 rounded-lg p-4 text-sm border border-border">
                    "{selectedClause?.clause_text || 'No text available'}"
                  </div>
                </div>

                {/* Justification */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Analysis Justification</h4>
                  <div className={`rounded-lg p-4 text-sm border ${getRiskColor(selectedClause?.risk_level)}`}>
                    <div className="flex gap-3">
                      {getRiskIcon(selectedClause?.risk_level)}
                      <p>{selectedClause?.justification || 'No justification provided.'}</p>
                    </div>
                  </div>
                </div>

                {/* Risk Score */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Risk Details</h4>
                    <p className="text-sm"><span className="font-medium">Score:</span> {selectedClause?.final_risk_score}/10</p>
                    <p className="text-sm"><span className="font-medium">Confidence:</span> {Math.round((selectedClause?.confidence || 0) * 100)}%</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Business Impact</h4>
                    <p className="text-sm line-clamp-2">{selectedClause?.business_risk_if_ignored || 'N/A'}</p>
                  </div>
                </div>

                {/* Suggested Golden Clause */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Suggested Golden Clause</h4>
                  <Textarea
                    value={editedSuggestion}
                    onChange={(e) => setEditedSuggestion(e.target.value)}
                    className="min-h-[120px] text-sm"
                    placeholder="No suggestion available"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                    <Check className="w-4 h-4 mr-2" />
                    Accept Suggestion
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Add Comment
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* All Flagged Clauses */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Golden Clauses Found ({flaggedClauses.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {flaggedClauses.length > 0 ? (
                  <div className="space-y-3">
                    {flaggedClauses.map((clause) => (
                      <button
                        key={clause.clause_id}
                        onClick={() => {
                          setSelectedClause(clause);
                          setEditedSuggestion(clause.suggested_correction || '');
                        }}
                        className={`w-full text-left p-4 rounded-lg border transition-all ${selectedClause?.clause_id === clause.clause_id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-border bg-white hover:bg-gray-50'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{clause.golden_clause_type}</span>
                          <Badge className={getRiskBadgeColor(clause.risk_level)} variant="secondary">
                            {clause.risk_level}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {clause.justification}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No golden clauses flagged in this contract.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

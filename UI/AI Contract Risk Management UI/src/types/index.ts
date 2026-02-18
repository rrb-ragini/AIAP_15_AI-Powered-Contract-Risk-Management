// Type definitions for the Contract Risk Management Tool

export type RiskLevel = 'low' | 'medium' | 'high';

export type ContractStatus = 'analyzed' | 'pending' | 'in-progress';

export interface Contract {
  id: string;
  name: string;
  dateUploaded: string;
  riskScore: number;
  status: ContractStatus;
  industry?: string;
  contractType?: string;
}

export interface ClauseAnalysis {
  id: string;
  clauseType: string;
  riskLevel: RiskLevel;
  text: string;
  deviationSummary: string;
  riskExplanation: string[];
  suggestedClause: string;
  status: 'pending' | 'reviewed' | 'accepted';
  startLine?: number;
  endLine?: number;
}

export interface GoldenClause {
  id: string;
  type: string;
  text: string;
  explanation: string;
  category: string;
}

export interface RiskBreakdown {
  category: string;
  riskLevel: RiskLevel;
  count: number;
}

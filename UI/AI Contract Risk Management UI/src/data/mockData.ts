// Mock data for the Contract Risk Management Tool

import { Contract, ClauseAnalysis, GoldenClause, RiskBreakdown } from '../types';

export const mockContracts: Contract[] = [
  {
    id: '1',
    name: 'Vendor Service Agreement - Acme Corp',
    dateUploaded: '2026-01-28',
    riskScore: 78,
    status: 'analyzed',
    industry: 'Technology',
    contractType: 'Service Agreement'
  },
  {
    id: '2',
    name: 'Software License Agreement - TechCo',
    dateUploaded: '2026-01-27',
    riskScore: 45,
    status: 'analyzed',
    industry: 'Technology',
    contractType: 'License Agreement'
  },
  {
    id: '3',
    name: 'Employment Contract - Jane Smith',
    dateUploaded: '2026-01-26',
    riskScore: 32,
    status: 'analyzed',
    industry: 'Human Resources',
    contractType: 'Employment'
  },
  {
    id: '4',
    name: 'Partnership Agreement - Global Partners LLC',
    dateUploaded: '2026-01-25',
    riskScore: 85,
    status: 'analyzed',
    industry: 'Legal',
    contractType: 'Partnership'
  },
  {
    id: '5',
    name: 'Lease Agreement - Downtown Office Space',
    dateUploaded: '2026-01-24',
    riskScore: 58,
    status: 'pending',
    industry: 'Real Estate',
    contractType: 'Lease'
  },
];

export const mockClauseAnalyses: ClauseAnalysis[] = [
  {
    id: 'clause-1',
    clauseType: 'Payment Terms',
    riskLevel: 'high',
    text: 'Payment shall be made within ninety (90) days from the date of invoice submission.',
    deviationSummary: 'This clause allows a 90-day payment window which increases working capital burden.',
    riskExplanation: [
      'Extended payment terms can severely impact cash flow and working capital',
      'Industry standard is 30-45 days for similar service agreements',
      'No provisions for early payment discounts or late payment penalties'
    ],
    suggestedClause: 'Payment shall be made within thirty (30) days from the date of invoice submission. A 2% discount shall apply for payments made within ten (10) days. Late payments shall accrue interest at 1.5% per month.',
    status: 'pending',
    startLine: 45,
    endLine: 46
  },
  {
    id: 'clause-2',
    clauseType: 'Termination',
    riskLevel: 'medium',
    text: 'Either party may terminate this agreement with 15 days written notice.',
    deviationSummary: 'Short termination notice period creates operational risk.',
    riskExplanation: [
      '15 days may be insufficient to find alternative vendors',
      'No distinction between termination for convenience vs. cause',
      'No provisions for transition assistance or knowledge transfer'
    ],
    suggestedClause: 'Either party may terminate this agreement for convenience with sixty (60) days written notice. In the event of termination, the service provider shall provide reasonable transition assistance for up to thirty (30) days.',
    status: 'pending',
    startLine: 78,
    endLine: 79
  },
  {
    id: 'clause-3',
    clauseType: 'Liability',
    riskLevel: 'high',
    text: 'Provider\'s total liability shall be limited to the fees paid in the preceding month.',
    deviationSummary: 'Extremely low liability cap creates significant financial risk.',
    riskExplanation: [
      'Liability cap is insufficient for potential damages from service failures',
      'Does not distinguish between different types of claims',
      'No carve-outs for gross negligence or willful misconduct'
    ],
    suggestedClause: 'Provider\'s total liability for any claims shall be limited to the total fees paid in the preceding twelve (12) months, except for claims arising from gross negligence, willful misconduct, or breach of confidentiality, which shall be unlimited.',
    status: 'pending',
    startLine: 102,
    endLine: 103
  },
  {
    id: 'clause-4',
    clauseType: 'Confidentiality',
    riskLevel: 'low',
    text: 'All parties agree to maintain confidentiality of proprietary information disclosed during the term of this agreement and for five (5) years thereafter.',
    deviationSummary: 'Clause is generally compliant with industry standards.',
    riskExplanation: [
      'Five-year confidentiality period is standard for most industries',
      'Covers information disclosed during the agreement term'
    ],
    suggestedClause: 'No changes recommended. This clause aligns with golden clause standards.',
    status: 'reviewed',
    startLine: 125,
    endLine: 127
  },
  {
    id: 'clause-5',
    clauseType: 'Indemnification',
    riskLevel: 'medium',
    text: 'Client agrees to indemnify and hold harmless the Provider from any and all claims arising from use of the services.',
    deviationSummary: 'One-sided indemnification creates unfair risk allocation.',
    riskExplanation: [
      'Client bears all risk, including for Provider\'s negligence',
      'No mutual indemnification provisions',
      'Overly broad scope of indemnification'
    ],
    suggestedClause: 'Each party shall indemnify the other from third-party claims arising from: (a) breach of this agreement, (b) negligence or willful misconduct, or (c) violation of applicable laws. Indemnification obligations shall not apply to claims caused by the indemnified party.',
    status: 'pending',
    startLine: 145,
    endLine: 147
  }
];

export const mockGoldenClauses: GoldenClause[] = [
  {
    id: 'golden-1',
    type: 'Payment Terms',
    text: 'Payment shall be made within thirty (30) days from the date of invoice submission. Invoices shall be submitted monthly and include detailed descriptions of services rendered. A 2% discount shall apply for payments made within ten (10) days. Late payments shall accrue interest at the rate of 1.5% per month or the maximum rate permitted by law, whichever is less.',
    explanation: 'This clause balances the needs of both parties by providing reasonable payment terms, incentivizing early payment, and including penalties for late payment.',
    category: 'Financial Terms'
  },
  {
    id: 'golden-2',
    type: 'Limitation of Liability',
    text: 'Except for breaches of confidentiality, violations of intellectual property rights, gross negligence, or willful misconduct, each party\'s total liability under this agreement shall be limited to the total fees paid by Client in the twelve (12) months preceding the claim. This limitation applies regardless of the form of action, whether in contract, tort, or otherwise.',
    explanation: 'This clause provides a balanced liability cap while ensuring that serious breaches (confidentiality, IP violations, gross negligence) are not subject to limitations.',
    category: 'Risk Allocation'
  },
  {
    id: 'golden-3',
    type: 'Termination for Convenience',
    text: 'Either party may terminate this agreement for convenience upon sixty (60) days prior written notice to the other party. Upon termination, Client shall pay for all services rendered through the effective date of termination. Provider shall provide reasonable transition assistance for up to thirty (30) days following termination.',
    explanation: 'This clause provides adequate notice period for both parties to manage the transition and requires the provider to assist with knowledge transfer.',
    category: 'Term and Termination'
  },
  {
    id: 'golden-4',
    type: 'Confidentiality',
    text: 'Each party agrees to maintain in confidence all Confidential Information disclosed by the other party during the term of this agreement and for five (5) years thereafter. Confidential Information shall not include information that: (a) is publicly available, (b) was rightfully known prior to disclosure, (c) is independently developed, or (d) is received from a third party without breach.',
    explanation: 'This clause establishes clear confidentiality obligations with standard exceptions and a reasonable time period for maintaining confidentiality.',
    category: 'Confidentiality'
  },
  {
    id: 'golden-5',
    type: 'Mutual Indemnification',
    text: 'Each party shall indemnify, defend, and hold harmless the other party from and against any third-party claims, damages, and expenses arising from: (a) breach of this agreement by the indemnifying party, (b) negligence or willful misconduct of the indemnifying party, or (c) violation of applicable laws by the indemnifying party. The indemnifying party shall have sole control over the defense of any such claim.',
    explanation: 'This clause ensures mutual protection from third-party claims while maintaining fair risk allocation between parties.',
    category: 'Risk Allocation'
  },
  {
    id: 'golden-6',
    type: 'Force Majeure',
    text: 'Neither party shall be liable for any delay or failure to perform due to causes beyond its reasonable control, including acts of God, war, terrorism, labor disputes, or government actions. The affected party shall promptly notify the other party and use reasonable efforts to resume performance. If the force majeure event continues for more than sixty (60) days, either party may terminate this agreement.',
    explanation: 'This clause protects both parties from liability for events outside their control while establishing procedures for notification and potential termination.',
    category: 'General Provisions'
  },
  {
    id: 'golden-7',
    type: 'Intellectual Property Rights',
    text: 'All intellectual property created by Provider in the course of performing services shall be the exclusive property of Client upon full payment of fees. Provider grants Client a perpetual, worldwide, royalty-free license to use any pre-existing intellectual property necessary to utilize the deliverables. Provider retains ownership of its pre-existing IP and general methodologies.',
    explanation: 'This clause clearly delineates ownership of work product while protecting the provider\'s pre-existing IP and reusable methodologies.',
    category: 'Intellectual Property'
  },
  {
    id: 'golden-8',
    type: 'Dispute Resolution',
    text: 'The parties shall attempt to resolve any dispute through good faith negotiation for thirty (30) days. If unsuccessful, the dispute shall be resolved through binding arbitration under the rules of the American Arbitration Association. The arbitration shall be conducted in [Location] and each party shall bear its own costs and attorneys\' fees unless otherwise awarded by the arbitrator.',
    explanation: 'This clause establishes a clear escalation path for disputes, encouraging negotiation before formal proceedings while keeping costs manageable.',
    category: 'Dispute Resolution'
  }
];

export const mockRiskBreakdown: RiskBreakdown[] = [
  { category: 'Payment Terms', riskLevel: 'high', count: 3 },
  { category: 'Termination', riskLevel: 'medium', count: 2 },
  { category: 'Liability', riskLevel: 'high', count: 4 },
  { category: 'Confidentiality', riskLevel: 'low', count: 1 },
  { category: 'Indemnification', riskLevel: 'medium', count: 2 }
];

export const mockContractDocument = `
SERVICE AGREEMENT

This Service Agreement ("Agreement") is entered into as of January 15, 2026 ("Effective Date"), by and between:

ACME CORPORATION
123 Business Street
New York, NY 10001
("Client")

and

VENDOR SERVICES LLC
456 Provider Avenue
Boston, MA 02101
("Provider")

WHEREAS, Client desires to engage Provider to perform certain services; and
WHEREAS, Provider agrees to perform such services subject to the terms and conditions set forth herein;

NOW, THEREFORE, in consideration of the mutual covenants and agreements contained herein, the parties agree as follows:

1. SERVICES
Provider shall provide technology consulting services as described in Exhibit A attached hereto.

2. TERM
This Agreement shall commence on the Effective Date and continue for a period of twelve (12) months, unless earlier terminated in accordance with Section 8.

3. COMPENSATION
3.1 Fees. Client shall pay Provider a monthly fee of $50,000 for the services rendered.
3.2 Payment Terms. Payment shall be made within ninety (90) days from the date of invoice submission.
3.3 Expenses. Client shall reimburse Provider for reasonable out-of-pocket expenses incurred in connection with the services.

4. INTELLECTUAL PROPERTY
All work product created by Provider shall become the property of Client upon payment. Provider retains rights to its pre-existing methodologies and tools.

5. CONFIDENTIALITY
All parties agree to maintain confidentiality of proprietary information disclosed during the term of this agreement and for five (5) years thereafter.

6. LIABILITY
6.1 Limitation. Provider's total liability shall be limited to the fees paid in the preceding month.
6.2 No Consequential Damages. Neither party shall be liable for indirect, consequential, or punitive damages.

7. INDEMNIFICATION
Client agrees to indemnify and hold harmless the Provider from any and all claims arising from use of the services.

8. TERMINATION
Either party may terminate this agreement with 15 days written notice.

9. GENERAL PROVISIONS
This Agreement shall be governed by the laws of the State of New York.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.

ACME CORPORATION                    VENDOR SERVICES LLC

_________________________          _________________________
John Smith, CEO                     Jane Doe, President
Date: January 15, 2026             Date: January 15, 2026
`;

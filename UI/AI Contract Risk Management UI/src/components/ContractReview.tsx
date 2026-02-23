import { useState, useMemo } from 'react';
import { AlertTriangle, CheckCircle, AlertCircle, Download, FileText, ChevronLeft, ChevronRight, TrendingUp, Flag, Lightbulb, ClipboardList, Loader2 } from 'lucide-react';
import { generateAnnotatedPdf } from '../utils/generateAnnotatedPdf';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import jsPDF from 'jspdf';

// Setup PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface ContractReviewProps {
  results: any[];
  filename: string;
  contractText?: string;
  file?: File;
}

export function ContractReview({ results, filename, contractText, file }: ContractReviewProps) {
  const flags = results?.filter(c => c.risk_level && c.risk_level.toLowerCase() !== 'none') || [];
  const [selectedClause, setSelectedClause] = useState<any>(flags[0] || results?.[0] || {});
  const [activeTab, setActiveTab] = useState<'analysis' | 'suggestion'>('analysis');

  // PDF state
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pdfError, setPdfError] = useState(false);
  const [annotating, setAnnotating] = useState(false);
  const [annotError, setAnnotError] = useState<string | null>(null);

  const getRiskIcon = (level: string) => {
    const l = level?.toLowerCase();
    if (l === 'high') return <AlertTriangle className="w-5 h-5" />;
    if (l === 'medium' || l === 'moderate') return <AlertCircle className="w-5 h-5" />;
    return <CheckCircle className="w-5 h-5" />;
  };

  const getRiskColor = (level: string) => {
    const l = level?.toLowerCase();
    if (l === 'high') return 'text-red-800 bg-red-50 border-red-200';
    if (l === 'medium' || l === 'moderate') return 'text-orange-800 bg-orange-50 border-orange-200';
    return 'text-green-800 bg-green-50 border-green-200';
  };

  const getRiskBadgeColor = (level: string) => {
    const l = level?.toLowerCase();
    if (l === 'high') return 'bg-red-100 text-red-800 hover:bg-red-200';
    if (l === 'medium' || l === 'moderate') return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
    return 'bg-green-100 text-green-800 hover:bg-green-200';
  };

  // Map business impact based on clause type or risk
  const getBusinessImpactType = (clause: any) => {
    const text = clause.clause_text?.toLowerCase() || '';
    if (text.includes('payment') || text.includes('fee') || text.includes('price')) return 'Cash Flow Risk';
    if (text.includes('termination') || text.includes('liability') || text.includes('indemni')) return 'Legal Exposure';
    if (text.includes('deliver') || text.includes('service') || text.includes('timeline')) return 'Operational Risk';
    return 'General Risk';
  };

  // Substring matcher for highlighting
  const textRenderer = useMemo(() => {
    return ({ str }: any) => {
      if (str.length < 4) return str;

      const matchedClause = results?.find(c => {
        const ct = c.clause_text || '';
        return ct.length > 5 && (ct.includes(str) || str.includes(ct));
      });

      if (matchedClause) {
        const level = matchedClause.risk_level?.toLowerCase();
        let color = 'rgba(74, 222, 128, 0.4)'; // green
        if (level === 'high') color = 'rgba(248, 113, 113, 0.4)'; // red
        if (level === 'medium' || level === 'moderate') color = 'rgba(251, 146, 60, 0.4)'; // orange

        return `<mark style="background-color: ${color}; color: inherit; padding: 2px; border-radius: 2px; cursor: pointer;">${str}</mark>`;
      }
      return str;
    };
  }, [results]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  // Download original file
  const handleDownloadOriginal = () => {
    if (file) {
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Original_${filename}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Download PDF with native highlight annotations
  const handleDownloadAnnotated = async () => {
    if (!file || !results?.length) return;
    setAnnotating(true);
    setAnnotError(null);
    try {
      const annotatedBytes = await generateAnnotatedPdf(file, results);
      const blob = new Blob([annotatedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Annotated_${filename}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Annotation generation failed:', err);
      setAnnotError(err?.message ?? 'Unknown error generating annotated PDF.');
    } finally {
      setAnnotating(false);
    }
  };

  // Generate and download a structured risk report PDF using jsPDF
  const handleDownloadModified = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 48;
    const contentWidth = pageWidth - margin * 2;
    let y = 60;

    const LINE_HEIGHT = 14;
    const SECTION_GAP = 10;

    const addText = (text: string, opts: { size?: number; bold?: boolean; color?: [number, number, number]; indent?: number } = {}) => {
      const { size = 10, bold = false, color = [30, 30, 30], indent = 0 } = opts;
      doc.setFontSize(size);
      doc.setFont('Helvetica', bold ? 'bold' : 'normal');
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(text, contentWidth - indent);
      lines.forEach((line: string) => {
        if (y > doc.internal.pageSize.getHeight() - 60) {
          doc.addPage();
          y = 60;
        }
        doc.text(line, margin + indent, y);
        y += LINE_HEIGHT;
      });
    };

    const addRule = (clr: [number, number, number] = [220, 220, 220]) => {
      if (y > doc.internal.pageSize.getHeight() - 60) { doc.addPage(); y = 60; }
      doc.setDrawColor(...clr);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += SECTION_GAP;
    };

    // --- Cover header ---
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageWidth, 44, 'F');
    doc.setFontSize(16);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('ContractGuard AI — Risk Review Report', margin, 28);
    y = 68;

    addText(`Document: ${filename}`, { size: 11, bold: true });
    addText(`Generated: ${new Date().toLocaleString()}`, { size: 9, color: [100, 100, 100] });
    y += SECTION_GAP;
    addRule();

    // --- Summary ---
    const high = results?.filter(c => c.risk_level?.toLowerCase() === 'high').length || 0;
    const moderate = results?.filter(c => ['medium', 'moderate'].includes(c.risk_level?.toLowerCase())).length || 0;
    const low = results?.filter(c => c.risk_level?.toLowerCase() === 'low').length || 0;
    addText('Summary', { size: 13, bold: true });
    y += 4;
    addText(`Total Clauses Analyzed: ${results?.length || 0}   |   High Risk: ${high}   |   Moderate: ${moderate}   |   Low: ${low}`, { size: 10, color: [60, 60, 60] });
    y += SECTION_GAP;
    addRule();

    // --- Clause-by-clause ---
    addText('Clause-by-Clause Analysis with Suggested Corrections', { size: 13, bold: true });
    y += 6;

    results?.forEach((clause, idx) => {
      if (y > doc.internal.pageSize.getHeight() - 80) { doc.addPage(); y = 60; }

      const riskLevel = clause.risk_level || 'Low';
      const riskColor: [number, number, number] =
        riskLevel === 'High' ? [185, 28, 28] :
          ['Moderate', 'Medium'].includes(riskLevel) ? [180, 83, 0] :
            [21, 128, 61];

      // Clause header
      addText(`${idx + 1}. ${clause.golden_clause_type || 'Clause'}`, { size: 11, bold: true });
      y -= 2;
      // Risk badge (inline text simulation)
      doc.setFontSize(9);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(...riskColor);
      doc.text(`[ ${riskLevel.toUpperCase()} RISK  •  Score: ${clause.final_risk_score?.toFixed(1) ?? 'N/A'}/10 ]`, margin + 8, y);
      y += LINE_HEIGHT + 2;

      // Original clause
      addText('Original Clause:', { size: 9, bold: true, color: [80, 80, 80], indent: 8 });
      addText(`"${clause.clause_text || ''}"`, { size: 9, color: [80, 80, 80], indent: 16 });
      y += 3;

      // Justification
      addText('Legal Risk Context:', { size: 9, bold: true, color: [80, 80, 80], indent: 8 });
      addText(clause.justification || 'N/A', { size: 9, color: [60, 60, 60], indent: 16 });
      y += 3;

      // Business impact
      if (clause.business_risk_if_ignored) {
        addText('Business Impact:', { size: 9, bold: true, color: [30, 64, 175], indent: 8 });
        addText(clause.business_risk_if_ignored, { size: 9, color: [30, 64, 175], indent: 16 });
        y += 3;
      }

      // Suggested correction
      if (clause.suggested_correction) {
        addText('✦ Suggested Correction:', { size: 9, bold: true, color: [21, 128, 61], indent: 8 });
        addText(clause.suggested_correction, { size: 9, color: [21, 128, 61], indent: 16 });
      }

      y += 4;
      addRule([230, 230, 230]);
    });

    // Footer on last page
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(160, 160, 160);
      doc.text(`ContractGuard AI  |  Page ${i} of ${totalPages}  |  Confidential`, margin, doc.internal.pageSize.getHeight() - 20);
    }

    doc.save(`Modified_${filename.replace(/\.[^.]+$/, '')}.pdf`);
  };

  if (!results || results.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <Card className="w-96 text-center">
          <CardContent className="pt-6">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Analysis Data</h2>
            <p className="text-muted-foreground">Please select an analyzed contract to view.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-border px-8 py-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Contract Review</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filename || 'Analyzed Document'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleDownloadOriginal} disabled={!file}>
            <Download className="w-4 h-4 mr-2" />
            Original
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadAnnotated}
            disabled={!file || annotating}
            title="Download original PDF with AI risk highlights as native PDF annotations"
          >
            {annotating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {annotating ? 'Annotating…' : 'Download Annotated PDF'}
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleDownloadModified}
            disabled={!results || results.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Risk Report
          </Button>
        </div>
      </div>

      {/* Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Document Viewer */}
        <div className="w-1/2 border-r border-border bg-gray-100 overflow-auto flex flex-col relative">
          <div className="p-4 bg-white border-b flex items-center justify-between sticky top-0 z-10 shrink-0">
            <div className="flex gap-2 text-sm text-muted-foreground">
              <Badge className="bg-red-100 text-red-800">High Risk</Badge>
              <Badge className="bg-orange-100 text-orange-800">Medium Risk</Badge>
              <Badge className="bg-green-100 text-green-800">Good</Badge>
            </div>

            {numPages && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={pageNumber <= 1}
                  onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium w-20 text-center">
                  Page {pageNumber} of {numPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={pageNumber >= numPages}
                  onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto p-4 flex justify-center bg-gray-100 shadow-inner">
            {file && !pdfError ? (
              <Document
                file={file}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={() => setPdfError(true)}
                className="bg-white shadow-lg"
              >
                <Page
                  pageNumber={pageNumber}
                  width={600}
                  renderTextLayer={true}
                  customTextRenderer={textRenderer}
                  className="mx-auto"
                />
              </Document>
            ) : (
              <div className="bg-white p-8 w-full max-w-2xl shadow-lg border text-sm font-mono whitespace-pre-wrap leading-relaxed">
                {contractText || "Loading document content..."}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - AI Risk Analysis & Suggested Clauses */}
        <div className="w-1/2 overflow-auto bg-gray-50">
          <div className="p-6 space-y-6">
            {/* Selected Clause Analysis */}
            <Card className="border-t-4 border-blue-600 shadow-sm">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{selectedClause?.golden_clause_type || 'Clause Analysis'}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Business Focus: {getBusinessImpactType(selectedClause)}
                    </p>
                  </div>
                  <Badge className={getRiskBadgeColor(selectedClause?.risk_level || 'low')}>
                    {(selectedClause?.risk_level || 'LOW').toUpperCase()} Risk
                  </Badge>
                </div>

                {/* Tabs */}
                <div className="flex gap-0 mt-4 border-b border-gray-200">
                  <button
                    onClick={() => setActiveTab('analysis')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'analysis'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  >
                    <ClipboardList className="w-3.5 h-3.5 inline mr-1.5" />
                    Risk Analysis
                  </button>
                  <button
                    onClick={() => setActiveTab('suggestion')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === 'suggestion'
                      ? 'border-emerald-600 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    Suggested Clause
                    {selectedClause?.suggested_correction && (
                      <span className="ml-1 w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    )}
                  </button>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 pt-2">
                {activeTab === 'analysis' ? (
                  <>
                    {/* Justification */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Legal Context</h4>
                      <div className={`rounded-lg p-4 text-sm border ${getRiskColor(selectedClause?.risk_level)}`}>
                        <div className="flex gap-3 items-start">
                          <div className="mt-0.5">{getRiskIcon(selectedClause?.risk_level)}</div>
                          <p className="leading-relaxed">{selectedClause?.justification || 'Standard clause.'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Business Impact */}
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-5">
                      <h4 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Business Impact Translation
                      </h4>
                      <p className="text-sm text-blue-800 leading-relaxed font-medium">
                        {selectedClause?.business_risk_if_ignored || "No significant business impact if executed as is."}
                      </p>
                    </div>

                    {/* Original Clause Snippet */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-gray-700">Clause Extract</h4>
                      <div className="bg-white rounded-lg p-4 text-sm border border-gray-200 italic text-gray-600 border-l-4 border-l-gray-400">
                        "{selectedClause?.clause_text || 'No text available'}"
                      </div>
                    </div>

                    {/* Risk score bar */}
                    {selectedClause?.final_risk_score !== undefined && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-semibold text-gray-700">Risk Score</h4>
                          <span className="text-sm font-bold text-gray-900">{selectedClause.final_risk_score.toFixed(1)} / 10</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${selectedClause.final_risk_score >= 7 ? 'bg-red-500' : selectedClause.final_risk_score >= 4 ? 'bg-orange-400' : 'bg-green-400'}`}
                            style={{ width: `${(selectedClause.final_risk_score / 10) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Suggested Correction Tab */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-gray-700">Original Clause</h4>
                      <div className="bg-red-50 rounded-lg p-4 text-sm border border-red-100 italic text-gray-600 border-l-4 border-l-red-400">
                        "{selectedClause?.clause_text || 'No text available'}"
                      </div>
                    </div>

                    {selectedClause?.suggested_correction ? (
                      <>
                        <div className="flex items-center gap-2 text-emerald-700">
                          <Lightbulb className="w-4 h-4" />
                          <span className="text-sm font-semibold">AI-Suggested Replacement</span>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5 border-l-4 border-l-emerald-500">
                          <p className="text-sm text-emerald-900 leading-relaxed font-medium whitespace-pre-wrap">
                            {selectedClause.suggested_correction}
                          </p>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-500 flex items-start gap-2">
                          <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          <span>
                            This suggestion follows the <strong>minimal-departure rule</strong> — it corrects
                            only the material drafting weaknesses while preserving the original commercial intent.
                          </span>
                        </div>

                        {/* Copy button */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedClause.suggested_correction);
                          }}
                        >
                          Copy Suggested Clause
                        </Button>
                      </>
                    ) : (
                      <div className="text-center py-10 border-2 border-dashed rounded-lg bg-gray-50/50">
                        <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-3 opacity-50" />
                        <p className="text-sm font-medium text-gray-900">No Correction Needed</p>
                        <p className="text-xs text-muted-foreground mt-1">This clause appears well-drafted.</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* All Flagged Clauses */}
            <Card>
              <CardHeader className="bg-gray-50/50 border-b pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Flag className="w-4 h-4 text-gray-500" />
                  Identified Clauses ({flags.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {flags.length > 0 ? (
                  <div className="space-y-3">
                    {flags.map((clause) => (
                      <button
                        key={clause.clause_id || Math.random()}
                        onClick={() => { setSelectedClause(clause); setActiveTab('analysis'); }}
                        className={`w-full text-left p-4 rounded-lg border transition-all ${selectedClause?.clause_id === clause.clause_id
                          ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                          : 'border-border bg-white hover:bg-gray-50 shadow-sm hover:shadow'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900 truncate pr-4">{clause.golden_clause_type || 'Clause'}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            {clause.suggested_correction && (
                              <span title="Has suggested correction" className="w-2 h-2 rounded-full bg-emerald-500" />
                            )}
                            <Badge className={getRiskBadgeColor(clause.risk_level)} variant="secondary">
                              {clause.risk_level}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {clause.business_risk_if_ignored || clause.justification}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg bg-gray-50/50">
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-3 opacity-50" />
                    <p className="text-sm font-medium text-gray-900">No Risky Clauses Identified</p>
                    <p className="text-xs text-muted-foreground mt-1">This contract appears to be standard.</p>
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

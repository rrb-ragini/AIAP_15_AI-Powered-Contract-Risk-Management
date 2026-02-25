import { FileText, Download, TrendingUp, AlertTriangle, History, Trash2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { AnalysisJob } from '../App';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "./ui/alert-dialog";

interface PastReportsProps {
    onViewChange: (view: string, data?: any) => void;
    jobs?: Record<string, AnalysisJob>;
}

export function PastReports({ onViewChange, jobs = {} }: PastReportsProps) {
    const allJobs = Object.values(jobs)
        .filter(j => j.status === 'completed')
        .sort((a, b) => {
            const timeA = new Date(a.timestamp).getTime();
            const timeB = new Date(b.timestamp).getTime();
            return timeB - timeA;
        });

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

    const handleDownload = async (job: AnalysisJob) => {
        if (job.file) {
            const url = URL.createObjectURL(job.file);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Analyzed_${job.filename}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } else {
            // Fetch from backend
            try {
                toast.loading('Fetching file from server...');
                const res = await fetch(`http://localhost:8000/reports/${job.id}/file`);
                if (res.ok) {
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Analyzed_${job.filename}`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    toast.dismiss();
                    toast.success('Download started');
                } else {
                    throw new Error('File not found on server');
                }
            } catch (error) {
                console.error('Error downloading file:', error);
                toast.dismiss();
                toast.error('Failed to download file from server');
            }
        }
    };

    return (
        <div className="flex-1 overflow-auto bg-gray-50 flex flex-col p-8">
            <div className="flex items-center justify-between mb-8 shrink-0">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Past Reports</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Access and download your previously analyzed contracts.
                    </p>
                </div>
                <div className="flex gap-4">
                    {allJobs.length > 0 && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Clear History
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Clear All Analysis History?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete all previously analyzed contract reports and reset your dashboard statistics.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onViewChange('clear-all', 'all')} className="bg-red-600 hover:bg-red-700">
                                        Delete All
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                    <Button onClick={() => onViewChange('upload')} className="bg-blue-600 hover:bg-blue-700">
                        Upload New Contract
                    </Button>
                </div>
            </div>

            <Card className="flex-1 flex flex-col min-h-0 shadow-sm border-gray-200">
                <CardContent className="p-0 flex-1 overflow-auto">
                    {allJobs.length > 0 ? (
                        <table className="w-full">
                            <thead className="sticky top-0 bg-gray-50/95 backdrop-blur z-10">
                                <tr className="border-b border-border">
                                    <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Contract Document</th>
                                    <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Analysis Date</th>
                                    <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Overall Risk</th>
                                    <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Risky Clauses</th>
                                    <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allJobs.map((job) => {
                                    const riskyCount = job.results
                                        ? job.results.filter((c: any) => c.risk_level && c.risk_level.toLowerCase() !== 'none').length
                                        : (job as any).flagged_count || 0;
                                    return (
                                        <tr key={job.id} className="border-b border-border last:border-0 hover:bg-gray-50/80 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-blue-50/50 rounded flex items-center justify-center shrink-0">
                                                        <FileText className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-900 block truncate max-w-[250px]">{job.filename}</span>
                                                        <span className="text-xs text-muted-foreground line-clamp-1">{job.id}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-sm text-muted-foreground font-medium">
                                                {new Date(job.timestamp).toLocaleDateString('en-US', {
                                                    month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
                                                })}
                                            </td>
                                            <td className="py-4 px-6">
                                                <Badge className={`border ${getJobOverallRiskColor(job)} shadow-sm`}>
                                                    {(job as any).risk_level || getJobOverallRiskLabel(job)} Risk
                                                </Badge>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    <AlertTriangle className={`w-4 h-4 ${riskyCount > 0 ? 'text-amber-500' : 'text-gray-300'}`} />
                                                    <span className="text-sm font-medium text-gray-700">{riskyCount} Flagged</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-right space-x-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => onViewChange('review', job.id)}
                                                    className="bg-white"
                                                >
                                                    View Report
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => handleDownload(job)}
                                                    title="Download Document"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        if (confirm('Are you sure you want to delete this report?')) {
                                                            onViewChange('delete-report', job.id);
                                                        }
                                                    }}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    title="Delete Report"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center py-20">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <History className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Past Reports</h3>
                            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                                You haven't run any contract risk analyses yet. Once you complete an analysis, the detailed PDF report and results will be securely saved here.
                            </p>
                            <Button onClick={() => onViewChange('upload')} className="bg-blue-600 hover:bg-blue-700">
                                Run First Analysis
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

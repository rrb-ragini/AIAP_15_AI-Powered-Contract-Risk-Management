import { useState } from 'react';
import { Upload, FileText, CheckCircle } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface UploadContractProps {
  onViewChange: (view: string, contractId?: string) => void;
}

export function UploadContract({ onViewChange }: UploadContractProps) {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [industry, setIndustry] = useState('');
  const [contractType, setContractType] = useState('');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFileName(e.dataTransfer.files[0].name);
    }
  };

  const [file, setFile] = useState<File | null>(null);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setFileName(e.target.files[0].name);
    }
  };

  const handleAnalyze = async () => {
    if (!file || !industry || !contractType) return;

    setAnalyzing(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Analysis failed');

      const data = await response.json();
      setAnalyzing(false);
      onViewChange('review', data);
    } catch (error) {
      console.error('Error during analysis:', error);
      setAnalyzing(false);
      alert('Failed to analyze contract. Please ensure the backend is running.');
    }
  };

  const steps = [
    { number: 1, label: 'Upload', status: fileName ? 'complete' : 'current' },
    { number: 2, label: 'Clause Detection', status: analyzing ? 'current' : 'pending' },
    { number: 3, label: 'Risk Analysis', status: analyzing ? 'current' : 'pending' },
    { number: 4, label: 'Report Generation', status: 'pending' }
  ];

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-border px-8 py-6">
        <h1 className="text-2xl font-semibold text-gray-900">Upload Contract for Risk Analysis</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload your contract document to begin AI-powered risk assessment
        </p>
      </div>

      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Upload Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Drag & Drop Upload */}
              <Card>
                <CardContent className="p-8">
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-12 transition-colors ${dragActive
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 bg-gray-50'
                      }`}
                  >
                    <div className="flex flex-col items-center justify-center space-y-4">
                      {fileName ? (
                        <>
                          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-900">{fileName}</p>
                            <p className="text-xs text-muted-foreground mt-1">File ready for analysis</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFileName(null)}
                          >
                            Remove File
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                            <Upload className="w-8 h-8 text-blue-600" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-900">
                              Drag & drop your contract here
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Supports PDF, DOCX files up to 50MB
                            </p>
                          </div>
                          <div className="relative">
                            <input
                              type="file"
                              id="file-upload"
                              className="hidden"
                              accept=".pdf,.docx,.doc"
                              onChange={handleFileInput}
                            />
                            <label htmlFor="file-upload">
                              <Button variant="outline" asChild>
                                <span className="cursor-pointer">Browse Files</span>
                              </Button>
                            </label>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Configuration Options */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="industry">Select Industry</Label>
                    <Select value={industry} onValueChange={setIndustry}>
                      <SelectTrigger id="industry">
                        <SelectValue placeholder="Choose industry..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="real-estate">Real Estate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contract-type">Select Contract Type</Label>
                    <Select value={contractType} onValueChange={setContractType}>
                      <SelectTrigger id="contract-type">
                        <SelectValue placeholder="Choose contract type..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="service">Service Agreement</SelectItem>
                        <SelectItem value="license">License Agreement</SelectItem>
                        <SelectItem value="employment">Employment Contract</SelectItem>
                        <SelectItem value="nda">Non-Disclosure Agreement</SelectItem>
                        <SelectItem value="partnership">Partnership Agreement</SelectItem>
                        <SelectItem value="lease">Lease Agreement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 mt-6"
                    onClick={handleAnalyze}
                    disabled={!fileName || !industry || !contractType || analyzing}
                  >
                    {analyzing ? 'Analyzing Contract...' : 'Analyze Contract'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Progress Steps Panel */}
            <div>
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-sm mb-6">Analysis Steps</h3>
                  <div className="space-y-6">
                    {steps.map((step, index) => (
                      <div key={step.number} className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step.status === 'complete'
                                ? 'bg-green-100 text-green-700'
                                : step.status === 'current'
                                  ? 'bg-blue-100 text-blue-700 ring-4 ring-blue-50'
                                  : 'bg-gray-100 text-gray-400'
                              }`}
                          >
                            {step.status === 'complete' ? (
                              <CheckCircle className="w-5 h-5" />
                            ) : (
                              step.number
                            )}
                          </div>
                        </div>
                        <div className="flex-1 pt-1">
                          <p
                            className={`text-sm font-medium ${step.status === 'pending' ? 'text-gray-400' : 'text-gray-900'
                              }`}
                          >
                            {step.label}
                          </p>
                          {step.status === 'current' && (
                            <p className="text-xs text-muted-foreground mt-1">In progress...</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-6 border-t border-border">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-muted-foreground">
                        <p className="font-medium text-gray-900 mb-1">How it works</p>
                        <p>
                          Our AI analyzes your contract, identifies key clauses, compares them to
                          industry standards, and generates a comprehensive risk report.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

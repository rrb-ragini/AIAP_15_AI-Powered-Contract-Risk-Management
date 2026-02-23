import { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { UploadContract } from './components/UploadContract';
import { ContractReview } from './components/ContractReview';
import { RiskReport } from './components/RiskReport';
import { GoldenClauseLibrary } from './components/GoldenClauseLibrary';
import { Settings } from './components/Settings';
import { LandingPage } from './components/LandingPage';
import { PastReports } from './components/PastReports';

type View = 'landing' | 'dashboard' | 'upload' | 'library' | 'reports' | 'clauses' | 'settings' | 'review';

export interface AnalysisJob {
  id: string;
  filename: string;
  file?: File;
  status: 'analyzing' | 'completed' | 'error';
  results?: any[];
  contractText?: string;
  timestamp: Date;
}

interface AppState {
  view: View;
  selectedContractId?: string;
  dashboardStats?: any;
}

export default function App() {
  const [appState, setAppState] = useState<AppState>({
    view: 'landing'
  });

  const [jobs, setJobs] = useState<Record<string, AnalysisJob>>({});

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:8000/dashboard-stats');
      const data = await response.json();
      setAppState(prev => ({ ...prev, dashboardStats: data }));
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleViewChange = (view: string, data?: any) => {
    if (view === 'review' && data?.results) {
      // Existing direct review logic (if still used)
      setAppState({
        view: 'review',
        selectedContractId: data.filename
      });
      fetchStats();
    } else if (view === 'start-analysis' && data) {
      const jobId = Date.now().toString();
      const newJob: AnalysisJob = {
        id: jobId,
        filename: data.filename,
        file: data.file,
        status: 'analyzing',
        timestamp: new Date()
      };
      setJobs(prev => ({ ...prev, [jobId]: newJob }));

      // Navigate to dashboard while it's running in background
      setAppState({ view: 'dashboard' });

      toast.info(`Analysis started for ${data.filename}`, {
        description: 'This may take up to 10 minutes. You can continue using the app.'
      });

      // Kick off analysis
      const formData = new FormData();
      formData.append('file', data.file);

      fetch('http://localhost:8000/analyze', {
        method: 'POST',
        body: formData,
      })
        .then(res => {
          if (!res.ok) throw new Error('Analysis failed');
          return res.json();
        })
        .then(analysisData => {
          // Play success sound
          const audio = new Audio('/success.mp3'); // Need to map this to an actual sound or just rely on toast
          audio.play().catch(e => console.log('Audio play blocked:', e));

          toast.success(`Analysis completed for ${data.filename}`);

          setJobs(prev => ({
            ...prev,
            [jobId]: {
              ...prev[jobId],
              status: 'completed',
              results: analysisData.results,
              contractText: analysisData.contract_text
            }
          }));
          fetchStats();
        })
        .catch(error => {
          console.error('Error during analysis:', error);
          toast.error(`Analysis failed for ${data.filename}`);
          setJobs(prev => ({
            ...prev,
            [jobId]: { ...prev[jobId], status: 'error' }
          }));
        });

    } else {
      setAppState({
        view: view as View,
        selectedContractId: typeof data === 'string' ? data : undefined
      });
    }
  };

  const renderView = () => {
    switch (appState.view) {
      case 'dashboard':
        return <Dashboard onViewChange={handleViewChange} stats={appState.dashboardStats} jobs={jobs} />;
      case 'upload':
        return <UploadContract onViewChange={handleViewChange} />;
      case 'review':
        // Find the job if selectedContractId is a jobId or filename
        const selectedJob = Object.values(jobs).find((j: AnalysisJob) => j.id === appState.selectedContractId || j.filename === appState.selectedContractId) as AnalysisJob | undefined;
        return <ContractReview
          results={selectedJob?.results || []}
          filename={selectedJob?.filename || ''}
          contractText={selectedJob?.contractText}
          file={selectedJob?.file}
        />;
      case 'reports':
        return <PastReports onViewChange={handleViewChange} jobs={jobs} />;
      case 'library':
        return <GoldenClauseLibrary />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onViewChange={handleViewChange} stats={appState.dashboardStats} />;
    }
  };

  if (appState.view === 'landing') {
    return <LandingPage onStart={() => handleViewChange('dashboard')} />;
  }

  return (
    <div className="flex h-screen bg-background text-gray-900 font-sans overflow-hidden">
      <Sidebar activeView={appState.view} onViewChange={handleViewChange} />
      {renderView()}
      <Toaster position="top-right" richColors />
    </div>
  );
}

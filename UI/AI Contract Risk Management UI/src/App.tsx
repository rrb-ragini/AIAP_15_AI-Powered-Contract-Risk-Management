import { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { UploadContract } from './components/UploadContract';
import { ContractReview } from './components/ContractReview';
import { GoldenClauseLibrary } from './components/GoldenClauseLibrary';
import { Settings } from './components/Settings';
import { LandingPage } from './components/LandingPage';
import { PastReports } from './components/PastReports';
import { API_BASE_URL } from './utils/api';

type View = 'landing' | 'dashboard' | 'upload' | 'library' | 'reports' | 'clauses' | 'settings' | 'review';

export interface AnalysisJob {
  id: string;
  filename: string;
  file?: File;
  status: 'analyzing' | 'completed' | 'error';
  results?: any[];
  contractText?: string;
  timestamp: string | Date;
}

export interface AppSettings {
  riskLevel: 'low' | 'medium' | 'strict';
  autoFlag: boolean;
  sendAlerts: boolean;
  industry: string;
  contractType: string;
  useCustomLibrary: boolean;
  allowSuggestions: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  riskLevel: 'medium',
  autoFlag: true,
  sendAlerts: true,
  industry: 'technology',
  contractType: 'service',
  useCustomLibrary: false,
  allowSuggestions: true,
};

function loadSettings(): AppSettings {
  try {
    const saved = localStorage.getItem('app_settings');
    if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  } catch (e) {
    console.error('Error loading settings:', e);
  }
  return DEFAULT_SETTINGS;
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
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard-stats`);
      const data = await response.json();
      setAppState(prev => ({ ...prev, dashboardStats: data }));
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchReports = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/reports`);
      const data = await response.json();
      const reportsMap: Record<string, AnalysisJob> = {};
      data.forEach((report: any) => {
        reportsMap[report.id] = {
          ...report,
          status: 'completed'
        };
      });

      setJobs(prev => {
        const newJobs = { ...prev, ...reportsMap };
        // Clean up any local "analyzing" jobs that are actually finished on server
        Object.entries(newJobs).forEach(([id, job]) => {
          if (job.status === 'analyzing') {
            const isCompleted = data.some((r: any) => r.filename === job.filename);
            if (isCompleted) {
              delete newJobs[id];
            }
          }
        });
        return newJobs;
      });
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchReports();

    // Recover analyzing jobs from localStorage
    const savedJobs = localStorage.getItem('analyzing_jobs');
    if (savedJobs) {
      try {
        const parsed = JSON.parse(savedJobs);
        setJobs(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Error recovering jobs:', e);
      }
    }
  }, []);

  useEffect(() => {
    // Save only 'analyzing' jobs to localStorage
    const analyzingJobs: Record<string, AnalysisJob> = {};
    Object.entries(jobs).forEach(([id, job]) => {
      if (job.status === 'analyzing') {
        analyzingJobs[id] = job;
      }
    });
    localStorage.setItem('analyzing_jobs', JSON.stringify(analyzingJobs));
  }, [jobs]);

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('app_settings', JSON.stringify(newSettings));
  };

  const handleViewChange = async (view: string, data?: any) => {
    if (view === 'review' && data) {
      const jobId = typeof data === 'string' ? data : data.id || data.filename;

      // If report is missing or incomplete, fetch full data
      if (!jobs[jobId] || !jobs[jobId].results || !jobs[jobId].file) {
        try {
          const res = await fetch(`${API_BASE_URL}/reports/${jobId}`);
          if (!res.ok) throw new Error('Report not found');
          const fullReport = await res.json();

          let fileObj = jobs[jobId]?.file;
          if (!fileObj) {
            try {
              const fileRes = await fetch(`${API_BASE_URL}/reports/${jobId}/file`);
              if (fileRes.ok) {
                const blob = await fileRes.blob();
                fileObj = new File([blob], fullReport.filename, { type: 'application/pdf' });
              }
            } catch (e) {
              console.error('Error fetching file:', e);
            }
          }

          setJobs(prev => ({
            ...prev,
            [jobId]: {
              ...prev[jobId],
              id: jobId,
              filename: fullReport.filename,
              results: fullReport.results,
              contractText: fullReport.contract_text,
              file: fileObj,
              status: 'completed',
              timestamp: fullReport.timestamp
            }
          }));
        } catch (error) {
          console.error('Error fetching full report:', error);
          toast.error('Failed to load report details');
          return;
        }
      }

      setAppState(prev => ({
        ...prev,
        view: 'review',
        selectedContractId: jobId
      }));
      fetchStats();
    } else if (view === 'start-analysis' && data) {
      const jobId = Date.now().toString();
      const newJob: AnalysisJob = {
        id: jobId,
        filename: data.filename,
        file: data.file,
        status: 'analyzing',
        timestamp: new Date().toISOString()
      };
      setJobs(prev => ({ ...prev, [jobId]: newJob }));

      // Navigate to dashboard while it's running in the background
      setAppState(prev => ({ ...prev, view: 'dashboard' }));

      toast.info(`Analysis started for ${data.filename}`, {
        description: 'This may take up to 10 minutes. You can continue using the app.'
      });

      // Kick off analysis — include risk sensitivity from settings
      const formData = new FormData();
      formData.append('file', data.file);

      fetch(`${API_BASE_URL}/analyze?sensitivity=${settings.riskLevel}`, {
        method: 'POST',
        body: formData,
      })
        .then(res => {
          if (!res.ok) throw new Error('Analysis failed');
          return res.json();
        })
        .then(analysisData => {
          toast.success(`Analysis completed for ${data.filename}`);

          setJobs(prev => ({
            ...prev,
            [analysisData.id]: {
              id: analysisData.id,
              filename: analysisData.filename,
              status: 'completed',
              results: analysisData.results,
              contractText: analysisData.contract_text,
              file: prev[jobId]?.file,
              timestamp: new Date().toISOString()
            }
          }));
          // Remove temporary job if id changed
          if (analysisData.id !== jobId) {
            setJobs(prev => {
              const newJobs = { ...prev };
              delete newJobs[jobId];
              return newJobs;
            });
          }
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

    } else if (view === 'delete-report' && data) {
      try {
        const res = await fetch(`${API_BASE_URL}/reports/${data}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          setJobs(prev => {
            const newJobs = { ...prev };
            delete newJobs[data];
            return newJobs;
          });
          toast.success('Report deleted');
          fetchStats();
        }
      } catch (error) {
        toast.error('Failed to delete report');
      }
    } else if (view === 'clear-all' && data) {
      try {
        const res = await fetch(`${API_BASE_URL}/reports`, {
          method: 'DELETE'
        });
        if (res.ok) {
          setJobs({});
          toast.success('All reports cleared');
          fetchStats();
        }
      } catch (error) {
        toast.error('Failed to clear reports');
      }
    } else {
      if (view === 'dashboard') fetchStats();
      setAppState(prev => ({
        ...prev,
        view: view as View,
        selectedContractId: typeof data === 'string' ? data : undefined
      }));
    }
  };

  const renderView = () => {
    switch (appState.view) {
      case 'dashboard':
        return (
          <Dashboard
            onViewChange={handleViewChange}
            stats={appState.dashboardStats}
            jobs={jobs}
            autoFlag={settings.autoFlag}
          />
        );
      case 'upload':
        return <UploadContract onViewChange={handleViewChange} />;
      case 'review':
        const selectedJob = jobs[appState.selectedContractId || ''];
        return (
          <ContractReview
            results={selectedJob?.results || []}
            filename={selectedJob?.filename || ''}
            contractText={selectedJob?.contractText}
            file={selectedJob?.file}
          />
        );
      case 'reports':
        return <PastReports onViewChange={handleViewChange} jobs={jobs} />;
      case 'library':
        return <GoldenClauseLibrary />;
      case 'settings':
        return <Settings settings={settings} onSave={handleSaveSettings} />;
      default:
        return <Dashboard onViewChange={handleViewChange} stats={appState.dashboardStats} autoFlag={settings.autoFlag} />;
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

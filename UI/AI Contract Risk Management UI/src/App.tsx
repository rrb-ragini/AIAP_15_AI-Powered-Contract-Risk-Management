import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { UploadContract } from './components/UploadContract';
import { ContractReview } from './components/ContractReview';
import { RiskReport } from './components/RiskReport';
import { GoldenClauseLibrary } from './components/GoldenClauseLibrary';
import { Settings } from './components/Settings';

type View = 'dashboard' | 'upload' | 'library' | 'reports' | 'clauses' | 'settings' | 'review';

interface AppState {
  view: View;
  selectedContractId?: string;
  analysisResults?: any;
  dashboardStats?: any;
  contractText?: string;
}

export default function App() {
  const [appState, setAppState] = useState<AppState>({
    view: 'dashboard'
  });

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
      setAppState({
        view: 'review',
        analysisResults: data.results,
        selectedContractId: data.filename,
        contractText: data.contract_text
      });
      fetchStats(); // Refresh stats after analysis
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
        return <Dashboard onViewChange={handleViewChange} stats={appState.dashboardStats} />;
      case 'upload':
        return <UploadContract onViewChange={handleViewChange} />;
      case 'review':
        return <ContractReview results={appState.analysisResults} filename={appState.selectedContractId} contractText={appState.contractText} />;
      case 'reports':
        return <RiskReport results={appState.analysisResults} />;
      case 'library':
        return <GoldenClauseLibrary />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onViewChange={handleViewChange} stats={appState.dashboardStats} />;
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar activeView={appState.view} onViewChange={handleViewChange} />
      {renderView()}
    </div>
  );
}

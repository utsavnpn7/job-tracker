import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardTab } from './components/DashboardTab';
import { PipelineTab } from './components/PipelineTab';
import { AppliedTrackerTab } from './components/AppliedTrackerTab';
import { CvEditorTab } from './components/CvEditorTab';
import { GeneratedCvsTab } from './components/GeneratedCvsTab';
import { PortalsTab } from './components/PortalsTab';

export function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isConnected, setIsConnected] = useState(false);

  // Data States
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [recentApplied, setRecentApplied] = useState<any[]>([]);
  const [recentEvaluated, setRecentEvaluated] = useState<any[]>([]);
  const [portalHealth, setPortalHealth] = useState<any[]>([]);
  const [pendingPipeline, setPendingPipeline] = useState<any[]>([]);
  const [processedPipeline, setProcessedPipeline] = useState<any[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<any[]>([]);
  const [cvContent, setCvContent] = useState('');
  const [generatedFiles, setGeneratedFiles] = useState<any[]>([]);
  const [portalsData, setPortalsData] = useState<any>(null);

  // Agent Process Terminal State
  const [terminalLogs, setTerminalLogs] = useState('');
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [activeProcessingUrl, setActiveProcessingUrl] = useState<string | null>(null);
  const [isLoadingCv, setIsLoadingCv] = useState(false);

  // Fetch Dashboard Stats
  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard');
      const json = await res.json();
      if (json.success) {
        setDashboardStats(json.stats);
        setRecentApplied(json.recentApplied || []);
        setRecentEvaluated(json.recentEvaluated || []);
        setPortalHealth(json.portalHealth || []);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard', err);
    }
  };

  // Fetch Pipeline Items
  const fetchPipeline = async () => {
    try {
      const res = await fetch('/api/pipeline');
      const json = await res.json();
      if (json.success) {
        setPendingPipeline(json.pending || []);
        setProcessedPipeline(json.processed || []);
      }
    } catch (err) {
      console.error('Failed to fetch pipeline', err);
    }
  };

  // Fetch Applied Jobs
  const fetchAppliedJobs = async () => {
    try {
      const res = await fetch('/api/applied');
      const json = await res.json();
      if (json.success) {
        setAppliedJobs(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch applied jobs', err);
    }
  };

  // Fetch Base CV
  const fetchCv = async () => {
    setIsLoadingCv(true);
    try {
      const res = await fetch('/api/cv');
      const json = await res.json();
      if (json.success) {
        setCvContent(json.content || '');
      }
    } catch (err) {
      console.error('Failed to fetch CV', err);
    } finally {
      setIsLoadingCv(false);
    }
  };

  // Fetch Generated CVs
  const fetchGeneratedFiles = async () => {
    try {
      const res = await fetch('/api/cv/generated');
      const json = await res.json();
      if (json.success) {
        setGeneratedFiles(json.files || []);
      }
    } catch (err) {
      console.error('Failed to fetch generated files', err);
    }
  };

  // Fetch Portals Data
  const fetchPortals = async () => {
    try {
      const res = await fetch('/api/portals');
      const json = await res.json();
      if (json.success) {
        setPortalsData(json);
      }
    } catch (err) {
      console.error('Failed to fetch portals', err);
    }
  };

  // Setup Real-time SSE Connection
  useEffect(() => {
    fetchDashboard();
    fetchPipeline();
    fetchAppliedJobs();
    fetchCv();
    fetchGeneratedFiles();
    fetchPortals();

    const eventSource = new EventSource('/api/events');

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onerror = () => {
      setIsConnected(false);
    };

    eventSource.addEventListener('applied_updated', () => {
      fetchDashboard();
      fetchAppliedJobs();
    });

    eventSource.addEventListener('pipeline_updated', () => {
      fetchDashboard();
      fetchPipeline();
    });

    eventSource.addEventListener('cv_updated', () => {
      fetchCv();
      fetchGeneratedFiles();
    });

    eventSource.addEventListener('portals_updated', () => {
      fetchDashboard();
      fetchPortals();
    });

    eventSource.addEventListener('agent_log', (event: any) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.text) {
          setTerminalLogs((prev) => prev + payload.text);
        }
      } catch (e) {}
    });

    eventSource.addEventListener('agent_finish', () => {
      setIsAgentRunning(false);
      setActiveProcessingUrl(null);
      fetchDashboard();
      fetchPipeline();
      fetchAppliedJobs();
      fetchGeneratedFiles();
    });

    return () => {
      eventSource.close();
    };
  }, []);

  // Pipeline Handlers
  const handleProcessPipelineItem = async (url: string) => {
    setIsAgentRunning(true);
    setActiveProcessingUrl(url);
    setTerminalLogs(
      (prev) =>
        prev +
        `\n\n========================================\n[PIPELINE PROCESSOR]: Evaluating target job listing: ${url}\n========================================\n`
    );

    try {
      const response = await fetch('/api/pipeline/process-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          setTerminalLogs((prev) => prev + chunk);
        }
      }
    } catch (err: any) {
      setTerminalLogs((prev) => prev + `\n[PIPELINE ERROR]: ${err.message}\n`);
    } finally {
      setIsAgentRunning(false);
      setActiveProcessingUrl(null);
      fetchDashboard();
      fetchPipeline();
      fetchAppliedJobs();
      fetchGeneratedFiles();
    }
  };

  const handleAddPipelineUrl = async (data: any) => {
    await fetch('/api/pipeline/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    fetchDashboard();
    fetchPipeline();
  };

  // Application Handlers
  const handleAddApplication = async (data: any) => {
    await fetch('/api/applied', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    fetchDashboard();
    fetchAppliedJobs();
  };

  const handleUpdateStatus = async (id: string, updates: any) => {
    await fetch(`/api/applied/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    fetchDashboard();
    fetchAppliedJobs();
  };

  const handleDeleteApplication = async (id: string) => {
    await fetch(`/api/applied/${id}`, { method: 'DELETE' });
    fetchDashboard();
    fetchAppliedJobs();
  };

  // CV Save Handler
  const handleSaveCv = async (content: string) => {
    await fetch('/api/cv', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    fetchCv();
  };

  // Portals Handlers
  const handleTogglePortal = async (type: 'query' | 'company', name: string, enabled: boolean) => {
    await fetch('/api/portals/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, name, enabled }),
    });
    fetchPortals();
    fetchDashboard();
  };

  const handleAddCompany = async (data: any) => {
    await fetch('/api/portals/company', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    fetchPortals();
    fetchDashboard();
  };

  // Agent Run Handler
  const handleRunAgent = async (command: string) => {
    setIsAgentRunning(true);
    setTerminalLogs(
      (prev) =>
        prev +
        `\n\n========================================\n[AGENT LAUNCH]: Executing command: ${command}\n========================================\n`
    );

    try {
      const response = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          setTerminalLogs((prev) => prev + chunk);
        }
      }
    } catch (err: any) {
      setTerminalLogs((prev) => prev + `\n[AGENT ERROR]: ${err.message}\n`);
    } finally {
      setIsAgentRunning(false);
      fetchDashboard();
      fetchPipeline();
      fetchAppliedJobs();
      fetchGeneratedFiles();
    }
  };

  return (
    <div className="app-container">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={dashboardStats}
        isConnected={isConnected}
        onRunAgent={handleRunAgent}
        isAgentRunning={isAgentRunning}
      />

      <main className="main-content">
        {activeTab === 'dashboard' && (
          <DashboardTab
            stats={dashboardStats}
            recentApplied={recentApplied}
            recentEvaluated={recentEvaluated}
            portalHealth={portalHealth}
            terminalLogs={terminalLogs}
            onRunAgent={handleRunAgent}
            isAgentRunning={isAgentRunning}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'pipeline' && (
          <PipelineTab
            pendingItems={pendingPipeline}
            processedItems={processedPipeline}
            onProcessItem={handleProcessPipelineItem}
            onRunBatchPipeline={() => handleRunAgent('or:pipeline')}
            onAddPipelineUrl={handleAddPipelineUrl}
            terminalLogs={terminalLogs}
            isProcessing={isAgentRunning}
            activeProcessingUrl={activeProcessingUrl}
          />
        )}

        {activeTab === 'applied' && (
          <AppliedTrackerTab
            appliedJobs={appliedJobs}
            onAddApplication={handleAddApplication}
            onUpdateStatus={handleUpdateStatus}
            onDeleteApplication={handleDeleteApplication}
          />
        )}

        {activeTab === 'cv' && (
          <CvEditorTab
            cvContent={cvContent}
            onSaveCv={handleSaveCv}
            isLoading={isLoadingCv}
          />
        )}

        {activeTab === 'generated-cvs' && (
          <GeneratedCvsTab
            generatedFiles={generatedFiles}
            onRefreshFiles={fetchGeneratedFiles}
            onRunAgent={handleRunAgent}
            isAgentRunning={isAgentRunning}
          />
        )}

        {activeTab === 'portals' && (
          <PortalsTab
            portalsData={portalsData}
            onTogglePortal={handleTogglePortal}
            onAddCompany={handleAddCompany}
            onRunAgent={handleRunAgent}
            isAgentRunning={isAgentRunning}
          />
        )}
      </main>
    </div>
  );
}

export default App;

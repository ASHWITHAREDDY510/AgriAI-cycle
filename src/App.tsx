import { useState, useEffect, useMemo } from 'react';
import { NavTab, WasteBatch, WasteStatus } from './types/batch';
import {
  getStoredBatches,
  addBatch,
  updateBatchStatus,
  deleteBatch,
  resetDemoData,
  calculateKPIStats,
} from './utils/storage';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { Dashboard } from './components/Dashboard';
import { RegisterWasteForm } from './components/RegisterWasteForm';
import { BatchHistory } from './components/BatchHistory';
import { ClassifyBiomass } from './components/ClassifyBiomass';
import { BatchDetailModal } from './components/BatchDetailModal';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [batches, setBatches] = useState<WasteBatch[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<WasteBatch | null>(null);
  const [selectedBatchForClassify, setSelectedBatchForClassify] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize from localStorage
  const refreshBatches = () => {
    const loaded = getStoredBatches();
    setBatches(loaded);
    // If selectedBatch is open, update its reference
    setSelectedBatch((prev) => (prev ? loaded.find((b) => b.id === prev.id) || null : null));
  };

  useEffect(() => {
    refreshBatches();
    setIsLoaded(true);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Dynamically calculate KPI statistics whenever batches change
  const stats = useMemo(() => calculateKPIStats(batches), [batches]);

  const handleAddBatch = (newBatch: WasteBatch) => {
    const updated = addBatch(newBatch);
    setBatches(updated);
    showToast(`Batch ${newBatch.id} successfully registered and saved.`);
  };

  const handleUpdateStatus = (id: string, newStatus: WasteStatus, notes?: string) => {
    const result = updateBatchStatus(id, newStatus, notes);
    setBatches(result.updatedBatches);
    if (selectedBatch && selectedBatch.id === id) {
      const fresh = result.updatedBatch || result.updatedBatches.find((b) => b.id === id) || null;
      setSelectedBatch(fresh);
    }
    showToast(result.message);
  };

  const handleDeleteBatch = (id: string) => {
    const updated = deleteBatch(id);
    setBatches(updated);
    if (selectedBatch && selectedBatch.id === id) {
      setSelectedBatch(null);
    }
    showToast(`Batch ${id} removed.`);
  };

  const handleResetDemo = () => {
    const reset = resetDemoData();
    setBatches(reset);
    showToast('Loaded Jagtial, Telangana demo records.');
  };

  const handleNavigateToClassify = (batchId?: string) => {
    if (batchId) {
      setSelectedBatchForClassify(batchId);
    }
    setCurrentTab('classify');
  };

  if (!isLoaded) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f6f8f6]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-700 border-t-transparent mx-auto" />
          <p className="mt-3 text-xs font-medium text-stone-600">Loading AgriCycle AI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f6f8f6] text-stone-900 antialiased overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
        totalBatchesCount={batches.length}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <TopHeader
          currentTab={currentTab}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          onNavigate={setCurrentTab}
          onResetDemo={handleResetDemo}
        />

        {/* Mobile Navigation Strip (Ensures Classify Biomass is immediately reachable on all viewports) */}
        <div className="md:hidden flex items-center gap-1.5 overflow-x-auto border-b border-stone-200 bg-white px-3 py-2 text-xs shrink-0">
          <button
            type="button"
            onClick={() => setCurrentTab('dashboard')}
            className={`whitespace-nowrap px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
              currentTab === 'dashboard'
                ? 'bg-emerald-800 text-white font-semibold shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab('classify')}
            className={`whitespace-nowrap px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
              currentTab === 'classify'
                ? 'bg-emerald-800 text-white font-semibold shadow-xs'
                : 'text-emerald-900 bg-emerald-50 hover:bg-emerald-100 font-semibold border border-emerald-200'
            }`}
          >
            Classify Biomass
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab('register')}
            className={`whitespace-nowrap px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
              currentTab === 'register'
                ? 'bg-emerald-800 text-white font-semibold shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Register Waste
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab('history')}
            className={`whitespace-nowrap px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
              currentTab === 'history'
                ? 'bg-emerald-800 text-white font-semibold shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Batch History ({batches.length})
          </button>
        </div>

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
          <div className="mx-auto max-w-7xl">
            {currentTab === 'dashboard' && (
              <Dashboard
                batches={batches}
                stats={stats}
                onNavigate={setCurrentTab}
                onViewBatch={setSelectedBatch}
                onNavigateToClassify={handleNavigateToClassify}
              />
            )}

            {currentTab === 'classify' && (
              <ClassifyBiomass
                batches={batches}
                preselectedBatchId={selectedBatchForClassify}
                onViewBatch={setSelectedBatch}
                onBatchUpdated={() => {
                  refreshBatches();
                  showToast('Biomass screening assessment recorded.');
                }}
              />
            )}

            {currentTab === 'register' && (
              <RegisterWasteForm
                existingBatches={batches}
                onAddBatch={handleAddBatch}
                onNavigateToHistory={() => setCurrentTab('history')}
              />
            )}

            {currentTab === 'history' && (
              <BatchHistory
                batches={batches}
                onViewBatch={setSelectedBatch}
                onUpdateStatus={handleUpdateStatus}
                onDeleteBatch={handleDeleteBatch}
                onResetDemo={handleResetDemo}
                onAssessBatch={handleNavigateToClassify}
              />
            )}
          </div>
        </main>
      </div>

      {/* Batch Details Modal */}
      <BatchDetailModal
        batch={selectedBatch}
        onClose={() => setSelectedBatch(null)}
        onUpdateStatus={handleUpdateStatus}
        onAssessBiomass={handleNavigateToClassify}
      />

      {/* Floating Feedback Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl border border-emerald-800/30 bg-[#112f23] px-4 py-3 text-xs font-medium text-white shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

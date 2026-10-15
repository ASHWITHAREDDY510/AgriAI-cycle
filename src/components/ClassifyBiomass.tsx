import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Clock,
  Info,
  AlertTriangle,
  RotateCcw,
  ShieldAlert,
  HelpCircle,
  AlertOctagon,
  CheckCircle2,
  Eye,
  ArrowRight,
  ShieldCheck,
  Ban,
  Layers,
} from 'lucide-react';
import {
  WasteBatch,
  BiomassAssessment,
  AssessmentStatus,
  StorageCondition,
  OdourProfile,
} from '../types/batch';
import {
  classifyBiomassBatch,
  getAllAssessments,
  getRecommendedNextAction,
  ClassificationFactors,
} from '../services/biomassClassifier';
import { AssessmentBadge } from './AssessmentBadge';
import { formatWeight } from '../utils/storage';

interface ClassifyBiomassProps {
  batches: WasteBatch[];
  onBatchUpdated: () => void;
  preselectedBatchId?: string | null;
  onViewBatch?: (batch: WasteBatch) => void;
}

export const ClassifyBiomass: React.FC<ClassifyBiomassProps> = ({
  batches,
  onBatchUpdated,
  preselectedBatchId,
  onViewBatch,
}) => {
  const [selectedBatchId, setSelectedBatchId] = useState<string>(
    preselectedBatchId || (batches.length > 0 ? batches[0].id : '')
  );

  // Dedicated rule-trigger factors matching the priority requirements
  const [hasChemicalSuspected, setHasChemicalSuspected] = useState(false);
  const [hasMoldReported, setHasMoldReported] = useState(false);
  const [hasPlasticMixed, setHasPlasticMixed] = useState(false);
  const [isInformationMissingOrUnknown, setIsInformationMissingOrUnknown] = useState(false);

  // Optional contextual observations
  const [storageCondition, setStorageCondition] = useState<StorageCondition>(
    'Dry open field stack'
  );
  const [odourProfile, setOdourProfile] = useState<OdourProfile>(
    'Fresh natural plant aroma'
  );
  const [visualNotes, setVisualNotes] = useState('');

  const [activeAssessment, setActiveAssessment] = useState<BiomassAssessment | null>(null);
  const [assessmentHistory, setAssessmentHistory] = useState<BiomassAssessment[]>([]);
  const [activeHistoryTab, setActiveHistoryTab] = useState<'current' | 'all'>('current');

  // Load history from storage on mount
  useEffect(() => {
    setAssessmentHistory(getAllAssessments());
  }, []);

  // Update selected batch if preselected changes
  useEffect(() => {
    if (preselectedBatchId) {
      setSelectedBatchId(preselectedBatchId);
      const b = batches.find((x) => x.id === preselectedBatchId);
      if (b && b.latestAssessment) {
        setActiveAssessment(b.latestAssessment);
      }
    }
  }, [preselectedBatchId, batches]);

  // Ensure a batch is selected as soon as batches load from storage
  useEffect(() => {
    if (!selectedBatchId && batches.length > 0) {
      setSelectedBatchId(batches[0].id);
    }
  }, [batches, selectedBatchId]);

  const selectedBatch =
    batches.find((b) => b.id === selectedBatchId) ||
    (batches.length > 0 ? batches[0] : undefined);

  // Sync active assessment and checkbox factors with selected batch
  useEffect(() => {
    const active = selectedBatch;
    if (active && active.latestAssessment) {
      setActiveAssessment(active.latestAssessment);
      const obs = active.latestAssessment.observedFactors;
      setHasChemicalSuspected(
        !!obs.hasChemicalSuspected ||
          obs.contamination === 'Suspected chemical / pesticide residue'
      );
      setHasMoldReported(
        !!obs.hasMoldReported || obs.contamination === 'Visible mold / fungal decay'
      );
      setHasPlasticMixed(
        !!obs.hasPlasticMixed || obs.contamination === 'Mixed plastic / synthetic waste'
      );
      setIsInformationMissingOrUnknown(
        !!obs.isInformationMissingOrUnknown ||
          obs.contamination === 'Unknown discoloration or foreign matter'
      );
    } else {
      setActiveAssessment(null);
      setHasChemicalSuspected(false);
      setHasMoldReported(false);
      setHasPlasticMixed(false);
      setIsInformationMissingOrUnknown(false);
    }
  }, [selectedBatchId, selectedBatch]);

  const handleRunAssessment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedBatch) return;

    const factors: ClassificationFactors = {
      hasChemicalSuspected,
      hasMoldReported,
      hasPlasticMixed,
      isInformationMissingOrUnknown,
      storageCondition,
      odourProfile,
      visualNotes: visualNotes.trim() || undefined,
    };

    const result = classifyBiomassBatch(selectedBatch, factors);
    setActiveAssessment(result);
    setAssessmentHistory(getAllAssessments());
    onBatchUpdated();
  };

  const handleResetChecklist = () => {
    setHasChemicalSuspected(false);
    setHasMoldReported(false);
    setHasPlasticMixed(false);
    setIsInformationMissingOrUnknown(false);
    setVisualNotes('');
    setStorageCondition('Dry open field stack');
    setOdourProfile('Fresh natural plant aroma');
  };

  // Quick preset helper to quickly test all four statuses
  const applyTestingPreset = (preset: 'chemical' | 'mold' | 'plastic' | 'unknown' | 'clean') => {
    switch (preset) {
      case 'chemical':
        setHasChemicalSuspected(true);
        setHasMoldReported(false);
        setHasPlasticMixed(false);
        setIsInformationMissingOrUnknown(false);
        break;
      case 'mold':
        setHasChemicalSuspected(false);
        setHasMoldReported(true);
        setHasPlasticMixed(false);
        setIsInformationMissingOrUnknown(false);
        break;
      case 'plastic':
        setHasChemicalSuspected(false);
        setHasMoldReported(false);
        setHasPlasticMixed(true);
        setIsInformationMissingOrUnknown(false);
        break;
      case 'unknown':
        setHasChemicalSuspected(false);
        setHasMoldReported(false);
        setHasPlasticMixed(false);
        setIsInformationMissingOrUnknown(true);
        break;
      case 'clean':
        setHasChemicalSuspected(false);
        setHasMoldReported(false);
        setHasPlasticMixed(false);
        setIsInformationMissingOrUnknown(false);
        break;
    }
  };

  const filteredHistory =
    activeHistoryTab === 'current'
      ? assessmentHistory.filter((a) => a.batchId === selectedBatchId)
      : assessmentHistory;

  // Derive Recommended Next Action synchronized with active assessment
  const nextActionGuidance = activeAssessment
    ? getRecommendedNextAction(activeAssessment.status, activeAssessment.observedFactors)
    : null;

  // The batch object associated with the active assessment (or currently selected)
  const activeBatchRecord =
    (activeAssessment && batches.find((b) => b.id === activeAssessment.batchId)) ||
    selectedBatch;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Required Transparency & Screening Notice */}
      <div className="rounded-xl border border-emerald-900/15 bg-white p-4 text-xs text-stone-700 shadow-xs">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 shrink-0 text-emerald-800 mt-0.5" />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-stone-900">
                Demo screening logic, not a trained ML model
              </span>
              <span className="bg-emerald-50 text-emerald-800 font-medium px-2 py-0.5 rounded text-[11px] border border-emerald-200">
                Rule-Based Evaluation
              </span>
            </div>
            <p className="text-stone-600 leading-relaxed">
              This screening tool applies priority rules for field triage in Jagtial, Telangana.{' '}
              <strong>
                Never claim that a batch is medically safe or suitable for fertilizer without further testing.
              </strong>{' '}
              Laboratory assays are mandatory prior to chemical, pharmacological, or commercial fertilizer application.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Batch Selection & Priority Condition Checklist */}
        <div className="lg:col-span-6 space-y-6">
          {/* Step 1: Batch Selection */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
            <div className="pb-4 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-stone-900">1. Select Registered Batch</h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Choose a batch recorded from Jagtial to evaluate with priority screening rules
                </p>
              </div>
              {selectedBatch && onViewBatch && (
                <button
                  type="button"
                  onClick={() => onViewBatch(selectedBatch)}
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>View Batch Details</span>
                </button>
              )}
            </div>

            <div className="mt-4">
              <label htmlFor="batchSelect" className="block text-xs font-medium text-stone-700 mb-1">
                Registered Waste Batch
              </label>
              <select
                id="batchSelect"
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.id} · {b.farmerName} ({b.wasteType} · {b.mandal})
                  </option>
                ))}
              </select>
            </div>

            {selectedBatch && (
              <div className="mt-4 rounded-xl bg-stone-50 p-4 border border-stone-200/80 text-xs space-y-2">
                <div className="flex justify-between items-center border-b border-stone-200 pb-2">
                  <span className="text-stone-700 font-mono font-bold text-sm">
                    {selectedBatch.id}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-stone-400">Current Status:</span>
                    <AssessmentBadge status={selectedBatch.latestAssessment?.status} size="sm" />
                    {onViewBatch && (
                      <button
                        type="button"
                        onClick={() => onViewBatch(selectedBatch)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 underline underline-offset-2 ml-1"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Details</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-stone-700">
                  <div>
                    <span className="text-[11px] text-stone-400 block">Farmer & Mandal</span>
                    <strong className="font-semibold text-stone-900">{selectedBatch.farmerName}</strong>
                    <div className="text-[11px] text-stone-500">
                      {selectedBatch.village}, {selectedBatch.mandal}
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-stone-400 block">Waste Type & Quantity</span>
                    <strong className="font-semibold text-stone-900">{selectedBatch.wasteType}</strong>
                    <div className="text-[11px] text-stone-600 tabular-nums font-medium">
                      {(selectedBatch.quantityKg ?? 0).toLocaleString()} kg (
                      {formatWeight(selectedBatch.quantityKg).value}{' '}
                      {formatWeight(selectedBatch.quantityKg).unit})
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-200 flex justify-between text-[11px] text-stone-600">
                  <span>
                    Intended Destination: <strong>{selectedBatch.intendedUse}</strong>
                  </span>
                  <span className="font-mono text-stone-500">{selectedBatch.collectionDate}</span>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Priority Rules Checklist */}
          <form
            onSubmit={handleRunAssessment}
            className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h2 className="text-base font-bold text-stone-900">
                  2. Field Contamination Screening
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Select observed conditions; rules execute in strict priority order
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetChecklist}
                className="text-[11px] text-stone-500 hover:text-stone-800 inline-flex items-center gap-1"
                title="Reset factors to clean baseline"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Quick Status Testing Scenarios Bar (Ensures all four statuses can be tested quickly) */}
            <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-3 text-xs space-y-2">
              <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block">
                Quick Status Testing Presets
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => applyTestingPreset('chemical')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                    hasChemicalSuspected
                      ? 'bg-rose-700 text-white shadow-xs'
                      : 'bg-white border border-stone-200 text-rose-800 hover:bg-rose-50'
                  }`}
                >
                  1. Potentially Contaminated
                </button>
                <button
                  type="button"
                  onClick={() => applyTestingPreset('mold')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                    hasMoldReported && !hasChemicalSuspected
                      ? 'bg-amber-700 text-white shadow-xs'
                      : 'bg-white border border-stone-200 text-amber-800 hover:bg-amber-50'
                  }`}
                >
                  2. Requires Inspection (Mold)
                </button>
                <button
                  type="button"
                  onClick={() => applyTestingPreset('plastic')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                    hasPlasticMixed && !hasChemicalSuspected && !hasMoldReported
                      ? 'bg-amber-700 text-white shadow-xs'
                      : 'bg-white border border-stone-200 text-amber-800 hover:bg-amber-50'
                  }`}
                >
                  3. Requires Inspection (Plastic)
                </button>
                <button
                  type="button"
                  onClick={() => applyTestingPreset('unknown')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                    isInformationMissingOrUnknown &&
                    !hasChemicalSuspected &&
                    !hasMoldReported &&
                    !hasPlasticMixed
                      ? 'bg-stone-700 text-white shadow-xs'
                      : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  4. Unverified
                </button>
                <button
                  type="button"
                  onClick={() => applyTestingPreset('clean')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                    !hasChemicalSuspected &&
                    !hasMoldReported &&
                    !hasPlasticMixed &&
                    !isInformationMissingOrUnknown
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-white border border-stone-200 text-emerald-800 hover:bg-emerald-50'
                  }`}
                >
                  5. Potentially Suitable
                </button>
              </div>
            </div>

            {/* Priority Rules Checklist */}
            <div className="space-y-3">
              {/* Priority 1 */}
              <label
                className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer text-xs transition-colors ${
                  hasChemicalSuspected
                    ? 'border-rose-400 bg-rose-50/50 text-rose-950 shadow-xs'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-800'
                }`}
              >
                <input
                  type="checkbox"
                  checked={hasChemicalSuspected}
                  onChange={(e) => setHasChemicalSuspected(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded text-rose-600 focus:ring-rose-500 border-stone-300"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">1. Pesticide or chemical contamination suspected</span>
                    <span className="text-[10px] uppercase font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                      Highest Priority
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">
                    Chemical fertilizer caking, pesticide overspray, or industrial petroleum/solvent odor.
                    <span className="text-rose-700 font-medium block mt-0.5">
                      Classifies as &quot;Potentially contaminated&quot; and overrides all other rules.
                    </span>
                  </p>
                </div>
              </label>

              {/* Priority 2 */}
              <label
                className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer text-xs transition-colors ${
                  hasMoldReported
                    ? 'border-amber-400 bg-amber-50/50 text-amber-950 shadow-xs'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-800'
                }`}
              >
                <input
                  type="checkbox"
                  checked={hasMoldReported}
                  onChange={(e) => setHasMoldReported(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded text-amber-600 focus:ring-amber-500 border-stone-300"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">2. Mold or fungal growth reported</span>
                    <span className="text-[10px] uppercase font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                      Priority 2
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">
                    Visible fungal mycelium, gray/black mildew patches, damp rot, or musty decay smell.
                    <span className="text-amber-800 font-medium block mt-0.5">
                      Classifies as &quot;Requires inspection&quot;.
                    </span>
                  </p>
                </div>
              </label>

              {/* Priority 3 */}
              <label
                className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer text-xs transition-colors ${
                  hasPlasticMixed
                    ? 'border-amber-400 bg-amber-50/50 text-amber-950 shadow-xs'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-800'
                }`}
              >
                <input
                  type="checkbox"
                  checked={hasPlasticMixed}
                  onChange={(e) => setHasPlasticMixed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded text-amber-600 focus:ring-amber-500 border-stone-300"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">3. Plastic or synthetic waste mixed in</span>
                    <span className="text-[10px] uppercase font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                      Priority 3
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">
                    Polythene mulch film pieces, drip irrigation lines, nylon baling twines, or synthetic debris.
                    <span className="text-amber-800 font-medium block mt-0.5">
                      Classifies as &quot;Requires inspection&quot;.
                    </span>
                  </p>
                </div>
              </label>

              {/* Priority 4 */}
              <label
                className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer text-xs transition-colors ${
                  isInformationMissingOrUnknown
                    ? 'border-stone-400 bg-stone-100 text-stone-900 shadow-xs'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-800'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isInformationMissingOrUnknown}
                  onChange={(e) => setIsInformationMissingOrUnknown(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded text-stone-700 focus:ring-stone-500 border-stone-300"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">4. Contamination information missing or unknown</span>
                    <span className="text-[10px] uppercase font-semibold text-stone-600 bg-stone-200 px-1.5 py-0.5 rounded">
                      Priority 4
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">
                    No field observation logged, unverified field history, or unknown atypical discoloration.
                    <span className="text-stone-800 font-medium block mt-0.5">
                      Classifies as &quot;Unverified&quot;.
                    </span>
                  </p>
                </div>
              </label>

              {/* Priority 5 Indicator */}
              <div className="rounded-lg bg-emerald-50/50 p-2.5 border border-emerald-200/80 text-[11px] text-emerald-900 flex items-center justify-between">
                <span>
                  <strong>5. Otherwise:</strong> If none of the above are checked, classifies as{' '}
                  <strong>&quot;Potentially suitable for further processing&quot;</strong>.
                </span>
                <span className="text-[10px] font-bold text-emerald-800 uppercase bg-emerald-100 px-1.5 py-0.5 rounded">
                  Default Clean
                </span>
              </div>
            </div>

            {/* Optional Inspector Notes */}
            <div>
              <label htmlFor="visNotes" className="block text-xs font-medium text-stone-700 mb-1">
                Field Inspector Observation Notes (Optional)
              </label>
              <input
                id="visNotes"
                type="text"
                value={visualNotes}
                onChange={(e) => setVisualNotes(e.target.value)}
                placeholder="e.g. Field stacked on dry tarpaulin, visual check completed"
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            {/* Assess Biomass CTA Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!selectedBatch}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 disabled:opacity-50 transition-colors"
              >
                <FileCheck2 className="h-4 w-4" />
                <span>Assess Biomass</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Output Result, Recommended Next Action & History */}
        <div className="lg:col-span-6 space-y-6">
          {/* Active Result Card displaying all required fields */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div>
                <h2 className="text-base font-bold text-stone-900">Assessment Result</h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Screening evaluation outcome
                </p>
              </div>
              <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Demo screening logic, not a trained ML model
              </span>
            </div>

            {activeAssessment ? (
              <div className="mt-5 space-y-5">
                {/* Status Banner */}
                <div
                  className={`rounded-xl border p-4.5 ${
                    activeAssessment.status === 'Potentially suitable for further processing'
                      ? 'border-emerald-200 bg-emerald-50/60 text-emerald-950'
                      : activeAssessment.status === 'Requires inspection'
                      ? 'border-amber-200 bg-amber-50/60 text-amber-950'
                      : activeAssessment.status === 'Potentially contaminated'
                      ? 'border-rose-200 bg-rose-50/60 text-rose-950'
                      : 'border-stone-200 bg-stone-100 text-stone-900'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                      Assessment Status
                    </span>
                    <AssessmentBadge status={activeAssessment.status} />
                  </div>
                  <h3 className="text-xl font-bold mt-2 tracking-tight">
                    {activeAssessment.status}
                  </h3>
                  <div className="mt-2 flex items-center gap-2 text-[11px] opacity-75 font-mono">
                    <Clock className="h-3 w-3" />
                    <span>
                      Timestamp:{' '}
                      {activeAssessment.assessedAt
                        ? new Date(activeAssessment.assessedAt).toLocaleString()
                        : new Date().toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Core Batch Details & View Batch Details Action */}
                <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-4 space-y-2 text-xs">
                  <div className="flex justify-between items-center border-b border-stone-200/80 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-stone-500 font-medium">Batch ID:</span>
                      <span className="font-mono font-bold text-emerald-950">
                        {activeAssessment.batchId}
                      </span>
                    </div>
                    {onViewBatch && activeBatchRecord && (
                      <button
                        type="button"
                        onClick={() => onViewBatch(activeBatchRecord)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 hover:underline"
                      >
                        <Eye className="h-3 w-3" />
                        <span>View Batch Details</span>
                      </button>
                    )}
                  </div>
                  <div className="flex justify-between border-b border-stone-200/80 pb-2">
                    <span className="text-stone-500 font-medium">Waste Type:</span>
                    <span className="font-semibold text-stone-900">
                      {activeAssessment.batchWasteType}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-stone-200/80 pb-2">
                    <span className="text-stone-500 font-medium">Quantity:</span>
                    <span className="font-bold text-stone-900 tabular-nums">
                      {(() => {
                        const qty =
                          typeof activeAssessment.quantityKg === 'number'
                            ? activeAssessment.quantityKg
                            : (activeBatchRecord?.quantityKg ?? 0);
                        const weight = formatWeight(qty);
                        return `${qty.toLocaleString()} kg (${weight.value} ${weight.unit})`;
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-stone-500 font-medium">Assessment Ref:</span>
                    <span className="font-mono text-stone-600 text-[11px]">
                      {activeAssessment.id}
                    </span>
                  </div>
                </div>

                {/* Reason for the Result */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                    Reason for Result
                  </span>
                  <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3.5 text-xs text-stone-800 leading-relaxed">
                    <p className="font-medium text-stone-900">{activeAssessment.reason}</p>
                    <p className="mt-2 text-stone-600 text-[11px] pt-2 border-t border-stone-200/60">
                      {activeAssessment.explanation}
                    </p>
                  </div>
                </div>

                {/* Triggered Rules */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
                    Applied Priority Rules
                  </span>
                  <ul className="space-y-1 text-xs">
                    {activeAssessment.triggeredRules.map((rule, idx) => (
                      <li
                        key={idx}
                        className="rounded-lg border border-stone-200 bg-white p-2.5 font-mono text-[11px] text-stone-800"
                      >
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* ============================================================== */}
                {/* Dedicated RECOMMENDED NEXT ACTION Section                     */}
                {/* Synchronized with the latest assessment status & prompt rules */}
                {/* ============================================================== */}
                <div className="rounded-xl border border-emerald-900/20 bg-white shadow-xs overflow-hidden">
                  {/* Section Title Header */}
                  <div className="bg-emerald-900 px-4 py-3 flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-300" />
                      <h4 className="text-xs font-bold tracking-wide uppercase">
                        Recommended Next Action
                      </h4>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-200">
                      {activeAssessment.status}
                    </span>
                  </div>

                  <div className="p-4 space-y-3.5 text-xs">
                    {/* Status 1: Potentially suitable for further processing */}
                    {activeAssessment.status ===
                      'Potentially suitable for further processing' && (
                      <div className="space-y-3">
                        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-emerald-950 flex items-start gap-2.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider mb-0.5">
                              Next Step Recommendation
                            </div>
                            <div className="font-semibold text-emerald-950 text-xs sm:text-sm leading-snug">
                              Recommend preliminary feedstock review and appropriate verification before reuse.
                            </div>
                          </div>
                        </div>

                        <p className="text-stone-600 text-[11px] leading-relaxed pl-1">
                          {nextActionGuidance?.actionDetails ||
                            'Conduct preliminary feedstock review at the destination bio-energy or composting facility. Confirm residue moisture content and physical cleanliness remain nominal during handling and transit before reuse.'}
                        </p>
                      </div>
                    )}

                    {/* Status 2: Requires inspection */}
                    {activeAssessment.status === 'Requires inspection' && (
                      <div className="space-y-3">
                        <div className="rounded-lg bg-amber-50 border border-amber-300 p-3 text-amber-950 flex items-start gap-2.5">
                          <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-0.5">
                              Next Step Recommendation
                            </div>
                            <div className="font-semibold text-amber-950 text-xs sm:text-sm leading-snug">
                              Recommend keeping the batch segregated and arranging an appropriate inspection.
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5 pl-1 text-[11px]">
                          <p className="text-stone-700 leading-relaxed">
                            {nextActionGuidance?.actionDetails ||
                              'Maintain this residue lot strictly segregated from other inventory in a designated holding buffer. Arrange an appropriate physical inspection to evaluate fungal/mold decay severity or coordinate segregation of mixed synthetic plastic debris.'}
                          </p>
                          <div className="rounded bg-amber-100/60 p-2 text-amber-900 font-medium text-[11px] border border-amber-200">
                            <strong>Notice:</strong> Do not mix with general processing lines until physical inspection confirms segregation or drying requirements are fulfilled.
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Status 3: Potentially contaminated */}
                    {activeAssessment.status === 'Potentially contaminated' && (
                      <div className="space-y-3">
                        <div className="rounded-lg bg-rose-50 border border-rose-300 p-3 text-rose-950 flex items-start gap-2.5">
                          <AlertOctagon className="h-4 w-4 text-rose-700 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-[11px] font-bold text-rose-900 uppercase tracking-wider mb-0.5">
                              Next Step Recommendation
                            </div>
                            <div className="font-semibold text-rose-950 text-xs sm:text-sm leading-snug">
                              Recommend keeping the batch isolated from other biomass and arranging suitable contamination assessment. Do not assign it directly to fertilizer or healthcare-material processing.
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 pl-1 text-[11px]">
                          <p className="text-stone-700 leading-relaxed">
                            {nextActionGuidance?.actionDetails ||
                              'Quarantine this lot in an isolated containment perimeter away from waterways and other biomass lots. Arrange a suitable laboratory contamination assessment (gas chromatography / pesticide residue screen).'}
                          </p>
                          <div className="rounded bg-rose-100/80 p-2.5 text-rose-900 font-bold text-xs border border-rose-200 flex items-start gap-2">
                            <Ban className="h-4 w-4 text-rose-700 shrink-0 mt-0.5" />
                            <span>
                              Strict Prohibition: Do not assign this batch directly to fertilizer or healthcare-material processing under any circumstances.
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Status 4: Unverified */}
                    {activeAssessment.status === 'Unverified' && (
                      <div className="space-y-3">
                        <div className="rounded-lg bg-stone-100 border border-stone-300 p-3 text-stone-900 flex items-start gap-2.5">
                          <HelpCircle className="h-4 w-4 text-stone-600 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-0.5">
                              Next Step Recommendation
                            </div>
                            <div className="font-semibold text-stone-900 text-xs sm:text-sm leading-snug">
                              Explain which required information is missing and request further assessment.
                            </div>
                          </div>
                        </div>

                        {/* Explicit Missing Required Information Breakdown */}
                        <div className="rounded-lg bg-amber-50/80 border border-amber-200 p-3 text-xs space-y-1.5">
                          <div className="font-bold text-amber-950 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-700" />
                            <span>Missing Required Information</span>
                          </div>
                          <p className="text-amber-900 text-[11px] leading-relaxed">
                            {nextActionGuidance?.missingInformationExplanation ||
                              'Field contamination observation records, sensory verification (odor profile), and verified storage environment are missing or incomplete.'}
                          </p>
                          <div className="pt-1 border-t border-amber-200/80 text-[11px] text-amber-950 font-medium">
                            <strong>Action Request:</strong> Further physical assessment is required before authorizing batch intake, transport, or reuse.
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Toolbar with "View Batch Details" Button */}
                    <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-[11px] text-stone-500">
                        Batch Record Ref: <strong className="font-mono text-stone-700">{activeAssessment.batchId}</strong>
                      </span>
                      {onViewBatch && activeBatchRecord && (
                        <button
                          type="button"
                          onClick={() => onViewBatch(activeBatchRecord)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-900 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View Batch Details</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Safety & Compliance Notice */}
                <div className="rounded-lg bg-amber-50/70 border border-amber-200 p-2.5 text-[11px] text-amber-900 flex items-start gap-2">
                  <Info className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>Testing Disclaimer:</strong> Never claim that a batch is medically safe or suitable for fertilizer without further testing. Laboratory testing is required before soil application or pharmaceutical usage.
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-stone-500 space-y-2">
                <HelpCircle className="h-10 w-10 mx-auto text-stone-300" />
                <h4 className="text-sm font-semibold text-stone-800">No Assessment Run Yet</h4>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Select a batch on the left, check observed conditions, and click{' '}
                  <strong>&quot;Assess Biomass&quot;</strong> to evaluate and generate the Recommended Next Action.
                </p>
              </div>
            )}
          </div>

          {/* Preserved Assessment History */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-sm font-bold text-stone-900">Preserved Assessment History</h3>
                <p className="text-[11px] text-stone-500">Timestamped evaluation records</p>
              </div>

              {/* Segmented control for history scope */}
              <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setActiveHistoryTab('current')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    activeHistoryTab === 'current'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  This Batch ({assessmentHistory.filter((a) => a.batchId === selectedBatchId).length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveHistoryTab('all')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    activeHistoryTab === 'all'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  All ({assessmentHistory.length})
                </button>
              </div>
            </div>

            {filteredHistory.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-400">
                No previous assessments recorded for this selection.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {filteredHistory.map((item) => {
                  const itemBatch = batches.find((b) => b.id === item.batchId);
                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-stone-200 bg-stone-50/50 p-3 text-xs space-y-1.5 hover:bg-stone-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-emerald-950 text-[11px]">
                            {item.batchId}
                          </span>
                          <span className="text-[11px] text-stone-500">
                            ({item.batchWasteType})
                          </span>
                          <span className="text-[11px] text-stone-600 tabular-nums">
                            {typeof item.quantityKg === 'number' && !isNaN(item.quantityKg)
                              ? `${item.quantityKg.toLocaleString()} kg`
                              : ''}
                          </span>
                        </div>
                        <AssessmentBadge status={item.status} size="sm" />
                      </div>

                      <div className="text-[11px] text-stone-700 leading-snug">
                        <strong>Reason:</strong> {item.reason}
                      </div>

                      <div className="text-[11px] text-emerald-900 bg-emerald-50/60 p-2 rounded border border-emerald-100">
                        <strong>Next Step:</strong> {item.recommendedNextStep}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1 border-t border-stone-200/60 font-mono">
                        <span>ID: {item.id}</span>
                        <div className="flex items-center gap-2">
                          {onViewBatch && itemBatch && (
                            <button
                              type="button"
                              onClick={() => onViewBatch(itemBatch)}
                              className="font-sans text-[11px] font-semibold text-emerald-800 hover:underline"
                            >
                              View Batch
                            </button>
                          )}
                          <span>
                            {item.assessedAt
                              ? new Date(item.assessedAt).toLocaleString()
                              : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

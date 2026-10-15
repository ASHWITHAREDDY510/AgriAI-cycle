import React, { useEffect, useState } from 'react';
import {
  X,
  User,
  Phone,
  MapPin,
  Calendar,
  Sprout,
  ArrowRight,
  ShieldCheck,
  Clock,
  Info,
  History,
  AlertTriangle,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { WasteBatch, WasteStatus, WORKFLOW_STATUSES, WorkflowStatus } from '../types/batch';
import { StatusBadge } from './StatusBadge';
import { AssessmentBadge } from './AssessmentBadge';
import { formatCurrencyINR, formatWeight, isRestrictedFromDirectProcessing } from '../utils/storage';

interface BatchDetailModalProps {
  batch: WasteBatch | null;
  onClose: () => void;
  onUpdateStatus: (id: string, newStatus: WasteStatus, notes?: string) => void;
  onAssessBiomass?: (batchId: string) => void;
}

export const BatchDetailModal: React.FC<BatchDetailModalProps> = ({
  batch,
  onClose,
  onUpdateStatus,
  onAssessBiomass,
}) => {
  const [selectedNewStatus, setSelectedNewStatus] = useState<WasteStatus>('Registered');
  const [statusNotes, setStatusNotes] = useState('');

  // Keep local status state synchronized with current batch
  useEffect(() => {
    if (batch) {
      setSelectedNewStatus(batch.status);
      setStatusNotes('');
    }
  }, [batch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!batch) return null;

  const weightInfo = formatWeight(batch.quantityKg);
  const assessment = batch.latestAssessment;
  const isContaminatedOrUnverified = isRestrictedFromDirectProcessing(batch);

  const handleRunAssessmentClick = () => {
    if (onAssessBiomass) {
      onAssessBiomass(batch.id);
      onClose();
    }
  };

  const handleStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateStatus(batch.id, selectedNewStatus, statusNotes);
    setStatusNotes('');
  };

  // Rule 8 indicator
  const isDirectProcessingBlocked =
    selectedNewStatus === 'Sent for processing' && isContaminatedOrUnverified;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl border border-stone-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-batch-title"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50 px-6 py-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-sm font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              {batch.id}
            </span>
            <StatusBadge status={batch.status} />
            <AssessmentBadge status={assessment?.status} />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-200 hover:text-stone-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="max-h-[75vh] overflow-y-auto p-6 space-y-6">
          {/* Top Summary Banner */}
          <div className="rounded-xl border border-emerald-100 bg-[#f4f9f5] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
                Crop Residue Type
              </span>
              <h2 id="modal-batch-title" className="text-xl font-bold text-stone-900 mt-0.5">
                {batch.wasteType}
              </h2>
              <p className="text-xs text-stone-600 mt-1">
                Moisture Content:{' '}
                <strong className="font-medium text-stone-800">{batch.moistureLevel}</strong>
              </p>
            </div>
            <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-emerald-100">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
                Total Weight
              </span>
              <div className="text-2xl font-bold text-stone-900 tabular-nums">
                {weightInfo.value} <span className="text-sm font-semibold">{weightInfo.unit}</span>
              </div>
              <span className="text-xs text-stone-500 block">
                {(batch.quantityKg ?? 0).toLocaleString()} kg total
              </span>
            </div>
          </div>

          {/* ============================================================== */}
          {/* WORKFLOW STATUS TRACKER & UPDATE SECTION                      */}
          {/* Requirements 1, 2, 3, 4, 5, 8                                  */}
          {/* ============================================================== */}
          <div className="rounded-xl border border-stone-200 bg-white p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                  Workflow Status Tracker
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-stone-600">Current Status:</span>
                  <StatusBadge status={batch.status} size="sm" />
                </div>
              </div>

              {batch.statusHistory && batch.statusHistory.length > 0 && (
                <span className="text-[11px] text-stone-400 font-mono">
                  Updated: {new Date(batch.statusHistory[0].timestamp).toLocaleDateString()}
                </span>
              )}
            </div>

            {/* Status Update Form (Dropdown + Optional Notes) */}
            <form onSubmit={handleStatusSubmit} className="space-y-3 bg-stone-50 p-4 rounded-xl border border-stone-200">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-6">
                  <label htmlFor="workflowStatusSelect" className="block text-xs font-semibold text-stone-700 mb-1">
                    Update Workflow Status
                  </label>
                  <select
                    id="workflowStatusSelect"
                    value={selectedNewStatus}
                    onChange={(e) => setSelectedNewStatus(e.target.value as WasteStatus)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  >
                    {WORKFLOW_STATUSES.map((ws) => (
                      <option key={ws} value={ws}>
                        {ws}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-6">
                  <label htmlFor="statusNotesInput" className="block text-xs font-semibold text-stone-700 mb-1">
                    Update Notes (Optional)
                  </label>
                  <input
                    id="statusNotesInput"
                    type="text"
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    placeholder="e.g. Driver Ramesh dispatched; moisture OK"
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              {/* Safety Rule 8 Alert Banner */}
              {isDirectProcessingBlocked && (
                <div className="rounded-lg bg-amber-50 border border-amber-300 p-3 text-xs text-amber-950 flex items-start gap-2 animate-in fade-in duration-150">
                  <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">
                      Safety Protocol: Direct Processing Prohibited
                    </span>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-amber-900">
                      This batch is classified as{' '}
                      <strong>{assessment ? assessment.status : 'Unverified (not screened)'}</strong>.
                      Batches that are potentially contaminated or unverified cannot be sent directly for processing.
                      Saving will automatically route this batch to <strong>&quot;Sent for inspection&quot;</strong>.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-900 transition-colors"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Update Status</span>
                </button>
              </div>
            </form>

            {/* Status History Timeline (Requirement 5) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5 text-emerald-700" />
                  <span>Status History Timeline</span>
                </span>
                <span className="text-[11px] text-stone-500 font-medium">
                  {batch.statusHistory?.length || 1} recorded transition{(batch.statusHistory?.length || 1) > 1 ? 's' : ''}
                </span>
              </div>

              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
                {(batch.statusHistory && batch.statusHistory.length > 0
                  ? batch.statusHistory
                  : [
                      {
                        status: batch.status,
                        timestamp: batch.createdAt,
                        notes: batch.notes || 'Batch registered in Jagtial Hub',
                      },
                    ]
                ).map((item, idx) => (
                  <div key={idx} className="relative group text-xs">
                    {/* Timeline Node Dot */}
                    <div
                      className={`absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 ${
                        idx === 0
                          ? 'border-emerald-600 bg-emerald-500 ring-2 ring-emerald-100'
                          : 'border-stone-400 bg-white'
                      }`}
                    />

                    <div className="bg-stone-50/80 rounded-xl p-3 border border-stone-200/80 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <StatusBadge status={item.status} size="sm" />
                        <span className="text-[11px] font-mono text-stone-500">
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                      </div>

                      {item.notes && (
                        <p className="text-[11px] text-stone-700 italic pt-1 border-t border-stone-200/60 mt-1">
                          &quot;{item.notes}&quot;
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Latest Quality Screening Section */}
          <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-700" />
                <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Biomass Quality Assessment
                </span>
              </div>
              {onAssessBiomass && (
                <button
                  type="button"
                  onClick={handleRunAssessmentClick}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition-colors"
                >
                  <span>{assessment ? 'Re-Assess Biomass' : 'Assess Biomass'}</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>

            {assessment ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 bg-stone-50 p-2.5 rounded-lg border border-stone-200 text-xs">
                  <div>
                    <span className="text-[11px] text-stone-500 block">Screening Status:</span>
                    <strong className="text-stone-900 font-semibold">{assessment.status}</strong>
                  </div>
                  <div className="text-right text-[11px] text-stone-500 font-mono">
                    <div>Ref: {assessment.id}</div>
                    <div className="flex items-center gap-1 justify-end">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(assessment.assessedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Reason for Result */}
                <div className="text-xs text-stone-800 leading-relaxed bg-stone-50 p-3 rounded-lg border border-stone-200">
                  <span className="font-semibold text-stone-900 block mb-0.5">Reason for Result:</span>
                  {assessment.reason || assessment.explanation}
                </div>

                {/* Triggered Rules */}
                <div>
                  <span className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider block mb-1">
                    Triggered Deterministic Rules:
                  </span>
                  <ul className="space-y-1">
                    {assessment.triggeredRules.map((rule, idx) => (
                      <li
                        key={idx}
                        className="text-[11px] font-mono text-stone-700 bg-stone-50 p-2 rounded border border-stone-200/80"
                      >
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Explanation */}
                <div className="text-xs text-stone-700 leading-relaxed bg-stone-50/70 p-3 rounded-lg border border-stone-100">
                  <span className="font-semibold text-stone-900 block mb-0.5">Screening Rationale:</span>
                  {assessment.explanation}
                </div>

                {/* Recommended Next Action Section */}
                <div className="rounded-xl border border-emerald-900/15 bg-white p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                    <span className="font-bold text-stone-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                      <span>Recommended Next Action</span>
                    </span>
                    <span className="text-[11px] font-mono text-stone-500">{assessment.status}</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-emerald-950 font-medium text-xs leading-relaxed">
                    {assessment.recommendedNextStep}
                  </div>

                  {assessment.status === 'Unverified' && (
                    <div className="rounded bg-amber-50 p-2 border border-amber-200 text-amber-900 text-[11px]">
                      <strong>Missing Required Information:</strong> Field contamination checklist and sensory inspection logs are unverified or incomplete. Further physical assessment is required before intake.
                    </div>
                  )}

                  {assessment.status === 'Potentially contaminated' && (
                    <div className="rounded bg-rose-50 p-2 border border-rose-200 text-rose-900 text-[11px] font-bold">
                      Strict Prohibition: Do not assign this batch directly to fertilizer or healthcare-material processing under any circumstances.
                    </div>
                  )}
                </div>

                {/* Disclaimer */}
                <div className="flex items-start gap-1.5 text-[10px] text-amber-900 bg-amber-50/60 p-2 rounded border border-amber-200">
                  <Info className="h-3.5 w-3.5 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    Transparent rule-based demo screening. Not an ML model. Does not replace laboratory certification.
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-stone-50 p-3 rounded-lg text-xs text-stone-600">
                <span>No screening assessment logged for this batch yet.</span>
                {onAssessBiomass && (
                  <button
                    type="button"
                    onClick={handleRunAssessmentClick}
                    className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 transition-colors"
                  >
                    Assess Now
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Farmer & Location Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-stone-200 p-4 space-y-3 bg-white">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
                Farmer Information
              </span>
              <div className="flex items-center gap-2.5 text-sm text-stone-900">
                <User className="h-4 w-4 text-emerald-700 shrink-0" />
                <span className="font-medium">{batch.farmerName}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-stone-700">
                <Phone className="h-4 w-4 text-emerald-700 shrink-0" />
                <span className="font-mono tabular-nums">+91 {batch.farmerPhone}</span>
              </div>
            </div>

            <div className="rounded-xl border border-stone-200 p-4 space-y-3 bg-white">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
                Origin & Jurisdiction
              </span>
              <div className="flex items-center gap-2.5 text-sm text-stone-900">
                <MapPin className="h-4 w-4 text-emerald-700 shrink-0" />
                <span>
                  <strong>{batch.village}</strong>, {batch.mandal} Mandal
                </span>
              </div>
              <div className="text-xs text-stone-500 pl-6">
                District: Jagtial · State: Telangana
              </div>
            </div>
          </div>

          {/* Processing Pathway & Ecological Valuation */}
          <div className="rounded-xl border border-stone-200 p-4 space-y-4 bg-white">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
              Bio-Conversion & Impact Assessment
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-stone-50 p-3 rounded-lg border border-stone-100">
                <div className="flex items-center gap-1.5 text-xs text-stone-600 mb-1">
                  <Sprout className="h-3.5 w-3.5 text-emerald-700" />
                  <span>Target Utilization</span>
                </div>
                <div className="text-xs font-semibold text-stone-900 leading-snug">
                  {batch.intendedUse}
                </div>
              </div>

              <div className="bg-stone-50 p-3 rounded-lg border border-stone-100">
                <div className="flex items-center gap-1.5 text-xs text-stone-600 mb-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                  <span>CO2e Avoided</span>
                </div>
                <div className="text-base font-bold text-stone-900 tabular-nums">
                  {(batch.carbonOffsetKg ?? 0).toLocaleString()} kg
                </div>
                <span className="text-[11px] text-stone-500">Prevented burning emissions</span>
              </div>

              <div className="bg-stone-50 p-3 rounded-lg border border-stone-100">
                <div className="flex items-center gap-1.5 text-xs text-stone-600 mb-1">
                  <span>₹</span>
                  <span>Est. Biomass Value</span>
                </div>
                <div className="text-base font-bold text-emerald-800 tabular-nums">
                  {formatCurrencyINR(batch.estimatedBiomassValueINR)}
                </div>
                <span className="text-[11px] text-stone-500">Rural market potential</span>
              </div>
            </div>
          </div>

          {/* Notes & Timestamps */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                Target Collection Date: <strong>{batch.collectionDate}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>Logged: {new Date(batch.createdAt).toLocaleDateString()}</span>
            </div>
            {batch.notes && (
              <div className="rounded-lg bg-stone-50 border border-stone-200 p-3 text-xs text-stone-700">
                <span className="font-semibold text-stone-900 block mb-1">
                  Batch Notes & Location Instructions:
                </span>
                {batch.notes}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end border-t border-stone-200 bg-stone-50 px-6 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

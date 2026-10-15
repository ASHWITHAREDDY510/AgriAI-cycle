import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  Trash2,
  Inbox,
  RotateCcw,
  ShieldCheck,
  MapPin,
} from 'lucide-react';
import { WasteBatch, WasteStatus, AssessmentStatus, WORKFLOW_STATUSES } from '../types/batch';
import { JAGTIAL_MANDALS, WASTE_TYPES } from '../data/jagtialData';
import { StatusBadge } from './StatusBadge';
import { AssessmentBadge } from './AssessmentBadge';
import { formatWeight } from '../utils/storage';

interface BatchHistoryProps {
  batches: WasteBatch[];
  onViewBatch: (batch: WasteBatch) => void;
  onUpdateStatus: (id: string, status: WasteStatus, notes?: string) => void;
  onDeleteBatch: (id: string) => void;
  onResetDemo: () => void;
  onAssessBatch?: (batchId: string) => void;
}

type SortField = 'date' | 'quantity' | 'name' | 'id';
type SortOrder = 'desc' | 'asc';

const ALL_STATUSES = WORKFLOW_STATUSES;

const SCREENING_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'All Screening Statuses' },
  { value: 'Potentially suitable for further processing', label: 'Potentially Suitable' },
  { value: 'Requires inspection', label: 'Requires Inspection' },
  { value: 'Potentially contaminated', label: 'Potentially Contaminated' },
  { value: 'Unverified', label: 'Unverified' },
  { value: 'NOT_SCREENED', label: 'Not Yet Screened' },
];

export const BatchHistory: React.FC<BatchHistoryProps> = ({
  batches,
  onViewBatch,
  onUpdateStatus,
  onDeleteBatch,
  onResetDemo,
  onAssessBatch,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMandal, setSelectedMandal] = useState<string>('ALL');
  const [selectedWasteType, setSelectedWasteType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedScreening, setSelectedScreening] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filter and sort
  const filteredBatches = useMemo(() => {
    return batches
      .filter((batch) => {
        // Search filter
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase().trim();
          const matches =
            batch.id.toLowerCase().includes(q) ||
            batch.farmerName.toLowerCase().includes(q) ||
            batch.village.toLowerCase().includes(q) ||
            batch.mandal.toLowerCase().includes(q) ||
            batch.wasteType.toLowerCase().includes(q) ||
            batch.farmerPhone.includes(q);
          if (!matches) return false;
        }

        // Mandal filter
        if (selectedMandal !== 'ALL' && batch.mandal !== selectedMandal) {
          return false;
        }

        // Waste type filter
        if (selectedWasteType !== 'ALL' && batch.wasteType !== selectedWasteType) {
          return false;
        }

        // Status filter
        if (selectedStatus !== 'ALL' && batch.status !== selectedStatus) {
          return false;
        }

        // Screening status filter
        if (selectedScreening !== 'ALL') {
          if (selectedScreening === 'NOT_SCREENED') {
            if (batch.latestAssessment) return false;
          } else {
            if (batch.latestAssessment?.status !== selectedScreening) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortField === 'date') {
          diff = new Date(a.collectionDate).getTime() - new Date(b.collectionDate).getTime();
        } else if (sortField === 'quantity') {
          diff = a.quantityKg - b.quantityKg;
        } else if (sortField === 'name') {
          diff = a.farmerName.localeCompare(b.farmerName);
        } else if (sortField === 'id') {
          diff = a.id.localeCompare(b.id);
        }
        return sortOrder === 'asc' ? diff : -diff;
      });
  }, [
    batches,
    searchTerm,
    selectedMandal,
    selectedWasteType,
    selectedStatus,
    selectedScreening,
    sortField,
    sortOrder,
  ]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedMandal('ALL');
    setSelectedWasteType('ALL');
    setSelectedStatus('ALL');
    setSelectedScreening('ALL');
    setSortField('date');
    setSortOrder('desc');
  };

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    selectedMandal !== 'ALL' ||
    selectedWasteType !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    selectedScreening !== 'ALL';

  return (
    <div className="space-y-6">
      {/* Top Filter and Search Control Card */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search box */}
          <div className="md:col-span-4 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search ID, Farmer, Mandal, Crop..."
              className="w-full rounded-lg border border-stone-300 pl-9 pr-3 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Mandal Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedMandal}
              onChange={(e) => setSelectedMandal(e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
            >
              <option value="ALL">All Mandals ({JAGTIAL_MANDALS.length})</option>
              {JAGTIAL_MANDALS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Waste Type Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedWasteType}
              onChange={(e) => setSelectedWasteType(e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
            >
              <option value="ALL">All Crop Types</option>
              {WASTE_TYPES.map((wt) => (
                <option key={wt} value={wt}>
                  {wt}
                </option>
              ))}
            </select>
          </div>

          {/* Screening Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedScreening}
              onChange={(e) => setSelectedScreening(e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
            >
              {SCREENING_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
            >
              <option value="ALL">All Workflow Statuses</option>
              {ALL_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Second Row: Sorting, Quick summary, and Reset Filter */}
        <div className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-600">
          <div className="flex items-center gap-3">
            <span className="font-medium text-stone-900">
              Showing <span className="tabular-nums font-bold text-emerald-800">{filteredBatches.length}</span> of {batches.length} batches
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1 text-emerald-800 hover:text-emerald-950 font-medium underline"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-stone-500 flex items-center gap-1">
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span>Sort:</span>
            </span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="rounded-md border border-stone-300 bg-white px-2.5 py-1 text-xs text-stone-800 focus:outline-hidden"
            >
              <option value="date">Collection Date</option>
              <option value="quantity">Quantity (Weight)</option>
              <option value="name">Farmer Name</option>
              <option value="id">Batch ID</option>
            </select>
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="rounded-md border border-stone-300 bg-white px-2 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              title="Toggle sort direction"
            >
              {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Table / List View */}
      {filteredBatches.length === 0 ? (
        <div className="rounded-xl border border-stone-200 bg-white p-12 text-center">
          <Inbox className="mx-auto h-10 w-10 text-stone-400" />
          <h3 className="mt-3 text-sm font-semibold text-stone-900">No matching batches found</h3>
          <p className="mt-1 text-xs text-stone-500">
            {hasActiveFilters
              ? 'Try adjusting your search criteria or clearing active filters.'
              : 'No agricultural waste batches recorded yet.'}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-800 hover:bg-stone-200"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Clear All Filters</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-xl border border-stone-200 bg-white overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th scope="col" className="px-5 py-3">Batch ID</th>
                    <th scope="col" className="px-5 py-3">Farmer & Location</th>
                    <th scope="col" className="px-5 py-3">Residue Type</th>
                    <th scope="col" className="px-5 py-3 text-right">Quantity</th>
                    <th scope="col" className="px-5 py-3">Screening Status</th>
                    <th scope="col" className="px-5 py-3">Workflow Status</th>
                    <th scope="col" className="px-5 py-3">Pickup Date</th>
                    <th scope="col" className="px-5 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {filteredBatches.map((batch) => {
                    const weight = formatWeight(batch.quantityKg);
                    return (
                      <tr key={batch.id} className="hover:bg-emerald-50/25 transition-colors">
                        <td className="px-5 py-3.5 font-mono font-bold text-emerald-900 whitespace-nowrap">
                          {batch.id}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-stone-900">{batch.farmerName}</div>
                          <div className="text-[11px] text-stone-500">
                            {batch.village}, {batch.mandal}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-medium text-stone-800">{batch.wasteType}</div>
                          <div className="text-[11px] text-stone-500">{batch.moistureLevel}</div>
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <div className="font-bold text-stone-900 tabular-nums">
                            {weight.value} <span className="text-[11px] font-medium text-stone-600">{weight.unit}</span>
                          </div>
                          <div className="text-[11px] text-stone-500 tabular-nums">
                            {(batch.quantityKg ?? 0).toLocaleString()} kg
                          </div>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <AssessmentBadge status={batch.latestAssessment?.status} size="sm" />
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <StatusBadge status={batch.status} size="sm" />
                            <select
                              value={batch.status}
                              onChange={(e) => onUpdateStatus(batch.id, e.target.value as WasteStatus)}
                              className="rounded border border-stone-200 bg-white px-1.5 py-0.5 text-[10px] text-stone-600 hover:border-stone-400 focus:outline-hidden"
                              title="Update status"
                            >
                              {ALL_STATUSES.map((st) => (
                                <option key={st} value={st}>
                                  Change: {st}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-stone-600 font-mono text-[11px]">
                          {batch.collectionDate}
                        </td>
                        <td className="px-5 py-3.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onViewBatch(batch)}
                              title="View complete batch details"
                              className="rounded-md border border-stone-200 bg-white p-1.5 text-stone-700 hover:border-emerald-500 hover:text-emerald-800 transition-colors"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            {onAssessBatch && (
                              <button
                                type="button"
                                onClick={() => onAssessBatch(batch.id)}
                                title="Run biomass screening"
                                className="rounded-md border border-emerald-200 bg-emerald-50/70 p-1.5 text-emerald-800 hover:bg-emerald-100 transition-colors"
                              >
                                <ShieldCheck className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(batch.id)}
                              title="Delete record"
                              className="rounded-md border border-stone-200 bg-white p-1.5 text-stone-400 hover:border-red-300 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filteredBatches.map((batch) => {
              const weight = formatWeight(batch.quantityKg);
              return (
                <div
                  key={batch.id}
                  className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {batch.id}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <AssessmentBadge status={batch.latestAssessment?.status} size="sm" />
                      <StatusBadge status={batch.status} size="sm" />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-stone-900">{batch.farmerName}</h4>
                    <div className="flex items-center gap-1 text-xs text-stone-500 mt-0.5">
                      <MapPin className="h-3 w-3 text-emerald-700" />
                      <span>{batch.village}, {batch.mandal} Mandal</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                    <div>
                      <span className="text-[11px] text-stone-500 block">Residue</span>
                      <strong className="text-stone-800 font-semibold">{batch.wasteType}</strong>
                    </div>
                    <div>
                      <span className="text-[11px] text-stone-500 block">Quantity</span>
                      <strong className="text-stone-900 font-bold tabular-nums">
                        {weight.value} {weight.unit} ({(batch.quantityKg ?? 0).toLocaleString()} kg)
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
                    <span className="font-mono text-stone-500">{batch.collectionDate}</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onViewBatch(batch)}
                        className="inline-flex items-center gap-1 rounded-md border border-stone-200 px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-50"
                      >
                        <Eye className="h-3 w-3 text-emerald-700" />
                        <span>Details</span>
                      </button>
                      {onAssessBatch && (
                        <button
                          type="button"
                          onClick={() => onAssessBatch(batch.id)}
                          className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800"
                        >
                          <ShieldCheck className="h-3 w-3" />
                          <span>Assess</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(batch.id)}
                        className="rounded-md border border-stone-200 p-1 text-stone-400 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg border border-stone-200">
            <h3 className="text-base font-bold text-stone-900">Delete Batch Record?</h3>
            <p className="mt-2 text-xs text-stone-600 leading-relaxed">
              Are you sure you want to delete batch <strong className="font-mono">{deleteConfirmId}</strong>? This action will remove it from localStorage.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-lg border border-stone-300 px-3.5 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteBatch(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="rounded-lg bg-red-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-red-700"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

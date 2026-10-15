import React from 'react';
import { Eye, ArrowUpRight, Inbox, ShieldCheck } from 'lucide-react';
import { WasteBatch } from '../types/batch';
import { StatusBadge } from './StatusBadge';
import { AssessmentBadge } from './AssessmentBadge';
import { formatWeight } from '../utils/storage';

interface RecentBatchesTableProps {
  batches: WasteBatch[];
  onViewBatch: (batch: WasteBatch) => void;
  onNavigateToHistory: () => void;
  onNavigateToClassify?: (batchId: string) => void;
}

export const RecentBatchesTable: React.FC<RecentBatchesTableProps> = ({
  batches,
  onViewBatch,
  onNavigateToHistory,
  onNavigateToClassify,
}) => {
  const recentBatches = batches.slice(0, 6);

  if (batches.length === 0) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-12 text-center">
        <Inbox className="mx-auto h-10 w-10 text-stone-400" />
        <h3 className="mt-3 text-sm font-semibold text-stone-900">No waste batches recorded yet</h3>
        <p className="mt-1 text-xs text-stone-500">
          Register your first agricultural residue batch to start tracking.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-xs">
      <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
        <div>
          <h2 className="text-base font-bold text-stone-900">Recent Agricultural Waste Batches</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Latest crop residue entries logged across Jagtial mandals with screening state
          </p>
        </div>
        <button
          type="button"
          onClick={onNavigateToHistory}
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition-colors"
        >
          <span>View All ({batches.length})</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50/75 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
              <th scope="col" className="px-5 py-3">Batch ID</th>
              <th scope="col" className="px-5 py-3">Farmer & Location</th>
              <th scope="col" className="px-5 py-3">Residue Type</th>
              <th scope="col" className="px-5 py-3 text-right">Quantity</th>
              <th scope="col" className="px-5 py-3">Screening Assessment</th>
              <th scope="col" className="px-5 py-3">Workflow Status</th>
              <th scope="col" className="px-5 py-3">Date</th>
              <th scope="col" className="px-5 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-stone-700">
            {recentBatches.map((batch) => {
              const weight = formatWeight(batch.quantityKg);
              return (
                <tr
                  key={batch.id}
                  className="hover:bg-emerald-50/30 transition-colors"
                >
                  <td className="px-5 py-3.5 font-mono font-semibold text-emerald-900 whitespace-nowrap">
                    {batch.id}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-stone-900">{batch.farmerName}</div>
                    <div className="text-[11px] text-stone-500">
                      {batch.village}, {batch.mandal}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-stone-800">{batch.wasteType}</div>
                    <div className="text-[11px] text-stone-500">Moisture: {batch.moistureLevel}</div>
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <div className="font-bold text-stone-900 tabular-nums">
                      {weight.value} <span className="text-[11px] font-normal text-stone-600">{weight.unit}</span>
                    </div>
                    <div className="text-[11px] text-stone-500 tabular-nums">
                      {(batch.quantityKg ?? 0).toLocaleString()} kg
                    </div>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <AssessmentBadge status={batch.latestAssessment?.status} size="sm" />
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <StatusBadge status={batch.status} size="sm" />
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-stone-600 font-mono text-[11px]">
                    {batch.collectionDate}
                  </td>
                  <td className="px-5 py-3.5 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onViewBatch(batch)}
                        className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2 py-1 text-xs font-medium text-stone-700 hover:border-emerald-500 hover:text-emerald-800 transition-colors"
                      >
                        <Eye className="h-3 w-3 text-emerald-700" />
                        <span>Details</span>
                      </button>
                      {onNavigateToClassify && (
                        <button
                          type="button"
                          onClick={() => onNavigateToClassify(batch.id)}
                          title="Screen this batch"
                          className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50/70 px-2 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100 transition-colors"
                        >
                          <ShieldCheck className="h-3 w-3" />
                          <span>Assess</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

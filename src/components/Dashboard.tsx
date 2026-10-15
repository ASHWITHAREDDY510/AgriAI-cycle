import React from 'react';
import { Plus, ArrowRight, ShieldCheck, MapPin, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { KPIStats, WasteBatch, NavTab } from '../types/batch';
import { KPICardsGrid } from './KPICardsGrid';
import { RecentBatchesTable } from './RecentBatchesTable';
import { formatWeight } from '../utils/storage';

interface DashboardProps {
  batches: WasteBatch[];
  stats: KPIStats;
  onNavigate: (tab: NavTab) => void;
  onViewBatch: (batch: WasteBatch) => void;
  onNavigateToClassify: (batchId?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  batches,
  stats,
  onNavigate,
  onViewBatch,
  onNavigateToClassify,
}) => {
  // Aggregate top crop residues
  const cropSummary = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const b of batches) {
      map[b.wasteType] = (map[b.wasteType] || 0) + b.quantityKg;
    }
    return Object.entries(map)
      .map(([type, kg]) => ({ type, kg }))
      .sort((a, b) => b.kg - a.kg);
  }, [batches]);

  // Aggregate screening states
  const screeningSummary = React.useMemo(() => {
    let suitable = 0;
    let inspection = 0;
    let contaminated = 0;
    let unverified = 0;
    let notScreened = 0;

    for (const b of batches) {
      if (!b.latestAssessment) {
        notScreened++;
      } else if (b.latestAssessment.status === 'Potentially suitable for further processing') {
        suitable++;
      } else if (b.latestAssessment.status === 'Requires inspection') {
        inspection++;
      } else if (b.latestAssessment.status === 'Potentially contaminated') {
        contaminated++;
      } else if (b.latestAssessment.status === 'Unverified') {
        unverified++;
      }
    }

    return { suitable, inspection, contaminated, unverified, notScreened };
  }, [batches]);

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <KPICardsGrid stats={stats} />

      {/* Biomass Quality Screening Strip */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-700" />
              <h2 className="text-sm font-bold text-stone-900">Biomass Quality Screening Overview</h2>
              <span className="text-[11px] text-stone-400 font-mono">Demo Rule-Based Logic</span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Rapid intake triage: {stats.assessedBatchesCount} of {batches.length} batches evaluated
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateToClassify()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-700 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors shrink-0"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Open Classifier</span>
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="rounded-lg bg-emerald-50/60 p-3 border border-emerald-200">
            <span className="text-[11px] font-semibold text-emerald-900 block">Potentially Suitable</span>
            <div className="text-xl font-bold text-emerald-950 tabular-nums mt-1">
              {screeningSummary.suitable}
            </div>
            <span className="text-[10px] text-emerald-700">Cleared for intake</span>
          </div>

          <div className="rounded-lg bg-amber-50/60 p-3 border border-amber-200">
            <span className="text-[11px] font-semibold text-amber-900 block">Requires Inspection</span>
            <div className="text-xl font-bold text-amber-950 tabular-nums mt-1">
              {screeningSummary.inspection}
            </div>
            <span className="text-[10px] text-amber-700">Mold / plastic debris</span>
          </div>

          <div className="rounded-lg bg-rose-50/60 p-3 border border-rose-200">
            <span className="text-[11px] font-semibold text-rose-900 block">Potentially Contaminated</span>
            <div className="text-xl font-bold text-rose-950 tabular-nums mt-1">
              {screeningSummary.contaminated}
            </div>
            <span className="text-[10px] text-rose-700">Suspected chemical / solvent</span>
          </div>

          <div className="rounded-lg bg-stone-100/70 p-3 border border-stone-200">
            <span className="text-[11px] font-semibold text-stone-700 block">Unverified</span>
            <div className="text-xl font-bold text-stone-900 tabular-nums mt-1">
              {screeningSummary.unverified}
            </div>
            <span className="text-[10px] text-stone-500">Field audit required</span>
          </div>

          <div className="rounded-lg bg-stone-50 p-3 border border-stone-200">
            <span className="text-[11px] font-semibold text-stone-500 block">Pending Screening</span>
            <div className="text-xl font-bold text-stone-800 tabular-nums mt-1">
              {screeningSummary.notScreened}
            </div>
            <span className="text-[10px] text-stone-400">Not yet assessed</span>
          </div>
        </div>
      </div>

      {/* Jagtial Agro-Eco Hub Highlight Banner */}
      <div className="rounded-2xl border border-emerald-800/20 bg-linear-to-r from-[#113022] to-[#1a4d37] p-6 text-white shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
              <MapPin className="h-4 w-4" />
              <span>Jagtial District Biomass Recovery Network</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-200/80">Telangana</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Transforming Crop Residue into Clean Bio-Energy
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
              Monitoring stubble and biomass diversion from open field burning across 17 Jagtial mandals. Supplying rural biomass briquetting, bio-CNG plants, and vermicomposting cooperatives.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('register')}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-xs font-bold text-stone-950 shadow-sm hover:bg-emerald-400 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Register New Batch</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('history')}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-600/70 bg-emerald-950/40 px-5 py-2.5 text-xs font-medium text-emerald-100 hover:bg-emerald-900/60 transition-colors"
            >
              <span>Explore All Batches ({batches.length})</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Residue Breakdown Bar */}
        <div className="mt-6 border-t border-emerald-700/50 pt-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300/80 mb-2.5">
            Key Jagtial Crop Residues in Circulation
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {cropSummary.slice(0, 4).map((crop) => {
              const weight = formatWeight(crop.kg);
              return (
                <div
                  key={crop.type}
                  className="rounded-lg bg-emerald-950/50 p-2.5 border border-emerald-700/40"
                >
                  <span className="text-[11px] text-emerald-200/80 truncate block" title={crop.type}>
                    {crop.type}
                  </span>
                  <div className="text-base font-bold text-white tabular-nums mt-0.5">
                    {weight.value} <span className="text-xs font-normal text-emerald-300">{weight.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Batches Table */}
      <RecentBatchesTable
        batches={batches}
        onViewBatch={onViewBatch}
        onNavigateToHistory={() => onNavigate('history')}
        onNavigateToClassify={onNavigateToClassify}
      />
    </div>
  );
};

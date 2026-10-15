import React from 'react';
import { Scale, Truck, Recycle, Leaf, Clock } from 'lucide-react';
import { KPIStats } from '../types/batch';
import { formatWeight } from '../utils/storage';

interface KPICardsGridProps {
  stats: KPIStats;
}

export const KPICardsGrid: React.FC<KPICardsGridProps> = ({ stats }) => {
  const totalFormatted = formatWeight(stats.totalWasteKg);
  const processedFormatted = formatWeight(stats.processedWasteKg);
  const carbonFormatted = formatWeight(stats.carbonOffsetKg);

  const conversionPercentage =
    stats.totalWasteKg > 0
      ? Math.round((stats.processedWasteKg / stats.totalWasteKg) * 100)
      : 0;

  const kpis = [
    {
      id: 'total-waste',
      title: 'Total Waste Registered',
      value: totalFormatted.value,
      unit: totalFormatted.unit,
      subtext: `${totalFormatted.secondary} across ${stats.totalBatches} batches`,
      icon: Scale,
      color: 'emerald',
    },
    {
      id: 'awaiting-collection',
      title: 'Awaiting Collection',
      value: (stats.awaitingCollectionCount ?? 0).toLocaleString(),
      unit: 'batches',
      subtext: `${stats.awaitingCollectionCount ?? 0} batches awaiting field pickup in Jagtial`,
      icon: Clock,
      color: 'amber',
    },
    {
      id: 'diverted-waste',
      title: 'Diverted & Processed',
      value: processedFormatted.value,
      unit: processedFormatted.unit,
      subtext: `${conversionPercentage}% of total residue converted to bio-resources`,
      icon: Recycle,
      color: 'teal',
    },
    {
      id: 'carbon-avoided',
      title: 'Est. CO2e Avoided',
      value: carbonFormatted.value,
      unit: carbonFormatted.unit,
      subtext: `Greenhouse emissions saved from open burning`,
      icon: Leaf,
      color: 'forest',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div
            key={kpi.id}
            className="rounded-xl border border-stone-200 bg-white p-5 transition-shadow hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                {kpi.title}
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
                <Icon className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-stone-900 tabular-nums sm:text-3xl">
                {kpi.value}
              </span>
              <span className="text-sm font-semibold text-stone-600">{kpi.unit}</span>
            </div>

            <p className="mt-2 text-xs text-stone-500 leading-relaxed">{kpi.subtext}</p>
          </div>
        );
      })}
    </div>
  );
};

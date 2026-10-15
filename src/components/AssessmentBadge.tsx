import React from 'react';
import { AssessmentStatus } from '../types/batch';
import { CheckCircle2, AlertTriangle, AlertOctagon, HelpCircle } from 'lucide-react';

interface AssessmentBadgeProps {
  status?: AssessmentStatus;
  size?: 'sm' | 'md';
}

export const AssessmentBadge: React.FC<AssessmentBadgeProps> = ({ status, size = 'md' }) => {
  if (!status) {
    const pad = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-md border border-stone-200 bg-stone-50 text-stone-500 font-medium whitespace-nowrap shrink-0 ${pad}`}
      >
        <HelpCircle className="h-3 w-3 text-stone-400" />
        <span>Not Screened</span>
      </span>
    );
  }

  const configs: Record<
    AssessmentStatus,
    { label: string; bg: string; text: string; border: string; icon: React.ElementType }
  > = {
    'Potentially suitable for further processing': {
      label: 'Potentially Suitable',
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      icon: CheckCircle2,
    },
    'Requires inspection': {
      label: 'Requires Inspection',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      icon: AlertTriangle,
    },
    'Potentially contaminated': {
      label: 'Potentially Contaminated',
      bg: 'bg-rose-50',
      text: 'text-rose-800',
      border: 'border-rose-200',
      icon: AlertOctagon,
    },
    'Unverified': {
      label: 'Unverified',
      bg: 'bg-stone-100',
      text: 'text-stone-700',
      border: 'border-stone-300',
      icon: HelpCircle,
    },
  };

  const cfg = configs[status] || configs['Unverified'];
  const Icon = cfg.icon;
  const paddingClass = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-medium whitespace-nowrap shrink-0 ${cfg.bg} ${cfg.text} ${cfg.border} ${paddingClass}`}
      title={status}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>{cfg.label}</span>
    </span>
  );
};

import React from 'react';
import { WasteStatus } from '../types/batch';
import {
  Clock,
  Truck,
  Cog,
  CheckCircle2,
  ClipboardList,
  Search,
  ShieldCheck,
  Layers,
  AlertTriangle,
  Archive,
} from 'lucide-react';

interface StatusBadgeProps {
  status: WasteStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const configs: Record<
    string,
    { label: string; bg: string; text: string; border: string; icon: React.ElementType }
  > = {
    Registered: {
      label: 'Registered',
      bg: 'bg-stone-100',
      text: 'text-stone-800',
      border: 'border-stone-300',
      icon: ClipboardList,
    },
    'Awaiting assessment': {
      label: 'Awaiting Assessment',
      bg: 'bg-indigo-50',
      text: 'text-indigo-800',
      border: 'border-indigo-200',
      icon: Search,
    },
    'Assessment completed': {
      label: 'Assessment Completed',
      bg: 'bg-teal-50',
      text: 'text-teal-800',
      border: 'border-teal-200',
      icon: ShieldCheck,
    },
    'Awaiting collection': {
      label: 'Awaiting Collection',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      icon: Clock,
    },
    Collected: {
      label: 'Collected',
      bg: 'bg-sky-50',
      text: 'text-sky-800',
      border: 'border-sky-200',
      icon: Truck,
    },
    Segregated: {
      label: 'Segregated',
      bg: 'bg-orange-50',
      text: 'text-orange-900',
      border: 'border-orange-200',
      icon: Layers,
    },
    'Sent for inspection': {
      label: 'Sent for Inspection',
      bg: 'bg-purple-50',
      text: 'text-purple-800',
      border: 'border-purple-200',
      icon: AlertTriangle,
    },
    'Sent for processing': {
      label: 'Sent for Processing',
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      icon: Cog,
    },
    Closed: {
      label: 'Closed',
      bg: 'bg-stone-100',
      text: 'text-stone-700',
      border: 'border-stone-300',
      icon: Archive,
    },

    // Legacy fallbacks
    'Pending Pickup': {
      label: 'Awaiting Collection',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      icon: Clock,
    },
    'In Transit': {
      label: 'Collected',
      bg: 'bg-sky-50',
      text: 'text-sky-800',
      border: 'border-sky-200',
      icon: Truck,
    },
    'Under Processing': {
      label: 'Sent for Processing',
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      icon: Cog,
    },
    'Completed / Converted': {
      label: 'Closed',
      bg: 'bg-stone-100',
      text: 'text-stone-700',
      border: 'border-stone-300',
      icon: CheckCircle2,
    },
  };

  const cfg = configs[status] || configs['Registered'];
  const Icon = cfg.icon;

  const paddingClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-medium whitespace-nowrap shrink-0 ${cfg.bg} ${cfg.text} ${cfg.border} ${paddingClass}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>{cfg.label}</span>
    </span>
  );
};

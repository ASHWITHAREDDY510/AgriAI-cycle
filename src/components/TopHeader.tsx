import React from 'react';
import { Menu, Plus, RefreshCw, ShieldCheck, LayoutDashboard, History, PlusCircle } from 'lucide-react';
import { NavTab } from '../types/batch';

interface TopHeaderProps {
  currentTab: NavTab;
  onOpenMobileNav: () => void;
  onNavigate: (tab: NavTab) => void;
  onResetDemo: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentTab,
  onOpenMobileNav,
  onNavigate,
  onResetDemo,
}) => {
  const titles: Record<NavTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Waste Management Dashboard',
      subtitle: 'Overview of crop residue intake, processing status, and emissions avoided in Jagtial',
    },
    classify: {
      title: 'Biomass Quality Classification',
      subtitle: 'Rule-based quality screening, contamination flagging, and intake triage for Jagtial residue batches',
    },
    register: {
      title: 'Register Agricultural Waste',
      subtitle: 'Log a new crop residue batch for collection, transport, and bio-conversion',
    },
    history: {
      title: 'Batch Records & History',
      subtitle: 'Track, filter, and update collection lifecycle for all registered residue lots',
    },
  };

  const navItems: { id: NavTab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'classify', label: 'Classify Biomass', icon: ShieldCheck },
    { id: 'register', label: 'Register Waste', icon: PlusCircle },
    { id: 'history', label: 'Batch History', icon: History },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur-xs px-4 py-3 sm:px-8">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile trigger & Contextual Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileNav}
            className="rounded-lg border border-stone-200 p-2 text-stone-600 hover:bg-stone-100 hover:text-stone-900 lg:hidden"
            aria-label="Open sidebar navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div>
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <span className="font-medium text-emerald-800">AgriCycle AI</span>
              <span aria-hidden="true">/</span>
              <span>Jagtial, Telangana</span>
            </div>
            <h1 className="text-base font-bold tracking-tight text-stone-900 sm:text-lg">
              {titles[currentTab].title}
            </h1>
          </div>
        </div>

        {/* Center: Top Navigation Links (Visible on desktop/tablets) */}
        <nav className="hidden md:flex items-center gap-1 bg-stone-100/80 p-1 rounded-xl text-xs border border-stone-200/60">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-white text-emerald-900 font-semibold shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-emerald-700' : 'text-stone-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onResetDemo}
            title="Reset to Jagtial demo batches"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs font-medium text-stone-600 hover:border-stone-300 hover:bg-stone-50 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5 text-stone-500" />
            <span className="hidden lg:inline">Reset Demo</span>
          </button>

          {currentTab !== 'classify' && (
            <button
              type="button"
              onClick={() => onNavigate('classify')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors whitespace-nowrap shrink-0"
            >
              <ShieldCheck className="h-4 w-4 text-emerald-700" />
              <span>Classify Biomass</span>
            </button>
          )}

          {currentTab !== 'register' && (
            <button
              type="button"
              onClick={() => onNavigate('register')}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Register Waste</span>
            </button>
          )}

          {currentTab === 'register' && (
            <button
              type="button"
              onClick={() => onNavigate('history')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors whitespace-nowrap shrink-0"
            >
              <span>View History</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

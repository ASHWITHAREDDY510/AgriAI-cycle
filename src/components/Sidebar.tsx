import React from 'react';
import { LayoutDashboard, PlusCircle, History, Sprout, MapPin, X, Leaf, ShieldCheck } from 'lucide-react';
import { NavTab } from '../types/batch';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  totalBatchesCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
  totalBatchesCount,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ElementType; description: string }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'KPI metrics & recent activity',
    },
    {
      id: 'classify',
      label: 'Classify Biomass',
      icon: ShieldCheck,
      description: 'Rule-based quality screening',
    },
    {
      id: 'register',
      label: 'Register Waste',
      icon: PlusCircle,
      description: 'Log new crop residue batch',
    },
    {
      id: 'history',
      label: 'Batch History',
      icon: History,
      description: 'Manage & filter all records',
    },
  ];

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-stone-900/50 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[#112f23] text-stone-100 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Area */}
        <div className="flex h-20 items-center justify-between border-b border-emerald-900/60 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-stone-950 shadow-xs">
              <Sprout className="h-6 w-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                AgriCycle <span className="text-emerald-400 font-semibold text-sm">AI</span>
              </div>
              <p className="text-xs text-emerald-200/70 font-normal">Waste to Bio-Resource</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-emerald-900/40 hover:text-white lg:hidden"
            aria-label="Close navigation sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Location Sub-banner */}
        <div className="mx-4 mt-4 rounded-xl border border-emerald-800/40 bg-emerald-950/50 p-3 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-emerald-300">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
            <span>Jagtial District Hub</span>
          </div>
          <p className="mt-1 text-emerald-200/70 text-[11px] leading-relaxed">
            Telangana Agricultural Residue Management & Logistics Node
          </p>
        </div>

        {/* Navigation Items */}
        <nav className="mt-6 flex-1 space-y-1.5 px-3">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-emerald-300/60">
            Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-left transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white font-medium shadow-sm'
                    : 'text-stone-300 hover:bg-emerald-900/40 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-5 w-5 transition-colors ${
                      isActive ? 'text-white' : 'text-emerald-400 group-hover:text-emerald-300'
                    }`}
                  />
                  <div>
                    <span className="text-sm block">{item.label}</span>
                    <span
                      className={`text-[11px] block transition-colors ${
                        isActive ? 'text-emerald-100' : 'text-emerald-200/50'
                      }`}
                    >
                      {item.description}
                    </span>
                  </div>
                </div>

                {item.id === 'history' && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-md font-mono ${
                      isActive ? 'bg-emerald-700 text-white' : 'bg-emerald-950/80 text-emerald-300'
                    }`}
                  >
                    {totalBatchesCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Hub Information */}
        <div className="border-t border-emerald-900/60 p-4">
          <div className="flex items-start gap-3 rounded-xl bg-emerald-950/40 p-3 border border-emerald-800/30">
            <Leaf className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
            <div className="text-xs">
              <span className="font-semibold text-emerald-200 block">Stubble Burning Prevention</span>
              <p className="text-[11px] text-emerald-200/70 mt-0.5 leading-relaxed">
                Directing paddy straw, cotton stalks & turmeric waste from Jagtial farms to clean bio-energy.
              </p>
            </div>
          </div>
          <div className="mt-3 text-center text-[11px] text-emerald-300/50">
            AgriCycle AI · Version 1.0
          </div>
        </div>
      </aside>
    </>
  );
};

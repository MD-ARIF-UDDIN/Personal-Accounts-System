import React from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  ArrowLeftRight, 
  CreditCard, 
  FileSpreadsheet,
  UserCheck
} from 'lucide-react';
import { NavTab } from './Sidebar';

interface BottomNavProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  const tabs = [
    { id: 'dashboard' as NavTab, label: 'Home', icon: LayoutDashboard },
    { id: 'dealers' as NavTab, label: 'Wallets', icon: Wallet },
    { id: 'transactions' as NavTab, label: 'Tx', icon: ArrowLeftRight },
    { id: 'payments' as NavTab, label: 'Pay', icon: CreditCard },
    { id: 'reports' as NavTab, label: 'Reports', icon: FileSpreadsheet },
    { id: 'users' as NavTab, label: 'Users', icon: UserCheck },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 lg:hidden shadow-lg safe-bottom">
      <div className="grid grid-cols-6 h-16 items-center px-0.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-1 transition-all active:scale-95 ${
                isActive ? 'text-sky-600 font-bold' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition ${isActive ? 'bg-sky-50 scale-105' : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              </div>
              <span className="text-[10px] font-semibold mt-0.5 leading-none">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

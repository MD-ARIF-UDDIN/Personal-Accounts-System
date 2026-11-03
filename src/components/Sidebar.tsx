import React from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  ArrowLeftRight, 
  CreditCard, 
  FileSpreadsheet,
  UserCheck
} from 'lucide-react';

export type NavTab = 'dashboard' | 'dealers' | 'transactions' | 'payments' | 'reports' | 'users';

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
}) => {
  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'dealers' as NavTab, label: 'Wallets', icon: Wallet },
    { id: 'transactions' as NavTab, label: 'Transactions', icon: ArrowLeftRight },
    { id: 'payments' as NavTab, label: 'Payments', icon: CreditCard },
    { id: 'reports' as NavTab, label: 'Reports', icon: FileSpreadsheet },
    { id: 'users' as NavTab, label: 'Users', icon: UserCheck },
  ];

  return (
    <aside className="hidden lg:flex fixed top-14 bottom-0 left-0 w-60 bg-white border-r border-slate-200 flex-col justify-between py-4 px-3">
      <div className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                isActive
                  ? 'bg-sky-50 text-sky-700 font-bold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};

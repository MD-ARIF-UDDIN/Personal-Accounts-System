import React from 'react';
import { LogOut, User } from 'lucide-react';
import { AppUser } from '../types';

interface NavbarProps {
  user: AppUser | null;
  onSignOut: () => void;
  onOpenUsers?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onSignOut, onOpenUsers }) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo & Title */}
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-600 flex items-center justify-center text-white font-extrabold text-sm shadow-xs">
              PA
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                Personal Accounting System
              </h1>
            </div>
          </div>

          {/* User Phone & Logout */}
          <div className="flex items-center space-x-2">
            {user && (
              <button
                onClick={onOpenUsers}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
                title="Manage Users"
              >
                <User className="w-3.5 h-3.5 text-sky-600" />
                <span className="max-w-[120px] truncate">{user.name || user.phone}</span>
              </button>
            )}
            <button
              onClick={onSignOut}
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

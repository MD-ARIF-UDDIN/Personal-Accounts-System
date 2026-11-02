import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  UserPlus, 
  Phone, 
  Lock, 
  User, 
  Edit2, 
  Trash2, 
  X, 
  Search,
  CheckCircle,
  KeyRound
} from 'lucide-react';
import { AppUser } from '../types';
import { api } from '../services/api';
import { formatDate } from '../utils/formatters';

interface UsersPageProps {
  currentUser: AppUser | null;
  onUserUpdated?: () => void;
}

export const UsersPage: React.FC<UsersPageProps> = ({ currentUser, onUserUpdated }) => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<AppUser | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [notes, setNotes] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openAddModal = () => {
    setUserToEdit(null);
    setName('');
    setPhone('');
    setPassword('');
    setRole('admin');
    setNotes('');
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (u: AppUser) => {
    setUserToEdit(u);
    setName(u.name);
    setPhone(u.phone);
    setPassword(''); // leave blank if keeping same
    setRole(u.role || 'admin');
    setNotes(u.notes || '');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setModalError('Name and phone number are required.');
      return;
    }
    if (!userToEdit && !password.trim()) {
      setModalError('Password is required for new user.');
      return;
    }

    setModalLoading(true);
    setModalError(null);

    try {
      if (userToEdit) {
        await api.updateUser(userToEdit.id, {
          name: name.trim(),
          phone: phone.trim(),
          role: role,
          notes: notes.trim() || undefined,
          ...(password.trim() ? { password: password.trim() } : {}),
        });
      } else {
        await api.createUser({
          name: name.trim(),
          phone: phone.trim(),
          password: password.trim(),
          role: role,
          notes: notes.trim() || undefined,
        });
      }

      setIsModalOpen(false);
      await fetchUsers();
      if (onUserUpdated) onUserUpdated();
    } catch (err: any) {
      setModalError(err.message || 'Failed to save user.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (u: AppUser) => {
    if (currentUser?.id === u.id) {
      alert('You cannot delete your own logged-in account.');
      return;
    }
    if (window.confirm(`Delete user "${u.name}" (${u.phone})?`)) {
      try {
        await api.deleteUser(u.id);
        await fetchUsers();
      } catch (err: any) {
        alert(err.message || 'Failed to delete user.');
      }
    }
  };

  const filtered = users.filter((u) => {
    const q = searchTerm.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.phone.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-3 pb-8">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">
            User Management ({users.length})
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Manage system access with Phone & Password
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md transition active:scale-95 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Add User</span>
        </button>
      </div>

      {/* Current User Card */}
      {currentUser && (
        <div className="bg-gradient-to-r from-sky-600 to-indigo-700 rounded-3xl p-4 text-white shadow-md space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
              Logged in Account
            </span>
            <button
              onClick={() => openEditModal(currentUser)}
              className="text-xs font-bold text-sky-100 hover:text-white flex items-center gap-1 underline"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Change Password</span>
            </button>
          </div>
          <h3 className="text-lg font-black">{currentUser.name}</h3>
          <p className="text-xs text-sky-100 font-mono flex items-center gap-1">
            <Phone className="w-3.5 h-3.5" />
            <span>{currentUser.phone}</span>
          </p>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-8 py-3 text-sm border-2 border-slate-200 rounded-2xl bg-white focus:outline-none focus:border-sky-500 shadow-2xs font-medium"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 text-xs font-bold"
          >
            ✕
          </button>
        )}
      </div>

      {/* Users Cards List */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="bg-white rounded-3xl p-8 text-center text-xs text-slate-400">
            Loading users...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-400 text-xs font-semibold">
            No users found.
          </div>
        ) : (
          filtered.map((u) => {
            const isSelf = currentUser?.id === u.id;
            return (
              <div
                key={u.id}
                className="bg-white rounded-3xl border-2 border-slate-200/90 p-4 shadow-xs flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-base text-slate-900 leading-tight">
                      {u.name}
                    </h4>
                    {isSelf && (
                      <span className="text-[10px] font-bold bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded-full">
                        You
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-600 mt-1">
                    <span className="flex items-center gap-1 font-bold text-sky-700">
                      <Phone className="w-3 h-3" />
                      {u.phone}
                    </span>
                    <span>•</span>
                    <span className="text-slate-400 text-[11px] font-sans">
                      {formatDate(u.created_at)}
                    </span>
                  </div>
                  {u.notes && (
                    <p className="text-[11px] text-slate-500 bg-slate-50 px-2 py-1 rounded-lg mt-1.5 italic">
                      Note: {u.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(u)}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition"
                    title="Edit User"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {!isSelf && (
                    <button
                      onClick={() => handleDelete(u)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                      title="Delete User"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* USER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full overflow-hidden border border-slate-200 shadow-2xl safe-bottom max-h-[92vh] flex flex-col">
            <div className="pt-2 pb-1 sm:hidden">
              <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto" />
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">
                {userToEdit ? 'Edit User' : 'Add New User'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 -mr-1 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto flex-1">
              {modalError && (
                <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-2xl font-semibold">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-3 text-sm font-semibold border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-sky-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                  Phone Number (Login ID) *
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  required
                  placeholder="01700000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-3 text-sm font-semibold border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-sky-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                  Password {userToEdit ? '(Leave empty to keep current)' : '*'}
                </label>
                <input
                  type="password"
                  placeholder={userToEdit ? '••••••••' : 'Enter password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-3 text-sm font-semibold border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-sky-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                  Note / Remarks (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Branch manager, accountant, night shift"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-3 text-sm font-semibold border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-sky-500 text-slate-900"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1 py-3 text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-2xl shadow-md transition active:scale-95 disabled:opacity-50"
                >
                  {modalLoading ? 'Saving...' : 'Save User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


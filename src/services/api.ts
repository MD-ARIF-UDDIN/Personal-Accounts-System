import { supabase } from '../lib/supabase';
import { Dealer, Transaction, Payment, AppUser } from '../types';

const SESSION_KEY = 'pas_active_session';

export const api = {
  // ----------------------- PHONE + PASSWORD AUTH -----------------------
  async getCurrentUser(): Promise<AppUser | null> {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const user = JSON.parse(raw);
      return user;
    } catch {
      return null;
    }
  },

  async signIn(phone: string, password: string): Promise<AppUser> {
    const cleanPhone = phone.trim();
    const cleanPass = password.trim();

    if (!cleanPhone || !cleanPass) {
      throw new Error('Please enter both phone number and password.');
    }

    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('phone', cleanPhone)
      .eq('password', cleanPass)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('not find the table')) {
        throw new Error("TABLE_NOT_FOUND: 'app_users' table not found in Supabase. Please run supabase_schema.sql in Supabase SQL Editor.");
      }
      throw error;
    }

    if (!data) {
      throw new Error('Invalid phone number or password.');
    }

    const sessionUser: AppUser = {
      id: data.id,
      phone: data.phone,
      name: data.name,
      role: data.role || 'admin',
      created_at: data.created_at,
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    return sessionUser;
  },

  async signOut(): Promise<void> {
    localStorage.removeItem(SESSION_KEY);
  },

  // ----------------------- USER MANAGEMENT (USER PAGE) -----------------------
  async getUsers(): Promise<AppUser[]> {
    const { data, error } = await supabase
      .from('app_users')
      .select('id, phone, name, role, notes, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createUser(user: { name: string; phone: string; password: string; role?: string; notes?: string }): Promise<AppUser> {
    const { data, error } = await supabase
      .from('app_users')
      .insert([{
        name: user.name.trim(),
        phone: user.phone.trim(),
        password: user.password.trim(),
        role: user.role || 'admin',
        notes: user.notes?.trim() || null,
      }])
      .select('id, phone, name, role, notes, created_at')
      .single();

    if (error) {
      if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('unique')) {
        throw new Error('A user with this phone number already exists.');
      }
      throw error;
    }
    return data;
  },

  async updateUser(id: string, updates: Partial<{ name: string; phone: string; password: string; role: string; notes: string }>): Promise<AppUser> {
    const payload: Record<string, any> = {};
    if (updates.name) payload.name = updates.name.trim();
    if (updates.phone) payload.phone = updates.phone.trim();
    if (updates.password) payload.password = updates.password.trim();
    if (updates.role) payload.role = updates.role;
    if (updates.notes !== undefined) payload.notes = updates.notes ? updates.notes.trim() : null;

    const { data, error } = await supabase
      .from('app_users')
      .update(payload)
      .eq('id', id)
      .select('id, phone, name, role, notes, created_at')
      .single();

    if (error) throw error;
    return data;
  },

  async deleteUser(id: string): Promise<void> {
    const { error } = await supabase
      .from('app_users')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ----------------------- DEALERS -----------------------
  async getDealers(): Promise<Dealer[]> {
    const { data, error } = await supabase
      .from('dealers')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('not find the table')) {
        throw new Error("TABLE_NOT_FOUND: 'dealers' table not found in Supabase. Please run supabase_schema.sql in Supabase SQL Editor.");
      }
      throw error;
    }
    return data || [];
  },

  async createDealer(dealer: Omit<Dealer, 'id' | 'created_at'>): Promise<Dealer> {
    const cleanWallet = dealer.wallet_number.trim();
    const cleanName = dealer.name?.trim() || cleanWallet;
    const cleanDealerNum = dealer.dealer_number?.trim() || cleanWallet;

    const { data, error } = await supabase
      .from('dealers')
      .insert([{
        name: cleanName,
        dealer_number: cleanDealerNum,
        wallet_number: cleanWallet,
        phone: dealer.phone?.trim() || null,
        notes: dealer.notes?.trim() || null,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateDealer(id: string, updates: Partial<Dealer>): Promise<Dealer> {
    const cleanWallet = updates.wallet_number ? updates.wallet_number.trim() : undefined;
    const { data, error } = await supabase
      .from('dealers')
      .update({
        ...(cleanWallet && { 
          wallet_number: cleanWallet,
          name: updates.name ? updates.name.trim() : cleanWallet,
          dealer_number: updates.dealer_number ? updates.dealer_number.trim() : cleanWallet,
        }),
        ...(updates.phone !== undefined && { phone: updates.phone ? updates.phone.trim() : null }),
        ...(updates.notes !== undefined && { notes: updates.notes ? updates.notes.trim() : null }),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteDealer(id: string): Promise<void> {
    const { error } = await supabase
      .from('dealers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ----------------------- TRANSACTIONS -----------------------
  async getTransactions(): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, dealer:dealers(*)')
      .order('date', { ascending: false });

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('not find the table')) {
        throw new Error("TABLE_NOT_FOUND: 'transactions' table not found in Supabase. Please run supabase_schema.sql in Supabase SQL Editor.");
      }
      throw error;
    }

    return (data || []).map((t) => ({
      ...t,
      amount: Number(t.amount),
    }));
  },

  async createTransaction(tx: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        dealer_id: tx.dealer_id,
        amount: Number(tx.amount),
        date: tx.date,
        notes: tx.notes?.trim() || tx.description?.trim() || null,
        description: tx.description?.trim() || tx.notes?.trim() || null,
        reference_no: tx.reference_no?.trim() || null,
      }])
      .select('*, dealer:dealers(*)')
      .single();

    if (error) throw error;
    return { ...data, amount: Number(data.amount) };
  },

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    const noteVal = updates.notes !== undefined ? (updates.notes ? updates.notes.trim() : null) : (updates.description ? updates.description.trim() : undefined);
    const { data, error } = await supabase
      .from('transactions')
      .update({
        ...(updates.dealer_id && { dealer_id: updates.dealer_id }),
        ...(updates.amount !== undefined && { amount: Number(updates.amount) }),
        ...(updates.date && { date: updates.date }),
        ...(noteVal !== undefined && { notes: noteVal, description: noteVal }),
        ...(updates.reference_no !== undefined && { reference_no: updates.reference_no ? updates.reference_no.trim() : null }),
      })
      .eq('id', id)
      .select('*, dealer:dealers(*)')
      .single();

    if (error) throw error;
    return { ...data, amount: Number(data.amount) };
  },

  async deleteTransaction(id: string): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ----------------------- PAYMENTS -----------------------
  async getPayments(): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*, dealer:dealers(*)')
      .order('date', { ascending: false });

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('not find the table')) {
        throw new Error("TABLE_NOT_FOUND: 'payments' table not found in Supabase. Please run supabase_schema.sql in Supabase SQL Editor.");
      }
      throw error;
    }

    return (data || []).map((p) => ({
      ...p,
      amount: Number(p.amount),
    }));
  },

  async createPayment(payment: Omit<Payment, 'id' | 'created_at'>): Promise<Payment> {
    const { data, error } = await supabase
      .from('payments')
      .insert([{
        dealer_id: payment.dealer_id,
        amount: Number(payment.amount),
        date: payment.date,
        payment_method: payment.payment_method || 'Wallet',
        reference_no: payment.reference_no?.trim() || null,
        notes: payment.notes?.trim() || null,
      }])
      .select('*, dealer:dealers(*)')
      .single();

    if (error) throw error;
    return { ...data, amount: Number(data.amount) };
  },

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment> {
    const { data, error } = await supabase
      .from('payments')
      .update({
        ...(updates.dealer_id && { dealer_id: updates.dealer_id }),
        ...(updates.amount !== undefined && { amount: Number(updates.amount) }),
        ...(updates.date && { date: updates.date }),
        ...(updates.payment_method !== undefined && { payment_method: updates.payment_method }),
        ...(updates.reference_no !== undefined && { reference_no: updates.reference_no ? updates.reference_no.trim() : null }),
        ...(updates.notes !== undefined && { notes: updates.notes ? updates.notes.trim() : null }),
      })
      .eq('id', id)
      .select('*, dealer:dealers(*)')
      .single();

    if (error) throw error;
    return { ...data, amount: Number(data.amount) };
  },

  async deletePayment(id: string): Promise<void> {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

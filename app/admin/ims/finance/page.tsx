"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { LogOut, DollarSign, FileText, TrendingDown, TrendingUp, Plus, Trash2, X, Search, BarChart3, Menu, Download, CreditCard, Receipt, List, Calendar, CalendarDays, Clock, User, Building2, GraduationCap, Megaphone, Users, UserCog, Terminal, ExternalLink } from 'lucide-react';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, Legend, Area, AreaChart
} from "recharts"
import { QuickGuide, type GuideStep } from "@/components/ui/quick-guide"
import { hasPermission } from "@/lib/permissions"
import type { Permission } from "@/lib/permissions"
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { useRouter } from 'next/navigation';
import CDMDataTable, { type CDMColumn, type CDMAction } from "@/components/ims/CDMDataTable"

import {
  getImsPayments, createImsPayment, deleteImsPayment,
  getImsInvoices, createImsInvoice, updateImsInvoice, deleteImsInvoice,
  getImsExpenses, createImsExpense, deleteImsExpense,
  getLeadConfirmations,
} from "@/lib/ims-data"
import { getCourses } from "@/lib/data"
import { getCurrentUser, signOut } from "@/lib/auth"
import type { ImsPayment, ImsInvoice, ImsExpense, ImsInvoiceItem, Profile, LeadConfirmation } from '@/types';
import SriLankaCalendar from "@/components/ims/SriLankaCalendar"
import StaffAttendance from "@/components/ims/StaffAttendance"
import ProfileSection from "@/components/ims/ProfileSection"
import LeaveRequestsView from "@/components/ims/LeaveRequestsView"
import FinanceLeadConfirmationsView from "@/components/ims/finance/LeadConfirmationsView"
import IMSTasksPage from "../tasks/page"
import { confirmDialog } from "@/components/ui/global-confirm-dialog"

const EXPENSE_CATS = ['Utilities', 'Rent', 'Salaries', 'Marketing', 'Equipment', 'Maintenance', 'Other'] as const;
const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Online'] as const;

export default function FinanceDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isHead = currentUser?.role === 'admin' || currentUser?.role === 'super_admin' || currentUser?.access_level >= 2;
  const [payments, setPayments] = useState<ImsPayment[]>([]);
  const [invoices, setInvoices] = useState<ImsInvoice[]>([]);
  const [expenses, setExpenses] = useState<ImsExpense[]>([]);
  const [leadConfirmations, setLeadConfirmations] = useState<LeadConfirmation[]>([]);
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(true);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [courses, setCourses] = useState<any[]>([]);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  const emptyPayment: {
    student_name: string; student_id: string; course_id: string; amount: number;
    method: "Cash" | "Bank Transfer" | "Online"; date: string; invoice_id: string | null; notes: string;
  } = { student_name: '', student_id: '', course_id: '', amount: 0, method: 'Cash' as const, date: format(new Date(), 'yyyy-MM-dd'), invoice_id: null, notes: '' };
  const [paymentForm, setPaymentForm] = useState(emptyPayment);

  const emptyInvoice = { student_name: '', student_id: '', course_name: '', items: [{ description: '', amount: 0 }] as ImsInvoiceItem[], due_date: '', status: 'Unpaid' as const };
  const [invoiceForm, setInvoiceForm] = useState(emptyInvoice);

  const emptyExpense = { category: 'Utilities' as const, amount: 0, date: format(new Date(), 'yyyy-MM-dd'), notes: '' };
  const [expenseForm, setExpenseForm] = useState(emptyExpense);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [p, inv, exp, u, lc, cList] = await Promise.all([
        getImsPayments(), getImsInvoices(), getImsExpenses(), getCurrentUser(),
        getLeadConfirmations('marketing_confirmed'), getCourses(true)
      ]);
      setPayments(p); setInvoices(inv); setExpenses(exp); setCurrentUser(u); setLeadConfirmations(lc); setCourses(cList);
    } catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }, []);

  useEffect(() => { loadData() }, [loadData]);
  
  useEffect(() => {
    const handleSwitchTab = (e: any) => setActiveTab(e.detail)
    window.addEventListener('switch-tab', handleSwitchTab)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const tab = params.get('tab')
      if (tab) setActiveTab(tab)
    }
    return () => window.removeEventListener('switch-tab', handleSwitchTab)
  }, [])

  useEffect(() => { const t = setTimeout(() => setShowLoadingAnimation(false), 2000); return () => clearTimeout(t); }, []);

  const handleLogout = async () => {
    await signOut();
    router.push('/auth/login');
  };

  const financeGuideSteps: GuideStep[] = [
    { title: "Recording Payments", description: "Log student payments with amount, method (Cash, Bank Transfer, Online), and optionally link them to invoices for automatic tracking.", icon: CreditCard, gradient: "from-red-500 to-violet-500", tip: "Click the receipt icon on any payment to download a PDF receipt." },
    { title: "Invoice Management", description: "Create invoices with line items, track their status (Unpaid, Partial, Paid), and generate professional PDF invoices for students.", icon: FileText, gradient: "from-indigo-500 to-purple-500", tip: "Use 'Pay Now' on unpaid invoices to quickly record a payment." },
    { title: "Expense Tracking", description: "Log institute expenses by category (Utilities, Rent, Salaries, Marketing, etc.) to track where money is going.", icon: TrendingDown, gradient: "from-red-500 to-orange-500" },
    { title: "P&L Reports", description: "View total revenue vs expenses and net profit at a glance. Export all financial data to Excel.", icon: BarChart3, gradient: "from-emerald-500 to-cyan-500", tip: "Use the Export button to download payments and expenses as an Excel file." },
  ];

  const handleDeletePayment = async (id: string, invoiceId?: string | null) => {
    if (!isHead) return toast.error('Only Department Heads can delete payments');
    if (!(await confirmDialog('Delete this payment?'))) return;
    try {
      await deleteImsPayment(id);
      if (invoiceId) {
        const inv = invoices.find(i => i.id === invoiceId);
        if (inv) {
          const remainingPayments = payments.filter(p => p.invoice_id === invoiceId && p.id !== id);
          const paidAmount = remainingPayments.reduce((sum, p) => sum + p.amount, 0);
          const updated = await updateImsInvoice(invoiceId, { status: paidAmount >= inv.total ? 'Paid' : (paidAmount > 0 ? 'Partial' : 'Unpaid') });
          setInvoices(prev => prev.map(i => i.id === invoiceId ? updated : i));
        }
      }
      setPayments(prev => prev.filter(p => p.id !== id));
      toast.success('Payment deleted!');
    } catch (e: any) { toast.error(e.message) }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!isHead) return toast.error('Only Department Heads can delete invoices');
    if (!(await confirmDialog('Delete this invoice?'))) return;
    try {
      await deleteImsInvoice(id);
      setInvoices(prev => prev.filter(i => i.id !== id));
      toast.success('Invoice deleted!');
    } catch (e: any) { toast.error(e.message) }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!isHead) return toast.error('Only Department Heads can delete expenses');
    if (!(await confirmDialog('Delete this expense?'))) return;
    try {
      await deleteImsExpense(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
      toast.success('Expense deleted!');
    } catch (e: any) { toast.error(e.message) }
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.student_name.trim() || paymentForm.amount <= 0) return toast.error('Name and amount required');
    try {
      const payload = {
        ...paymentForm,
        course_id: paymentForm.course_id || null, // FIX UUID error for empty course_id
        student_id: paymentForm.student_id || null,
        created_by: currentUser?.id, 
        lead_id: null, 
        source: 'direct' as const, 
        payment_confirmed: true
      };
      const created = await createImsPayment(payload);
      setPayments(prev => [created, ...prev]);
      if (paymentForm.invoice_id) {
        const inv = invoices.find(i => i.id === paymentForm.invoice_id);
        if (inv) {
          const currentPayments = payments.filter(p => p.invoice_id === paymentForm.invoice_id).reduce((s, p) => s + p.amount, 0);
          const newTotal = currentPayments + paymentForm.amount;
          const updated = await updateImsInvoice(paymentForm.invoice_id, { status: newTotal >= inv.total ? 'Paid' : 'Partial' });
          setInvoices(prev => prev.map(i => i.id === paymentForm.invoice_id ? updated : i));
        }
      }
      toast.success('Payment recorded!'); setShowPaymentModal(false); setPaymentForm(emptyPayment);
    } catch (e: any) { toast.error(e.message) }
  };

  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.student_name.trim()) return toast.error('Student name required');
    const total = invoiceForm.items.reduce((s, i) => s + i.amount, 0);
    try {
      const created = await createImsInvoice({ ...invoiceForm, total, generated_by: currentUser?.id });
      setInvoices(prev => [created, ...prev]);
      toast.success('Invoice created!'); setShowInvoiceModal(false);
      setInvoiceForm(emptyInvoice);
    } catch (e: any) { toast.error(e.message) }
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseForm.amount <= 0) return toast.error('Amount required');
    try {
      const created = await createImsExpense({ ...expenseForm, created_by: currentUser?.id });
      setExpenses(prev => [created, ...prev]);
      toast.success('Expense logged!'); setShowExpenseModal(false); setExpenseForm(emptyExpense);
    } catch (e: any) { toast.error(e.message) }
  };

  const generateInvoicePDF = (inv: ImsInvoice) => {
    const doc2 = new jsPDF();
    doc2.setFillColor(15, 23, 42); doc2.rect(0, 0, 210, 297, 'F');
    doc2.setDrawColor(59, 130, 246); doc2.setLineWidth(2); doc2.rect(10, 10, 190, 277);
    doc2.setTextColor(59, 130, 246); doc2.setFontSize(20); doc2.setFont('helvetica', 'bold');
    doc2.text('CADD Centre', 20, 30);
    doc2.setTextColor(255, 255, 255); doc2.setFontSize(14); doc2.text('INVOICE', 170, 30, { align: 'right' });
    doc2.setFontSize(10); doc2.setFont('helvetica', 'normal'); doc2.setTextColor(150, 150, 150);
    doc2.text(`Invoice #: ${inv.id.slice(0, 8).toUpperCase()}`, 20, 45);
    doc2.text(`Date: ${format(new Date(inv.generated_at), 'dd/MM/yyyy')}`, 20, 52);
    if (inv.due_date) doc2.text(`Due: ${inv.due_date}`, 20, 59);
    doc2.setTextColor(255, 255, 255); doc2.setFontSize(12); doc2.setFont('helvetica', 'bold');
    doc2.text('Bill To:', 20, 75); doc2.setFont('helvetica', 'normal');
    doc2.text(inv.student_name, 20, 83); doc2.text(`ID: ${inv.student_id || 'N/A'}`, 20, 90);
    doc2.text(`Course: ${inv.course_name || 'N/A'}`, 20, 97);
    doc2.setFillColor(30, 41, 59); doc2.rect(15, 110, 180, 8, 'F');
    doc2.setTextColor(150, 200, 255); doc2.setFontSize(10); doc2.setFont('helvetica', 'bold');
    doc2.text('Description', 20, 116); doc2.text('Amount (LKR)', 160, 116, { align: 'right' });
    let y = 128;
    inv.items.forEach(item => {
      doc2.setTextColor(200, 200, 200); doc2.setFont('helvetica', 'normal');
      doc2.text(item.description, 20, y); doc2.text(item.amount.toLocaleString(), 160, y, { align: 'right' });
      doc2.setDrawColor(50, 60, 80); doc2.line(15, y + 3, 195, y + 3);
      y += 12;
    });
    doc2.setDrawColor(59, 130, 246); doc2.setLineWidth(0.5); doc2.line(15, y + 2, 195, y + 2);
    doc2.setTextColor(59, 130, 246); doc2.setFontSize(13); doc2.setFont('helvetica', 'bold');
    doc2.text(`TOTAL: LKR ${inv.total.toLocaleString()}`, 160, y + 12, { align: 'right' });
    const statusColors: Record<string, number[]> = { Paid: [34, 197, 94], Unpaid: [239, 68, 68], Partial: [234, 179, 8] };
    const sc = statusColors[inv.status] || [150, 150, 150];
    doc2.setFillColor(sc[0], sc[1], sc[2]); doc2.roundedRect(20, y + 22, 30, 8, 2, 2, 'F');
    doc2.setTextColor(255, 255, 255); doc2.setFontSize(9);
    doc2.text(inv.status, 35, y + 27, { align: 'center' });
    doc2.setTextColor(100, 100, 100); doc2.setFontSize(8); doc2.setFont('helvetica', 'normal');
    doc2.text('Thank you for choosing CADD Centre', 105, 275, { align: 'center' });
    doc2.save(`Invoice_${inv.student_name.replace(/ /g, '_')}.pdf`);
    toast.success('Invoice PDF downloaded!');
  };

  const generateReceiptPDF = (pay: ImsPayment) => {
    const doc2 = new jsPDF();
    doc2.setFillColor(15, 23, 42); doc2.rect(0, 0, 210, 297, 'F');
    doc2.setTextColor(34, 197, 94); doc2.setFontSize(22); doc2.setFont('helvetica', 'bold');
    doc2.text('CADD Centre', 105, 30, { align: 'center' });
    doc2.setTextColor(255, 255, 255); doc2.setFontSize(16); doc2.text('PAYMENT RECEIPT', 105, 45, { align: 'center' });
    doc2.setDrawColor(34, 197, 94); doc2.line(30, 50, 180, 50);
    const rows = [['Receipt ID:', pay.id.slice(0, 8).toUpperCase()], ['Date:', pay.date], ['Student:', pay.student_name], ['Student ID:', pay.student_id || 'N/A'], ['Amount:', `LKR ${pay.amount.toLocaleString()}`], ['Method:', pay.method], ['Notes:', pay.notes || 'N/A']];
    let y = 65;
    rows.forEach(([label, val]) => {
      doc2.setTextColor(150, 150, 150); doc2.setFontSize(10); doc2.setFont('helvetica', 'bold'); doc2.text(label, 30, y);
      doc2.setTextColor(label === 'Amount:' ? 34 : 200, label === 'Amount:' ? 197 : 200, label === 'Amount:' ? 94 : 200);
      doc2.setFont('helvetica', 'normal'); doc2.text(val, 90, y);
      y += 12;
    });
    doc2.setFillColor(34, 197, 94); doc2.roundedRect(70, y + 10, 70, 14, 3, 3, 'F');
    doc2.setTextColor(255, 255, 255); doc2.setFontSize(12); doc2.setFont('helvetica', 'bold');
    doc2.text('PAYMENT CONFIRMED', 105, y + 19, { align: 'center' });
    doc2.setTextColor(100, 100, 100); doc2.setFontSize(9); doc2.setFont('helvetica', 'normal');
    doc2.text('CADD Centre - Official Receipt', 105, 270, { align: 'center' });
    doc2.save(`Receipt_${pay.student_name.replace(/ /g, '_')}_${pay.date}.pdf`);
    toast.success('Receipt downloaded!');
  };

  const exportFinance = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(payments.map(p => ({ Student: p.student_name, Amount: p.amount, Method: p.method, Date: p.date, Notes: p.notes }))), 'Payments');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expenses.map(e => ({ Category: e.category, Amount: e.amount, Date: e.date, Notes: e.notes }))), 'Expenses');
    XLSX.writeFile(wb, `CADD_Finance_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast.success('Finance report exported!');
  };

  const totalIncome = payments.reduce((s, p) => s + p.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = totalIncome - totalExpenses;

  // Real chart data calculations
  const last6MonthsData = useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStr = format(d, 'MMM');
      const year = d.getFullYear();
      const monthNum = d.getMonth();

      const monthIncome = payments
        .filter(p => {
          const pd = new Date(p.date);
          return pd.getMonth() === monthNum && pd.getFullYear() === year;
        })
        .reduce((sum, p) => sum + p.amount, 0);

      const monthExpense = expenses
        .filter(e => {
          const ed = new Date(e.date);
          return ed.getMonth() === monthNum && ed.getFullYear() === year;
        })
        .reduce((sum, e) => sum + e.amount, 0);

      data.push({ name: monthStr, income: monthIncome, expense: monthExpense });
    }
    return data;
  }, [payments, expenses]);

  const expensePieData = useMemo(() => {
    const categories = ['Utilities', 'Rent', 'Salaries', 'Marketing', 'Equipment', 'Maintenance', 'Other'];
    const data = categories.map(cat => ({
      name: cat,
      value: expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0)
    })).filter(d => d.value > 0);
    
    if (data.length === 0) return [{ name: 'No Expenses', value: 1 }];
    return data;
  }, [expenses]);
  
  const pieColors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#6B7280'];


  const pendingLeadCount = leadConfirmations.length;

  const navSections = [
    {
      label: '💰 Finance',
      items: [
        { id: 'overview',  label: 'Overview',    icon: Building2,    badge: 0 },
        { id: 'lead-confirmations', label: 'Lead Verifications', icon: ExternalLink, badge: pendingLeadCount },
        { id: 'payments',  label: 'Payments',    icon: CreditCard,   badge: 0 },
        { id: 'invoices',  label: 'Invoices',    icon: FileText,     badge: 0 },
        { id: 'expenses',  label: 'Expenses',    icon: TrendingDown, badge: 0 },
        { id: 'reports',   label: 'P&L Report',  icon: BarChart3,    badge: 0 },
      ]
    },
    {
      label: '📋 My Work',
      items: [
        { id: 'tasks',      label: 'Tasks',         icon: FileText,     badge: 0 },
        { id: 'leave-requests', label: 'My Leaves', icon: CalendarDays, badge: 0 },
        { id: 'attendance', label: 'My Attendance', icon: Clock,    badge: 0 },
        { id: 'profile',   label: 'My Profile', icon: User,         badge: 0 },
      ]
    },
    {
      label: '🗂 Tools',
      items: [
        { id: 'calendar',  label: 'Calendar',    icon: CalendarDays, badge: 0 },
      ]
    },
  ];

  const filteredPayments = payments.filter(p =>
    !search || p.student_name.toLowerCase().includes(search.toLowerCase()) ||
    (p.student_id && p.student_id.toLowerCase().includes(search.toLowerCase()))
  );
  
  const filteredInvoices = invoices.filter(i =>
    !search || i.student_name.toLowerCase().includes(search.toLowerCase()) ||
    (i.student_id && i.student_id.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center deep-red-bg">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="w-16 h-16 border-t-4 border-red-500 border-solid rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900 selection:bg-red-100">
      <AnimatePresence>
        {showLoadingAnimation && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-900/90 backdrop-blur-md">
            <motion.div animate={{ rotate: 360, scale: [1, 1.15, 1] }} transition={{ duration: 3, repeat: Infinity }}
              className="w-24 h-24 bg-gradient-to-r from-red-500 to-violet-500 rounded-full flex items-center justify-center mb-6">
              <DollarSign className="w-12 h-12 text-white" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">CADD Centre - Finance</h2>
            <div className="w-64 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-red-500 to-violet-400"
                initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 3 }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 📱 Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-500 to-violet-500 flex items-center justify-center shadow-lg"><DollarSign className="w-4 h-4 text-white" /></div>
          <span className="font-bold text-lg">Finance</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-600 bg-gray-50 rounded-xl"><Menu className="w-5 h-5" /></button>
      </div>

      <div className="flex relative w-full">
        {/* Mobile Overlay */}
        <div 
          className={`fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 
          onClick={() => setMobileMenuOpen(false)} 
        />

        {/* 🚀 SIDEBAR */}
        <aside className={`fixed md:sticky top-0 left-0 h-screen w-[280px] bg-slate-950 border-r border-slate-800 flex flex-col transition-transform duration-300 z-50 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          {mobileMenuOpen && (
            <div className="flex justify-end p-3 md:hidden">
              <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>
          )}

          <div className="px-5 pt-6 pb-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden shadow-lg shadow-violet-500/20">
                {currentUser?.avatar_url ? (
                  <img src={currentUser.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  currentUser?.name?.charAt(0).toUpperCase() || 'F'
                )}
              </div>
              <div className="min-w-0">
                <p className="text-red-400 text-sm font-bold truncate">Finance Dept.</p>
                <p className="text-slate-400 text-[10px] mt-0.5 uppercase tracking-widest font-bold">CCL Taskflow</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-xl p-2.5 text-center border border-white/10">
                <p className="font-bold text-sm text-green-400">{(totalIncome/1000).toFixed(0)}k</p>
                <p className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold mt-0.5">Income</p>
              </div>
              <div className="bg-white/5 rounded-xl p-2.5 text-center border border-white/10">
                <p className="font-bold text-sm text-red-400">{(totalExpenses/1000).toFixed(0)}k</p>
                <p className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold mt-0.5">Expense</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5 scrollbar-hide">
            {navSections.map(section => (
              <div key={section.label}>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest px-3 mb-2">{section.label}</p>
                <div className="space-y-1">
                  {section.items.map(item => (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm relative group ${
                        activeTab === item.id
                          ? 'bg-gradient-to-r from-red-500 to-violet-500 text-white shadow-lg shadow-violet-500/20'
                          : (item as any).urgent
                            ? 'text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20'
                            : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {activeTab === item.id && (
                        <motion.div layoutId="fin-active-pill" className="absolute left-0 top-0 bottom-0 w-0.5 bg-white rounded-full" />
                      )}
                      <item.icon className={`w-4 h-4 flex-shrink-0 ${activeTab === item.id ? 'text-white' : (item as any).urgent ? 'text-yellow-400' : 'text-slate-400 group-hover:text-white transition-colors'}`} />
                      <span className="flex-1 text-left font-medium">{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${activeTab === item.id ? 'bg-white/20 text-white' : 'bg-rose-500 text-white'}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="flex-1 p-4 md:p-6 min-h-[calc(100vh-80px)] overflow-auto space-y-6 bg-gray-50 mt-16 md:mt-0">

          {/* Desktop Header Actions */}
          <div className="hidden md:flex items-center justify-between bg-white p-4 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Welcome back, {currentUser?.name || 'Finance Team'}</h2>
              <p className="text-sm text-gray-500">Here's what's happening with the finances today.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <QuickGuide
                guideKey="finance_dashboard"
                dashboardName="Finance"
                accentGradient="from-red-500 to-violet-500"
                steps={financeGuideSteps}
              />
              {['admin', 'super_admin'].includes(currentUser?.role) && <button onClick={() => router.push('/admin/ims')} className="text-gray-600 hover:bg-gray-50 px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold transition-colors">Admin Panel</button>}
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold text-sm transition-colors">
                <LogOut className="w-4 h-4" /> <span>Logout</span>
              </motion.button>
            </div>
          </div>

          {/* 📊 OVERVIEW 📊 */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Revenue', value: `LKR ${totalIncome.toLocaleString()}`, color: 'from-emerald-500 to-cyan-500', icon: TrendingUp },
                  { label: 'Total Expenses', value: `LKR ${totalExpenses.toLocaleString()}`, color: 'from-rose-500 to-pink-500', icon: TrendingDown },
                  { label: 'Net Profit', value: `LKR ${netProfit.toLocaleString()}`, color: 'from-red-500 to-indigo-500', icon: DollarSign },
                  { label: 'Pending Invoices', value: invoices.filter(i => i.status === 'Unpaid').length, color: 'from-amber-500 to-orange-500', icon: FileText },
                ].map((card, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex items-center gap-4 group hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                      <card.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">{card.label}</p>
                      <h3 className="text-2xl font-bold text-gray-900">{card.value}</h3>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue vs Expenses Chart */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-red-600" /> Revenue & Expenses</h2>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={last6MonthsData}>
                        <defs>
                          <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Area type="monotone" dataKey="income" stroke="#10B981" fillOpacity={1} fill="url(#colorIncome)" />
                        <Area type="monotone" dataKey="expense" stroke="#F43F5E" fillOpacity={1} fill="url(#colorExpense)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                {/* Expense Categories */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><PieChart className="w-5 h-5 text-purple-600" /> Expense Breakdown</h2>
                  </div>
                  <div className="h-[300px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={expensePieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                          {expensePieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              </div>
            </div>
          )}

          {/* ── PAYMENTS ── */}
          {activeTab === 'payments' && (
            <CDMDataTable
              data={payments}
              columns={[
                {
                  key: 'date', label: 'Date', sortable: true,
                  render: (val: string) => <span className="text-gray-700 font-medium">{val}</span>
                },
                {
                  key: 'student_name', label: 'Student', sortable: true,
                  render: (val: string, row: any) => (
                    <div>
                      <p className="font-bold text-gray-900">{val}</p>
                      {row.student_id && <p className="text-[10px] text-gray-400">{row.student_id}</p>}
                    </div>
                  )
                },
                {
                  key: 'course_name', label: 'Course',
                  render: (val: string, row: any) => {
                    const matchedCourse = courses.find(c => c.id === row?.course_id);
                    return <span className="text-gray-700 text-xs font-medium">{val || matchedCourse?.title || row?.course_id || '—'}</span>
                  }
                },
                {
                  key: 'amount', label: 'Amount', sortable: true,
                  render: (val: number) => <span className="font-bold text-emerald-700">LKR {val.toLocaleString()}</span>
                },
                {
                  key: 'method', label: 'Method',
                  render: (val: string) => (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 border border-gray-200 text-gray-700">{val}</span>
                  )
                },
              ] as CDMColumn[]}
              actions={[
                {
                  label: 'Receipt', icon: Receipt, variant: 'default',
                  onClick: (row: any) => generateReceiptPDF(row)
                },
                ...(isHead ? [{
                  label: 'Delete', icon: Trash2, variant: 'danger' as const,
                  onClick: (row: any) => handleDeletePayment(row.id, row.invoice_id)
                }] : [])
              ] as CDMAction[]}
              title="Payments"
              icon={CreditCard}
              searchPlaceholder="Search payments..."
              exportFileName="Payments_Export"
              emptyMessage="No payments recorded yet"
              headerActions={
                <motion.button whileHover={{ scale: 1.05 }} onClick={() => setShowPaymentModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-violet-600 text-white rounded-xl font-semibold text-sm">
                  <Plus className="w-4 h-4" /> Record Payment
                </motion.button>
              }
            />
          )}

          {/* ── INVOICES ── */}
          {activeTab === 'invoices' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Invoices</h2>
                <motion.button whileHover={{ scale: 1.05 }} onClick={() => setShowInvoiceModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-violet-600 text-white rounded-xl font-semibold">
                  <Plus className="w-4 h-4" /> New Invoice
                </motion.button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredInvoices.map(inv => (
                  <div key={inv.id} className="bg-white border border-gray-200 p-5 rounded-2xl border border-gray-200 space-y-3 relative overflow-hidden group hover:border-red-500/50 transition-colors">
                    <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold rounded-bl-xl ${inv.status === 'Paid' ? 'bg-green-100 text-green-700' : inv.status === 'Unpaid' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>
                      {inv.status}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{inv.student_name}</h3>
                      <p className="text-gray-400 text-xs">ID: {inv.student_id} | Course: {inv.course_name}</p>
                    </div>
                    <div className="text-3xl font-black text-red-600">LKR {inv.total.toLocaleString()}</div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex justify-between border-b border-gray-100 pb-1"><span>Issued:</span> <span>{format(new Date(inv.generated_at), 'dd MMM yyyy')}</span></div>
                      <div className="flex justify-between"><span>Due:</span> <span className={new Date(inv.due_date || '') < new Date() && inv.status !== 'Paid' ? 'text-red-600 font-bold' : ''}>{inv.due_date}</span></div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button onClick={() => generateInvoicePDF(inv)} className="flex-1 py-1.5 glass-button text-xs font-semibold rounded-lg border border-gray-200 flex items-center justify-center gap-1">
                        <Download className="w-3 h-3" /> PDF
                      </button>
                      {inv.status !== 'Paid' && (
                        <button onClick={() => { setPaymentForm({ ...emptyPayment, student_name: inv.student_name, student_id: inv.student_id || '', course_id: inv.course_name || '', invoice_id: inv.id, amount: inv.total }); setShowPaymentModal(true); }}
                          className="flex-1 py-1.5 bg-green-100 text-green-700 hover:bg-green-500/30 text-xs font-bold rounded-lg border border-green-200 transition-colors">
                          Pay Now
                        </button>
                      )}
                      {isHead && (
                        <button onClick={() => handleDeleteInvoice(inv.id)} className="px-3 py-1.5 bg-red-500/10 text-red-600 hover:bg-red-100 rounded-lg border border-red-200">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {filteredInvoices.length === 0 && <div className="col-span-full text-center py-12 text-gray-400">No invoices generated yet.</div>}
              </div>
            </div>
          )}

          {/* ── EXPENSES ── */}
          {activeTab === 'expenses' && (
            <CDMDataTable
              data={expenses}
              columns={[
                {
                  key: 'date', label: 'Date', sortable: true,
                  render: (val: string) => <span className="text-gray-700 font-medium">{val}</span>
                },
                {
                  key: 'category', label: 'Category', sortable: true,
                  render: (val: string) => (
                    <span className="px-2 py-1 rounded-md bg-gray-100 text-xs font-semibold border border-gray-200 text-gray-700">{val}</span>
                  )
                },
                {
                  key: 'amount', label: 'Amount', sortable: true,
                  render: (val: number) => <span className="font-bold text-red-600">LKR {val.toLocaleString()}</span>
                },
                {
                  key: 'notes', label: 'Notes',
                  render: (val: string) => <span className="text-gray-500 max-w-[250px] truncate block">{val || '—'}</span>
                },
              ] as CDMColumn[]}
              actions={isHead ? [
                {
                  label: 'Delete', icon: Trash2, variant: 'danger' as const,
                  onClick: (row: any) => handleDeleteExpense(row.id)
                }
              ] as CDMAction[] : []}
              title="Expenses"
              icon={TrendingDown}
              searchPlaceholder="Search expenses..."
              exportFileName="Expenses_Export"
              emptyMessage="No expenses logged yet"
              headerActions={
                <motion.button whileHover={{ scale: 1.05 }} onClick={() => setShowExpenseModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-semibold text-sm">
                  <Plus className="w-4 h-4" /> Log Expense
                </motion.button>
              }
            />
          )}

          {/* ── REPORTS ── */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Profit & Loss Report</h2>
                <button onClick={exportFinance} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors">
                  <Download className="w-4 h-4" /> Export Report
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex flex-col justify-between h-32 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-400/20 to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                  <div className="flex items-center gap-2 relative z-10">
                    <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><TrendingUp className="w-4 h-4" /></div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Revenue</p>
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 relative z-10">LKR {totalIncome.toLocaleString()}</h3>
                </div>
                
                <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex flex-col justify-between h-32 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-rose-400/20 to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                  <div className="flex items-center gap-2 relative z-10">
                    <div className="p-2 bg-rose-100 rounded-lg text-rose-600"><TrendingDown className="w-4 h-4" /></div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Expenses</p>
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 relative z-10">LKR {totalExpenses.toLocaleString()}</h3>
                </div>
                
                <div className="bg-slate-950 p-6 rounded-2xl shadow-xl border border-slate-800 flex flex-col justify-between h-32 relative overflow-hidden group">
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${netProfit >= 0 ? 'from-emerald-500/30' : 'from-rose-500/30'} to-transparent rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110`} />
                  <div className="flex items-center gap-2 relative z-10">
                    <div className={`p-2 rounded-lg ${netProfit >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}><DollarSign className="w-4 h-4" /></div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Net Profit</p>
                  </div>
                  <h3 className="text-3xl font-black text-white relative z-10">LKR {netProfit.toLocaleString()}</h3>
                </div>
              </div>

              {/* Monthly Breakdown Table */}
              <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 overflow-hidden">
                 <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                   <h3 className="font-bold text-gray-900">6-Month Financial Summary</h3>
                 </div>
                 <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                     <thead>
                       <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-bold">
                         <th className="px-6 py-4">Month</th>
                         <th className="px-6 py-4">Revenue</th>
                         <th className="px-6 py-4">Expenses</th>
                         <th className="px-6 py-4">Net Profit</th>
                         <th className="px-6 py-4">Margin</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        {last6MonthsData.map((data, idx) => {
                          const profit = data.income - data.expense;
                          const margin = data.income > 0 ? ((profit / data.income) * 100).toFixed(1) : 0;
                          return (
                            <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                              <td className="px-6 py-4 font-bold text-gray-900">{data.name}</td>
                              <td className="px-6 py-4 text-emerald-600 font-semibold">LKR {data.income.toLocaleString()}</td>
                              <td className="px-6 py-4 text-rose-500 font-semibold">LKR {data.expense.toLocaleString()}</td>
                              <td className={`px-6 py-4 font-bold ${profit >= 0 ? 'text-gray-900' : 'text-rose-600'}`}>LKR {profit.toLocaleString()}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${profit >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                  {profit >= 0 ? '+' : ''}{margin}%
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                     </tbody>
                   </table>
                 </div>
              </div>

              {/* Expense Categories Detailed */}
              <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="font-bold text-gray-900">Expense Distribution</h3>
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                   {expensePieData.map((cat, idx) => (
                     <div key={idx} className="space-y-2">
                       <div className="flex justify-between items-center text-sm">
                         <span className="font-semibold text-gray-600 flex items-center gap-2">
                           <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: pieColors[idx % pieColors.length] }}></span>
                           {cat.name}
                         </span>
                         <span className="font-bold text-gray-900">LKR {cat.value.toLocaleString()}</span>
                       </div>
                       <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                         <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${totalExpenses > 0 ? (cat.value / totalExpenses) * 100 : 0}%`, backgroundColor: pieColors[idx % pieColors.length] }}></div>
                       </div>
                       <p className="text-[10px] text-gray-400 text-right font-bold tracking-wider">
                         {totalExpenses > 0 ? ((cat.value / totalExpenses) * 100).toFixed(1) : 0}%
                       </p>
                     </div>
                   ))}
                </div>
              </div>

            </div>
          )}

          {/* ── LEAD CONFIRMATIONS ── */}
          {activeTab === 'lead-confirmations' && (
            <FinanceLeadConfirmationsView currentUser={currentUser} onRefresh={loadData} />
          )}

          {activeTab === 'calendar' && <SriLankaCalendar accentColor="blue" />}
          {activeTab === 'leave-requests' && <LeaveRequestsView />}
          {activeTab === 'attendance' && (
            <div className="bg-white border border-gray-200 p-6 rounded-2xl border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">My Attendance</h2>
              <p className="text-gray-500 mb-4">Your personal attendance records.</p>
              <StaffAttendance />
            </div>
          )}
          {activeTab === 'profile' && currentUser && (
            <ProfileSection userData={currentUser} />
          )}

          {activeTab === 'tasks' && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 min-h-[600px]">
              <IMSTasksPage embedded={true} />
            </div>
          )}

        </main>
      </div>

      {/* ── PAYMENT MODAL ── */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-gray-900">Record Payment</h2>
                <button onClick={() => setShowPaymentModal(false)} className="text-gray-500 hover:text-gray-900"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSavePayment} className="space-y-3">
                {[['Student Name *', 'student_name', 'text', true], ['Student ID', 'student_id', 'text', false]].map(([label, key, type, req]) => (
                  <div key={key as string}>
                    <label className="block text-gray-600 text-sm mb-1">{label as string}</label>
                    <input type={type as string} required={req as boolean} value={(paymentForm as any)[key as string]}
                      onChange={e => setPaymentForm(p => ({ ...p, [key as string]: e.target.value }))}
                      className="w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-red-500" />
                  </div>
                ))}
                <div>
                  <label className="block text-gray-600 text-sm mb-1">Course</label>
                  <select
                    value={paymentForm.course_id || ''}
                    onChange={e => setPaymentForm(p => ({ ...p, course_id: e.target.value }))}
                    className="w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-red-500"
                  >
                    <option value="">-- Select Course (Optional) --</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 text-sm mb-1">Amount (LKR) *</label>
                  <input type="number" required value={paymentForm.amount} onChange={e => setPaymentForm(p => ({ ...p, amount: Number(e.target.value) }))}
                    className="w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-gray-600 text-sm mb-1">Method</label>
                  <select value={paymentForm.method} onChange={e => setPaymentForm(p => ({ ...p, method: e.target.value as 'Cash' | 'Bank Transfer' | 'Online' }))}
                    className="w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-red-500">
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                {[['Date', 'date', 'date'], ['Notes', 'notes', 'text']].map(([label, key, type]) => (
                  <div key={key}>
                    <label className="block text-gray-600 text-sm mb-1">{label}</label>
                    <input type={type} value={(paymentForm as any)[key]} onChange={e => setPaymentForm(p => ({ ...p, [key]: e.target.value }))}
                      className="w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-red-500" />
                  </div>
                ))}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl border border-gray-200">Cancel</button>
                  <button type="submit" className="flex-1 py-2 bg-gradient-to-r from-red-500 to-violet-600 text-white rounded-xl font-semibold">Save</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── INVOICE MODAL ── */}
      <AnimatePresence>
        {showInvoiceModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-gray-900">New Invoice</h2>
                <button onClick={() => setShowInvoiceModal(false)} className="text-gray-500 hover:text-gray-900"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSaveInvoice} className="space-y-3">
                {[['Student Name *', 'student_name', true], ['Student ID', 'student_id', false]].map(([label, key, req]) => (
                  <div key={key as string}>
                    <label className="block text-gray-600 text-sm mb-1">{label as string}</label>
                    <input required={req as boolean} value={(invoiceForm as any)[key as string]}
                      onChange={e => setInvoiceForm(p => ({ ...p, [key as string]: e.target.value }))}
                      className="w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-red-500" />
                  </div>
                ))}
                <div>
                  <label className="block text-gray-600 text-sm mb-1">Course Name</label>
                  <select
                    value={invoiceForm.course_name}
                    onChange={e => setInvoiceForm(p => ({ ...p, course_name: e.target.value }))}
                    className="w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-red-500"
                  >
                    <option value="">-- Select Course (Optional) --</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.title}>{c.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 text-sm mb-1">Due Date</label>
                  <input type="date" value={invoiceForm.due_date} onChange={e => setInvoiceForm(p => ({ ...p, due_date: e.target.value }))}
                    className="w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-gray-600 text-sm">Line Items</label>
                    <button type="button" onClick={() => setInvoiceForm(p => ({ ...p, items: [...p.items, { description: '', amount: 0 }] }))}
                      className="text-xs text-red-600 hover:text-red-600 flex items-center gap-1"><Plus className="w-3 h-3" /> Add Item</button>
                  </div>
                  {invoiceForm.items.map((item, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input placeholder="Description" value={item.description}
                        onChange={e => { const items = [...invoiceForm.items]; items[i].description = e.target.value; setInvoiceForm(p => ({ ...p, items })); }}
                        className="flex-1 bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-red-500 text-sm" />
                      <input type="number" placeholder="LKR" value={item.amount}
                        onChange={e => { const items = [...invoiceForm.items]; items[i].amount = Number(e.target.value); setInvoiceForm(p => ({ ...p, items })); }}
                        className="w-28 bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-red-500 text-sm" />
                      {invoiceForm.items.length > 1 && (
                        <button type="button" onClick={() => setInvoiceForm(p => ({ ...p, items: p.items.filter((_, j) => j !== i) }))}
                          className="text-gray-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                      )}
                    </div>
                  ))}
                  <div className="text-right text-sm font-bold text-red-600">
                    Total: LKR {invoiceForm.items.reduce((s, i) => s + i.amount, 0).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowInvoiceModal(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl border border-gray-200">Cancel</button>
                  <button type="submit" className="flex-1 py-2 bg-gradient-to-r from-red-500 to-violet-600 text-gray-900 rounded-xl font-semibold">Create Invoice</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── EXPENSE MODAL ── */}
      <AnimatePresence>
        {showExpenseModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-gray-900">Log Expense</h2>
                <button onClick={() => setShowExpenseModal(false)} className="text-gray-500 hover:text-gray-900"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSaveExpense} className="space-y-3">
                <div>
                  <label className="block text-gray-600 text-sm mb-1">Category</label>
                  <select value={expenseForm.category} onChange={e => setExpenseForm(p => ({ ...p, category: e.target.value as any }))}
                    className="w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-red-500">
                    {EXPENSE_CATS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 text-sm mb-1">Amount (LKR) *</label>
                  <input type="number" required value={expenseForm.amount} onChange={e => setExpenseForm(p => ({ ...p, amount: Number(e.target.value) }))}
                    className="w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-gray-600 text-sm mb-1">Date</label>
                  <input type="date" value={expenseForm.date} onChange={e => setExpenseForm(p => ({ ...p, date: e.target.value }))}
                    className="w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-gray-600 text-sm mb-1">Notes</label>
                  <textarea value={expenseForm.notes} onChange={e => setExpenseForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                    className="w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-red-500 resize-none" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowExpenseModal(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl border border-gray-200">Cancel</button>
                  <button type="submit" className="flex-1 py-2 bg-gradient-to-r from-red-500 to-violet-600 text-gray-900 rounded-xl font-semibold">Save</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}




"use client"

import React, { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, Legend
} from "recharts"

import {
  Megaphone, Users, Phone,
  Clock, ListTodo, Calendar, User, LogOut,
  Building2, Menu, Share
} from "lucide-react"

import { supabase } from "@/lib/supabase"
import { getCurrentUser, signOut } from "@/lib/auth"
import { getMarketingLeads, getMarketingCampaigns, getAllProfiles, subscribeToMarketingLeads } from "@/lib/ims-data"
import type { MarketingLead, MarketingCampaign, Profile } from "@/types"

import SriLankaCalendar from "@/components/ims/SriLankaCalendar"
import StaffAttendance from "@/components/ims/StaffAttendance"
import ProfileSection from "@/components/ims/ProfileSection"
import LeaveRequestsView from "@/components/ims/LeaveRequestsView"
import IMSTasksPage from "../tasks/page"

import LeadPipelineView from "@/components/ims/marketing/LeadPipelineView"
import FollowUpsView from "@/components/ims/marketing/FollowUpsView"
import CampaignsView from "@/components/ims/marketing/CampaignsView"

export default function MarketingDashboard() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const [leads, setLeads] = useState<MarketingLead[]>([])
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([])
  const [staff, setStaff] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [l, c, s, u] = await Promise.all([
        getMarketingLeads(), getMarketingCampaigns(), getAllProfiles(), getCurrentUser()
      ])
      setLeads(l); setCampaigns(c)
      setStaff(s.filter(p => ["admin","super_admin","branch_manager","marketing_staff", "marketing_head", "marketing_officer"].includes(p.role)))
      setCurrentUser(u)
    } catch (e: any) { toast.error("Load failed: " + e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])
  
  useEffect(() => {
    const unsub = subscribeToMarketingLeads(setLeads)
    return () => unsub()
  }, [])
  
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

  useEffect(() => { 
    const t = setTimeout(() => setShowLoadingAnimation(false), 2000); 
    return () => clearTimeout(t); 
  }, [])

  const handleLogout = async () => {
    await signOut()
    router.push('/auth/login')
  }

  const navSections = [
    {
      label: '🚀 Marketing',
      items: [
        { id: 'overview',       label: 'Overview',        icon: Building2,    badge: 0 },
        { id: 'pipeline',       label: 'Lead Pipeline',   icon: Users,        badge: leads.filter(l => l.status === 'New').length },
        { id: 'follow-ups',     label: 'Follow-ups',      icon: Phone,        badge: 0 },
        { id: 'campaigns',      label: 'Campaigns',       icon: Megaphone,    badge: 0 },
      ]
    },
    {
      label: '📋 My Work',
      items: [
        { id: 'tasks',          label: 'Tasks',            icon: ListTodo,     badge: 0 },
        { id: 'leave-requests', label: 'My Leaves',   icon: Calendar,     badge: 0 },
        { id: 'my-attendance',  label: 'My Attendance',    icon: Clock,        badge: 0 },
        { id: 'profile',        label: 'My Profile',       icon: User,         badge: 0 },
      ]
    },
    {
      label: '🗂 Tools',
      items: [
        { id: 'calendar',       label: 'Calendar',         icon: Calendar,     badge: 0 },
      ]
    },
  ]

  if (loading && showLoadingAnimation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
          <h2 className="text-xl font-bold text-gray-900">Loading Marketing Data...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900 selection:bg-orange-100">
      
      {/* 📱 Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center shadow-lg"><Megaphone className="w-4 h-4 text-white" /></div>
          <span className="font-bold text-lg">Marketing</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-600 bg-gray-50 rounded-xl"><Menu className="w-5 h-5" /></button>
      </div>

      {/* 🚀 SIDEBAR */}
      <aside className={`fixed md:sticky top-0 left-0 h-screen w-[280px] bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 z-40 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="h-20 flex items-center gap-3 px-6 border-b border-gray-50">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Megaphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight text-gray-900">Marketing</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Scholar Sync</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
          {navSections.map(section => (
            <div key={section.label}>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest px-2 mb-1.5">{section.label}</p>
              <div className="space-y-0.5">
                {section.items.map(item => (
                  <motion.button key={item.id} whileHover={{ x: 2 }} whileTap={{ scale: 0.97 }}
                    onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-sm relative ${
                      activeTab === item.id ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg shadow-orange-500/20' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}>
                    {activeTab === item.id && <motion.div layoutId="mkt-active-pill" className="absolute left-0 top-0 bottom-0 w-0.5 bg-white rounded-full" />}
                    <item.icon className={`w-4 h-4 flex-shrink-0 ${activeTab === item.id ? 'text-white' : 'text-gray-500'}`} />
                    <span className="flex-1 text-left font-medium">{item.label}</span>
                    {item.badge > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === item.id ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'}`}>
                        {item.badge}
                      </span>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-50">
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* 🌟 MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-6 min-h-[calc(100vh-80px)] overflow-auto space-y-5 bg-gray-50 mt-16 md:mt-0">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Leads', value: leads.length, color: 'from-orange-500 to-pink-500', icon: Users },
                { label: 'Converted', value: leads.filter(l => l.status === 'Converted').length, color: 'from-emerald-500 to-cyan-500', icon: Share },
                { label: 'Active Campaigns', value: campaigns.length, color: 'from-purple-500 to-indigo-500', icon: Megaphone },
                { label: 'Pending Follow-ups', value: leads.reduce((acc, l) => acc + (l.follow_ups?.filter(f => !f.done).length || 0), 0), color: 'from-amber-500 to-orange-500', icon: Phone },
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Leads by Course */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-6">Leads by Course</h2>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={["AutoCAD", "SolidWorks", "3ds Max", "Revit", "CATIA"].map(c => ({ name: c, count: leads.filter(l => l.course_interested === c).length }))} barSize={32}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dx={-10} />
                      <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="count" fill="#F97316" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Source Distribution */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-6">Leads by Source</h2>
                <div className="h-[300px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={["Facebook", "Website", "Walk-in", "Referral", "WhatsApp"].map(s => ({ name: s, value: leads.filter(l => l.source === s).length }))} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                        {["Facebook", "Website", "Walk-in", "Referral", "WhatsApp"].map((_, index) => (
                          <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'][index % 5]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {/* MODULAR VIEWS */}
        {activeTab === 'pipeline' && <LeadPipelineView leads={leads} staff={staff} currentUser={currentUser} onRefresh={loadData} />}
        {activeTab === 'follow-ups' && <FollowUpsView leads={leads} onRefresh={loadData} />}
        {activeTab === 'campaigns' && <CampaignsView />}

        {/* MY WORK / TOOLS */}
        {activeTab === 'calendar' && <SriLankaCalendar accentColor="orange" />}
        {activeTab === 'leave-requests' && <LeaveRequestsView />}
        {activeTab === 'my-attendance' && (
          <div className="bg-white border border-gray-200 p-6 rounded-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">My Attendance</h2>
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
  )
}

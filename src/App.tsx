/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Users, 
  Settings, 
  UserPlus, 
  Upload, 
  Sparkles, 
  HelpCircle, 
  Trash2, 
  CheckCircle, 
  Loader2, 
  AlertTriangle,
  Github,
  Search,
  Menu,
  X,
  Plus,
  Camera,
  Check,
  Database,
  Wifi,
  UserCheck,
  Copy,
  Info,
  Calendar,
  Image as ImageIcon,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { Guest, AppSettings, DashboardStats } from "./types";
import { 
  getAppSettings, 
  saveAppSettings, 
  fetchGuests, 
  checkInGuest, 
  addOrUpdateGuest, 
  deleteGuest, 
  bulkImportGuests, 
  calculateStats,
  isGasEnvironment,
  CODE_GS_PATCH
} from "./lib/gasService";

import StatsGrid from "./components/StatsGrid";
import GuestListTable from "./components/GuestListTable";
import CameraCheckInModal from "./components/CameraCheckInModal";
import AddEditGuestModal from "./components/AddEditGuestModal";
import BulkImportModal from "./components/BulkImportModal";

export default function App() {
  // App Config and Core States
  const [settings, setSettings] = useState<AppSettings>({ mode: "local", gasWebAppUrl: "" });
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalGuests: 0,
    attendedGuests: 0,
    pendingGuests: 0,
    totalPax: 0,
    categoryBreakdown: {}
  });

  // Active Menu Tab state for Minimalist Sidebar Navigation
  const [activeTab, setActiveTab] = useState<"checkin" | "list" | "settings">("checkin");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [checkInSearchQuery, setCheckInSearchQuery] = useState<string>("");

  // Modal Control States
  const [activeCheckInGuest, setActiveCheckInGuest] = useState<Guest | null>(null);
  const [activeEditGuest, setActiveEditGuest] = useState<Guest | null>(null);
  const [guestToDelete, setGuestToDelete] = useState<{ id: string; name: string } | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);

  // Connection settings states for inline Settings Tab
  const [inlineMode, setInlineMode] = useState<"local" | "gas">("local");
  const [inlineUrl, setInlineUrl] = useState<string>("");
  const [inlineCopied, setInlineCopied] = useState<boolean>(false);
  const [inlineSaving, setInlineSaving] = useState<boolean>(false);

  // Notifications
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Initialize and load configurations
  useEffect(() => {
    const loadedSettings = getAppSettings();
    
    // Auto force GAS mode if we are running live from inside Apps Script environment
    if (isGasEnvironment()) {
      loadedSettings.mode = "gas";
    }
    
    setSettings(loadedSettings);
    setInlineMode(loadedSettings.mode);
    setInlineUrl(loadedSettings.gasWebAppUrl || "");
    loadGuests(loadedSettings);
  }, []);

  // Recalculate summary stats whenever guests update
  useEffect(() => {
    const computed = calculateStats(guests);
    setStats(computed);
  }, [guests]);

  // Toast auto-dismisser
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  function triggerToast(message: string, type: "success" | "error" | "info" = "success") {
    setToast({ message, type });
  }

  function handleDownloadTemplate() {
    const csvContent = 
      "Nama Tamu,Kategori,Jumlah Pendamping,Catatan\n" +
      "Joko Susilo,VIP Utama,2,Teman masa kecil pengantin pria\n" +
      "Siti Aminah,Keluarga,1,Tante dari pihak ibu\n" +
      "Hendra Wijaya,Kerabat,0,Alumni Universitas Indonesia\n" +
      "Diana Lestari,Umum,3,Tetangga kompleks\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "format_import_tamu.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast("Berhasil mengunduh format database tamu!", "success");
  }

  async function loadGuests(activeSettings: AppSettings) {
    setLoading(true);
    try {
      const list = await fetchGuests(activeSettings);
      setGuests(list);
    } catch (err: any) {
      triggerToast(err.message || "Gagal mengambil data tamu.", "error");
    } finally {
      setLoading(false);
    }
  }

  // Action: Check-In confirmation
  async function handleCheckInConfirm(guestCount: number, photoBase64: string, notes: string) {
    if (!activeCheckInGuest) return;

    try {
      const result = await checkInGuest(settings, activeCheckInGuest.id, guestCount, photoBase64, notes);
      if (result.success) {
        triggerToast(`Sukses check-in ${activeCheckInGuest.name}!`, "success");
        setActiveCheckInGuest(null);
        // Clear search query to prompt clean slate
        setCheckInSearchQuery("");
        // Refresh local memory representation
        await loadGuests(settings);
      } else {
        triggerToast(result.message || "Gagal memproses check-in.", "error");
      }
    } catch (err: any) {
      triggerToast(err.message || "Error saat melakukan check-in.", "error");
    }
  }

  // Action: Save Guest Detail (Add or Edit)
  async function handleSaveGuest(guestData: Partial<Guest>) {
    try {
      const result = await addOrUpdateGuest(settings, guestData);
      if (result.success) {
        triggerToast(
          guestData.id ? "Data tamu berhasil diperbarui!" : "Berhasil menambahkan tamu baru!",
          "success"
        );
        setShowAddModal(false);
        setActiveEditGuest(null);
        await loadGuests(settings);
      } else {
        triggerToast(result.message || "Gagal menyimpan tamu.", "error");
      }
    } catch (err: any) {
      triggerToast(err.message || "Error saat berkomunikasi dengan server.", "error");
    }
  }

  // Action: Delete Guest Confirmation
  async function handleDeleteConfirm() {
    if (!guestToDelete) return;

    try {
      const result = await deleteGuest(settings, guestToDelete.id);
      if (result.success) {
        triggerToast(`Tamu ${guestToDelete.name} sukses dihapus dari rekor.`, "success");
        setGuestToDelete(null);
        await loadGuests(settings);
      } else {
        triggerToast(result.message || "Gagal menghapus rekor.", "error");
      }
    } catch (err: any) {
      triggerToast(err.message || "Error saat menghapus data.", "error");
    }
  }

  // Action: Bulk Import
  async function handleBulkImport(guestList: Partial<Guest>[]) {
    try {
      const result = await bulkImportGuests(settings, guestList);
      if (result.success) {
        triggerToast(`Berhasil mengimpor massal ${result.count} data tamu!`, "success");
        setShowImportModal(false);
        await loadGuests(settings);
      } else {
        triggerToast(result.message || "Gagal melakukan impor massal.", "error");
      }
    } catch (err: any) {
      triggerToast(err.message || "Terjadi kesalahan impor massal.", "error");
    }
  }

  // Action: Update settings (switching local vs gas)
  function handleSaveSettings(newSettings: AppSettings) {
    saveAppSettings(newSettings);
    setSettings(newSettings);
    triggerToast(`Pengaturan disimpan. Beralih ke Mode ${newSettings.mode === "gas" ? "Sinkronisasi Live" : "Simulasi lokal"}`, "success");
    loadGuests(newSettings);
  }

  // Action: Inline Connection Save inside Settings tab
  function handleInlineSaveSettings() {
    setInlineSaving(true);
    const newSettings: AppSettings = {
      mode: inlineMode,
      gasWebAppUrl: inlineUrl.trim()
    };
    saveAppSettings(newSettings);
    setSettings(newSettings);
    
    setTimeout(() => {
      setInlineSaving(false);
      triggerToast(
        `Pengaturan disimpan! Sistem beralih ke Mode ${
          inlineMode === "gas" ? "Sinkronisasi Live Google Sheets" : "Simulasi Lokal (Offline)"
        }.`,
        "success"
      );
      loadGuests(newSettings);
    }, 450);
  }

  function handleCopyPatchCode() {
    navigator.clipboard.writeText(CODE_GS_PATCH);
    setInlineCopied(true);
    setTimeout(() => setInlineCopied(false), 2000);
  }

  // Guest Filtering for instant gate check-in search
  const searchedGuests = checkInSearchQuery.trim()
    ? guests.filter(
        (g) =>
          g.name.toLowerCase().includes(checkInSearchQuery.toLowerCase()) ||
          g.id.toLowerCase().includes(checkInSearchQuery.toLowerCase())
      )
    : [];

  // Helper classes for Category badge inside Check-In Gateway Search Result Card
  function getCategoryBadgeClass(cat: string) {
    switch (cat) {
      case "VIP Utama":
      case "VIP":
        return "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/35 font-bold";
      case "Keluarga":
        return "bg-[#5A5A40]/10 text-[#5A5A40] border-[#5A5A40]/30 font-bold";
      default:
        return "bg-[#F5F5F0] text-[#8A8A70] border-[#F5F5F0]/80";
    }
  }

  // Navigation Links definition
  const navSidebarMenu = [
    { id: "checkin", label: "Check-In Gate", sub: "Petugas Lapangan", icon: Camera },
    { id: "list", label: "Daftar Tamu", sub: "Buku Database Utama", icon: Users },
    { id: "settings", label: "Integrasi Sheets", sub: "Konfigurasi Sinkron", icon: Settings }
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#1F1F17] text-[#EBEBE4]">
      {/* Sidebar Header Brand */}
      <div className="p-6 border-b border-[#D4AF37]/15" style={{ backgroundColor: '#0b172a' }}>
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          <span className="text-[10px] tracking-[0.25em] font-bold uppercase text-[#D4AF37] font-mono">
            Reception &amp; Log
          </span>
        </div>
        <h1 className="text-xl font-serif text-white font-normal italic leading-tight">
          Wedding Guest Book
        </h1>
        <p className="text-[10px] text-[#8A8A70] mt-0.5 font-sans leading-relaxed">
          By Dream08
        </p>
      </div>

      {/* Tabs list menu */}
      <nav className="flex-1 px-4 py-6 space-y-2" style={{ backgroundColor: '#0b172a' }}>
        {navSidebarMenu.map((item, idx) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as any);
                setMobileSidebarOpen(false);
              }}
              style={(idx === 0 || idx === 1) ? { backgroundColor: '#0b172a' } : undefined}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition text-left cursor-pointer ${
                isActive 
                  ? "bg-[#5A5A40] text-white border border-[#D4AF37]/25 font-semibold" 
                  : "text-[#8A8A70] hover:bg-[#5A5A40]/10 hover:text-[#EBEBE4]"
              }`}
            >
              <div className={`p-1.5 rounded-lg shrink-0 ${isActive ? "text-[#D4AF37]" : "text-[#8A8A70]"}`}>
                <IconComponent className="w-5 h-5" />
              </div>
              <div className="line-clamp-1">
                <span className="text-xs font-semibold block">{item.label}</span>
                <span className="text-[10px] text-[#8A8A70]/80 block font-normal leading-normal">{item.sub}</span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer Branding */}
      <div className="p-6 text-[#8A8A70] text-[10px] space-y-3.5 border-t border-[#D4AF37]/10" style={{ backgroundColor: '#0b172a' }}>
        <div>
          <span className="text-white block font-semibold mb-1">Status Keamanan</span>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${settings.mode === "gas" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
            <span className="text-[11px]">
              {settings.mode === "gas" ? "Live Connected" : "Local Database"}
            </span>
          </div>
        </div>
        <div className="pt-2 border-t border-[#8A8A70]/10 flex items-center justify-between">
          <span>Organized by <strong>Dream8</strong></span>
          <span className="font-mono text-[9px] opacity-60">2026</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#333322] flex font-sans selection:bg-[#D4AF37]/20 selection:text-[#333322]">
      
      {/* Elegantly styled Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            id="app-toast-alert"
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-xl font-medium text-xs border max-w-sm backdrop-blur-md"
            style={{
              backgroundColor: toast.type === "success" ? "rgba(245, 245, 240, 0.95)" : toast.type === "error" ? "rgba(254, 242, 242, 0.95)" : "rgba(240, 249, 255, 0.95)",
              borderColor: toast.type === "success" ? "#D4AF37" : toast.type === "error" ? "#FECACA" : "#BAE6FD",
              color: toast.type === "success" ? "#5A5A40" : toast.type === "error" ? "#991B1B" : "#075985"
            }}
          >
            {toast.type === "success" && <CheckCircle className="w-4 h-4 shrink-0 text-[#5A5A40]" />}
            {toast.type === "error" && <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SIDEBAR NAVIGATION - DESKTOP LAYOUT (Always open on left) */}
      <aside className="hidden md:block w-64 h-screen fixed top-0 left-0 border-r border-[#D4AF37]/15 shrink-0 z-30">
        {sidebarContent}
      </aside>

      {/* SIDEBAR NAVIGATION - MOBILE DRAWER (Controlled by burger menu toggle) */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-55 md:hidden">
            {/* Backdrop black overlay click-out */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute inset-0 bg-black"
            />
            
            {/* Drawer main panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="absolute top-0 left-0 w-72 h-full shadow-2xl relative z-10"
            >
              {sidebarContent}
              {/* Force floating close button */}
              <button 
                onClick={() => setMobileSidebarOpen(false)}
                className="absolute top-4 right-[-50px] p-2 bg-[#1F1F17] hover:bg-[#333322] border border-[#D4AF37]/20 text-white rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MAIN SCREEN WORKSPACE CONTAINER (Has spacing padding left on Desktop to make way for Sidebar) */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        
        {/* MOBILE STICKY NAVBAR HEADER */}
        <header className="md:hidden flex items-center justify-between px-6 py-4 bg-[#F5F5F0] border-b border-[#D4AF37]/15 z-20 shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 -ml-2 rounded-xl text-[#5A5A40] hover:bg-[#EBEBE4]/50 transition cursor-pointer"
              title="Open Sidebar Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-serif italic text-base font-normal text-[#5A5A40]">
              Rara &amp; Hilman Wedding
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${settings.mode === "gas" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
            <span className="text-[10px] text-[#8A8A70] uppercase font-bold font-mono tracking-wider">
              {settings.mode === "gas" ? "Live" : "Local"}
            </span>
          </div>
        </header>

        {/* WORKSPACE CENTRAL WRAPPER */}
        <main className="flex-1 p-4 md:p-8 flex flex-col gap-6 overflow-y-auto">
          
          {/* =======================================================
              VIEW 1: CHECK-IN GATE MINIMALIST DASHBOARD
              ======================================================= */}
          {activeTab === "checkin" && (
            <div className="flex-1 flex flex-col justify-start max-w-4xl mx-auto w-full py-8 md:py-12" id="checkin-gate-view">
              
              {/* Header Gate Info */}
              <div className="flex items-center justify-between border-b border-[#D4AF37]/15 pb-4 mb-10">
                <div>
                  <h2 className="text-[11px] font-bold text-[#8A8A70] uppercase font-mono tracking-widest">
                    Minimalist Wedding Gateway
                  </h2>
                  <p className="text-xs text-[#5A5A40] font-serif font-light leading-normal mt-0.5">
                    Mode Antrean Kilat • Petugas Gerbang Utama (Gate Master)
                  </p>
                </div>
                <div>
                  {settings.mode === "gas" ? (
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-500/20 text-[#5A5A40] px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-xs">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping shrink-0" />
                      <span className="w-1.5 h-1.5 bg-emerald-650 rounded-full shrink-0 -ml-3.5" />
                      <span className="text-emerald-800 text-[11px]">Live Sync Connected</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-[#EBEBE4]/40 border border-[#D4AF37]/20 text-[#8A8A70] px-3.5 py-1.5 rounded-full text-xs font-semibold">
                      <span className="w-1.5 h-1.5 bg-amber-550 rounded-full shrink-0" />
                      <span className="text-[11px]">Simulasi (Lokal)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Central Information Organizer Center */}
              <div className="flex flex-col items-center text-center self-center w-full max-w-2xl px-2">
                
                {/* Event Organizer Logo (Dream8) - Center Accent */}
                <div className="mb-6 flex flex-col items-center">
                  <div className="w-24 h-24 bg-[#5A5A40] text-[#D4AF37] rounded-full flex items-center justify-center font-serif text-4xl font-light shadow-md border border-[#D4AF37]/35 tracking-widest transition duration-300 hover:scale-105">
                    D8
                  </div>
                  <div className="mt-3.5 px-3 py-0.5 border border-[#D4AF37]/20 rounded-md bg-[#EBEBE4]/30 text-[9px] uppercase tracking-[0.25em] font-bold text-[#8A8A70]">
                    Wujudkan Pesta Impian Anda Bersama Kami
                  </div>
                </div>

                <h1 className="text-4xl md:text-5xl font-serif text-[#5A5A40] tracking-tight font-normal italic leading-tight text-center">
                  Selamat datang
                </h1>
                <p className="text-xs text-[#8A8A70] mt-2.5 max-w-md leading-relaxed font-sans text-center">
                  Temukan Nama Anda Untuk Konfirmasi Kehadiran Anda
                </p>

                {/* Dominant and Instructive Search Bar */}
                <div className="w-full mt-8 relative" id="search-box-holder">
                  <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 text-[#8A8A70] w-5.5 h-5.5" />
                  <input
                    type="text"
                    value={checkInSearchQuery}
                    onChange={(e) => setCheckInSearchQuery(e.target.value)}
                    placeholder="Masukan nama tamu atau ID unik undangan di sini..."
                    className="w-full text-sm md:text-base text-[#333322] border-2 border-[#D4AF37]/40 rounded-2xl pl-12 pr-4 py-4 md:py-4.5 bg-white focus:border-[#5A5A40] focus:ring-4 focus:ring-[#5A5A40]/5 focus:outline-none transition-all placeholder:text-[#8A8A70]/60 shadow-xs tracking-wide"
                  />
                  {checkInSearchQuery && (
                    <button
                      onClick={() => setCheckInSearchQuery("")}
                      className="absolute right-4.5 top-1/2 -translate-y-1/2 text-[#8A8A70] hover:text-[#5A5A40] transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Live Output Search Results */}
                {checkInSearchQuery && (
                  <div className="w-full mt-4 bg-white border border-[#D4AF37]/25 rounded-2xl overflow-hidden shadow-md flex flex-col divide-y divide-[#F5F5F0] max-h-[380px] overflow-y-auto text-left z-10 transition">
                    
                    <div className="px-4 py-2 bg-[#F5F5F0]/50 text-[10px] font-bold uppercase tracking-wider text-[#8A8A70]">
                      Hasil Pencarian ({searchedGuests.length} Tamu Ditemukan)
                    </div>

                    {searchedGuests.length === 0 ? (
                      <div className="p-8 text-center text-[#8A8A70]">
                        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                        <span className="text-xs font-bold text-[#5A5A40] block">Tamu Tidak Terdaftar</span>
                        <p className="text-[11px] text-[#8A8A70] mt-1 max-w-sm mx-auto">
                          Nama atau ID <strong>&quot;{checkInSearchQuery}&quot;</strong> tidak terdaftar dalam database undangan kami. Silakan gunakan tombol walk-in untuk pendaftaran manual instan.
                        </p>
                        <button
                          onClick={() => setShowAddModal(true)}
                          className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-[#5A5A40] hover:bg-[#4A4A30] rounded-xl transition shadow-xs cursor-pointer"
                        >
                          Registrasi Walk-In Guest
                        </button>
                      </div>
                    ) : (
                      searchedGuests.map((guest) => (
                        <div 
                          key={guest.id}
                          className="p-4 hover:bg-[#F5F5F0]/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-[#333322] text-sm">{guest.name}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] border uppercase ${getCategoryBadgeClass(guest.category)}`}>
                                {guest.category}
                              </span>
                            </div>
                            <div className="flex items-center gap-3.5 mt-1 text-[11px] text-[#8A8A70] font-mono">
                              <span>ID: <strong className="text-[#5A5A40]">{guest.id}</strong></span>
                              <span>•</span>
                              <span>Pendaftar +{guest.guestCount} Pendamping</span>
                            </div>
                            {guest.notes && (
                              <p className="text-[11px] text-[#8A8A70] mt-1 italic italic-clamp max-w-md">
                                Catatan: &quot;{guest.notes}&quot;
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                            {guest.status === "Hadir" ? (
                              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-1.5 rounded-xl text-xs font-bold">
                                <Check className="w-4 h-4 text-emerald-600" />
                                <span>Sudah Hadir ({guest.checkInTime ? guest.checkInTime.split(" ")[1] : "Gate"})</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => setActiveCheckInGuest(guest)}
                                className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#5A5A40] hover:bg-[#4A4A30] px-4 py-2 rounded-xl transition active:scale-95 shadow-xs cursor-pointer"
                              >
                                <Camera className="w-3.5 h-3.5" /> Ambil Foto &amp; Check-In
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Walk-In Quick Access Panel */}
                <div className="mt-12 pt-8 border-t border-[#D4AF37]/15 w-full flex flex-col sm:flex-row items-center justify-center gap-3">
                  <span className="text-xs text-[#8A8A70] font-medium font-sans">
                    Tamu tidak membawa kartu undangan atau belum terdaftar?
                  </span>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#D4AF37]/35 hover:bg-[#EBEBE4]/40 font-semibold text-xs text-[#5A5A40] bg-white transition cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 text-[#D4AF37]" /> Registrasi Manual (Walk-In)
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* =======================================================
              VIEW 2: Buku Daftar Tamu & Data Dashboard Utama
              ======================================================= */}
          {activeTab === "list" && (
            <div className="flex flex-col gap-6" id="bulk-database-view">
              
              {/* Statistics Widgets Grid */}
              <StatsGrid stats={stats} />

              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-serif text-[#5A5A40] font-normal italic">
                      Daftar Kehadiran Buku Tamu
                    </h2>
                    <p className="text-xs text-[#8A8A70] mt-0.5">
                      Kelola filter kategori, periksa snapshot check-in kamera, dan lakukan perubahan entri.
                    </p>
                  </div>

                  {/* Actions Bar inside database view */}
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={handleDownloadTemplate}
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#D4AF37]/30 hover:bg-[#F5F5F0] text-xs text-[#5A5A40] font-semibold transition bg-white flex-1 sm:flex-none cursor-pointer hover:border-[#D4AF37]/60"
                      id="database-download-template-btn"
                    >
                      <Download className="w-4 h-4 text-[#D4AF37]" /> Unduh Format (.csv)
                    </button>
                    <button
                      onClick={() => setShowImportModal(true)}
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#D4AF37]/30 hover:bg-[#F5F5F0] text-xs text-[#5A5A40] font-semibold transition bg-white flex-1 sm:flex-none cursor-pointer hover:border-[#D4AF37]/60"
                      id="database-import-btn"
                    >
                      <Upload className="w-4 h-4 text-[#D4AF37]" /> Impor Masal
                    </button>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#5A5A40] hover:bg-[#4A4A30] text-xs text-white font-semibold transition flex-1 sm:flex-none shadow-xs cursor-pointer"
                      id="database-add-btn"
                    >
                      <UserPlus className="w-4 h-4 text-[#D4AF37]" /> Tambah Baru
                    </button>
                  </div>
                </div>

                {/* Table Component Block */}
                {loading ? (
                  <div className="p-24 rounded-3xl border border-[#D4AF37]/20 bg-white shadow-xs flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
                    <span className="text-xs text-[#8A8A70] font-semibold">Tengah mempersiapkan database buku tamu...</span>
                  </div>
                ) : (
                  <GuestListTable
                    guests={guests}
                    onCheckInClick={(guest) => setActiveCheckInGuest(guest)}
                    onEditClick={(guest) => setActiveEditGuest(guest)}
                    onDeleteClick={(id, name) => setGuestToDelete({ id, name })}
                  />
                )}
              </div>
            </div>
          )}

          {/* =======================================================
              VIEW 3: INTEGRASI GOOGLE SHEETS / EXCEL (INLINE SETTINGS)
              ======================================================= */}
          {activeTab === "settings" && (
            <div className="max-w-3xl mx-auto w-full py-6" id="inline-settings-tab">
              <div className="bg-white rounded-3xl border border-[#D4AF37]/20 p-6 md:p-8 shadow-xs">
                
                {/* Section Title Header */}
                <div className="flex items-center gap-3.5 border-b border-[#F5F5F0] pb-5 mb-6">
                  <div className="p-3 bg-[#EBEBE4] text-[#5A5A40] rounded-2xl border border-[#D4AF37]/20 shadow-inner">
                    <Database className="w-6 h-6 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-normal text-[#5A5A40] font-serif italic">
                      Sinkronisasi Google Sheets
                    </h2>
                    <p className="text-xs text-[#8A8A70]">
                      Hubungkan dashboard rekam masuk ini dengan database Google Spreadsheet Anda
                    </p>
                  </div>
                </div>

                {/* Content Settings Fields */}
                <div className="flex flex-col gap-6">
                  
                  {/* Select Synced Mode Option */}
                  <div>
                    <label className="text-xs font-bold text-[#5A5A40] uppercase tracking-wider block mb-2.5">
                      Pilih Mode Simulasi Database
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      <button
                        type="button"
                        onClick={() => setInlineMode("local")}
                        className={`p-4 rounded-2xl border text-left transition relative overflow-hidden flex flex-col justify-between h-28 cursor-pointer ${
                          inlineMode === "local"
                            ? "bg-[#F5F5F0]/60 border-[#D4AF37] text-[#333322] shadow-xs"
                            : "bg-white border-[#D4AF37]/15 text-[#8A8A70] hover:bg-[#F5F5F0]/20"
                        }`}
                      >
                        <div>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider block w-max mb-1.5 ${
                            inlineMode === "local" ? "bg-[#5A5A40] text-white" : "bg-[#EBEBE4] text-[#8A8A70]"
                          }`}>
                            Offline-First
                          </span>
                          <span className="font-bold text-sm block text-[#5A5A40]">Mode Simulasi (Local)</span>
                          <span className="text-[11px] text-[#8A8A70] block mt-1 leading-normal font-sans font-light">
                            Data disimpan di storage browser lokal, sangat responsif & tanpa latensi internet.
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setInlineMode("gas")}
                        className={`p-4 rounded-2xl border text-left transition relative overflow-hidden flex flex-col justify-between h-28 cursor-pointer ${
                          inlineMode === "gas"
                            ? "bg-[#F5F5F0]/60 border-[#D4AF37] text-[#333322] shadow-xs"
                            : "bg-white border-[#D4AF37]/15 text-[#8A8A70] hover:bg-[#F5F5F0]/20"
                        }`}
                      >
                        <div>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider block w-max mb-1.5 ${
                            inlineMode === "gas" ? "bg-[#D4AF37] text-[#333322]" : "bg-[#EBEBE4] text-[#8A8A70]"
                          }`}>
                            Live Mode
                          </span>
                          <span className="font-bold text-sm block text-[#5A5A40]">Sinkronisasi Langsung</span>
                          <span className="text-[11px] text-[#8A8A70] block mt-1 leading-normal font-sans font-light">
                            Secara langsung mensinkronkan data tamu dan foto check-in ke Google Sheets/Drive Anda.
                          </span>
                        </div>
                      </button>

                    </div>
                  </div>

                  {/* Script Web App URL Input */}
                  {inlineMode === "gas" && (
                    <div className="flex flex-col gap-2 p-5 rounded-2xl border border-[#D4AF37]/25 bg-[#F5F5F0]/30 mr-1">
                      <label className="text-xs font-bold text-[#5A5A40] uppercase tracking-wide flex items-center gap-1">
                        <Database className="w-3.5 h-3.5 text-[#D4AF37]" />
                        Google Apps Script Web App URL
                      </label>
                      <input
                        type="url"
                        value={inlineUrl}
                        onChange={(e) => setInlineUrl(e.target.value)}
                        placeholder="https://script.google.com/macros/s/AKfycby.../exec"
                        className="w-full text-xs text-[#333322] border border-[#D4AF37]/35 rounded-xl px-4 py-3 focus:border-[#5A5A40] focus:ring-2 focus:ring-[#5A5A40]/10 focus:outline-none placeholder:text-[#8A8A70] font-mono bg-white"
                      />
                      <span className="text-[10px] text-[#8A8A70] leading-relaxed">
                        Penting: Web App URL diperoleh setelah mendeploy script Anda sebagai &apos;Web App&apos; dengan opsi akses divalidasi ke &apos;Anyone / Siapa Saja&apos;.
                      </span>
                    </div>
                  )}

                  {/* Setup Tutorial Accordion */}
                  <div className="border-t border-[#F5F5F0] pt-6 mr-1">
                    <h4 className="font-bold text-sm text-[#5A5A40] mb-3 flex items-center gap-2">
                      <Info className="w-4 h-4 text-[#D4AF37]" />
                      Langkah Integrasi Backend Apps Script & Spreadsheet:
                    </h4>
                    
                    <ol className="list-decimal pl-5 text-xs text-[#5A5A40] space-y-2 mb-4 leading-relaxed font-sans font-light">
                      <li>Buka file <strong>Google Sheets</strong> Anda terlebih dahulu di peramban.</li>
                      <li>Klik menu <strong>Extensions &gt; Apps Script</strong> untuk membuka editor kode makro Google.</li>
                      <li>Salin backend kode dasar yang telah Anda sediakan sebelumnya.</li>
                      <li>
                        <strong>Penting:</strong> Tambahkan kode patch di bawah ke bagian akhir file script editor Anda agar mendukung transfer data cross-origin (CORS) dari dashboard eksternal.
                      </li>
                      <li>Klik ikon simpan, lalu luncurkan melalui menu <strong>Deploy &gt; New Deployment &gt; Web App</strong>. Setel opsi akses ke <strong>&apos;Anyone&apos;</strong>.</li>
                      <li>Salin URL Web App yang disediakan Google, lalu tempel pada kolom input di atas dan simpan!</li>
                    </ol>

                    {/* Code Copy Box */}
                    <div className="relative rounded-2xl border border-[#D4AF37]/25 bg-slate-950 text-slate-300 font-mono text-[10px] overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-850">
                        <span className="text-slate-400 font-sans text-xs">Apendiks Patch Code.gs</span>
                        <button
                          type="button"
                          onClick={handleCopyPatchCode}
                          className="flex items-center gap-1 px-2.5 py-1 hover:bg-slate-800 rounded bg-slate-950 text-slate-400 hover:text-white transition font-sans text-xs cursor-pointer"
                        >
                          {inlineCopied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" /> Tersalin!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> Salin Kode
                            </>
                          )}
                        </button>
                      </div>
                      <div className="p-4 overflow-x-auto max-h-[160px] leading-relaxed text-slate-300">
                        <pre>{CODE_GS_PATCH}</pre>
                      </div>
                    </div>
                  </div>

                  {/* Save Button for settings */}
                  <div className="flex justify-end pt-4 border-t border-[#F5F5F0] mt-3">
                    <button
                      type="button"
                      onClick={handleInlineSaveSettings}
                      disabled={inlineSaving}
                      className="px-6 py-2.5 rounded-xl bg-[#5A5A40] hover:bg-[#4A4A30] disabled:bg-[#8A8A70]/60 text-white text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer"
                    >
                      {inlineSaving ? "Menyimpan konfigurasi..." : "Simpan Pengaturan"}
                    </button>
                  </div>

                </div>

              </div>
            </div>
          )}

        </main>

        {/* FLOATING ACTION BUTTON (+) FOR INSTANT NEW GUEST REGISTRATION (ALWAYS ON THE BOTTOM RIGHT) */}
        <button
          onClick={() => setShowAddModal(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-[#5A5A40] hover:bg-[#4A4A30] text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-115 active:scale-95 border border-[#D4AF37]/35 group cursor-pointer"
          title="Manual Registration Instan (+)"
          id="global-fab-add-button"
        >
          <Plus className="w-6 h-6" />
          <span className="absolute right-16 scale-0 group-hover:scale-100 bg-[#333322] text-white text-[11px] px-3 py-1.5 rounded-lg whitespace-nowrap transition-all duration-200 border border-[#D4AF37]/20 shadow-md">
            Pendaftaran Instan
          </span>
        </button>

      </div>

      {/* =======================================================
          MODALS & DIALOGS OVERLAYS
          ======================================================= */}
      
      {/* 1. Camera Snapshot Check-In Modal */}
      {activeCheckInGuest && (
        <CameraCheckInModal
          guest={activeCheckInGuest}
          onClose={() => setActiveCheckInGuest(null)}
          onConfirm={handleCheckInConfirm}
        />
      )}

      {/* 2. Add Guest Modal */}
      {showAddModal && (
        <AddEditGuestModal
          onClose={() => setShowAddModal(false)}
          onSave={handleSaveGuest}
        />
      )}

      {/* 3. Edit Guest Modal */}
      {activeEditGuest && (
        <AddEditGuestModal
          guest={activeEditGuest}
          onClose={() => setActiveEditGuest(null)}
          onSave={handleSaveGuest}
        />
      )}

      {/* 4. Bulk Import Spreadsheet Modal */}
      {showImportModal && (
        <BulkImportModal
          onClose={() => setShowImportModal(false)}
          onImport={handleBulkImport}
        />
      )}

      {/* 5. Delete Warning Modal */}
      {guestToDelete && (
        <div id="delete-confirmation-dialog" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-[#D4AF37]/20 max-w-sm w-full">
            <h4 className="text-base font-bold text-[#333322] flex items-center gap-2 font-serif">
              <Trash2 className="w-5 h-5 text-red-500" /> Hapus Rekor Tamu?
            </h4>
            <p className="text-xs text-[#8A8A70] mt-2.5 leading-relaxed">
              Apakah Anda yakin ingin menghapus <strong>{guestToDelete.name}</strong> dari daftar tamu? Rekor tidak dapat dipulihkan secara otomatis.
            </p>
            <div className="flex gap-2 justify-end mt-5">
              <button
                type="button"
                onClick={() => setGuestToDelete(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold select-none cursor-pointer transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold select-none cursor-pointer transition shadow-sm"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

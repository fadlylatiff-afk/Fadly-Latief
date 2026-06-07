/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Search, Filter, Camera, Trash2, Edit2, Check, Clock, UserPlus, FileText, Image as ImageIcon, ZoomIn, X } from "lucide-react";
import { Guest } from "../types";

interface GuestListTableProps {
  guests: Guest[];
  onCheckInClick?: (guest: Guest) => void;
  onEditClick: (guest: Guest) => void;
  onDeleteClick: (id: string, name: string) => void;
}

export default function GuestListTable({
  guests,
  onCheckInClick,
  onEditClick,
  onDeleteClick
}: GuestListTableProps) {
  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("Semua");
  const [categoryFilter, setCategoryFilter] = useState<string>("Semua");
  
  // Photo preview state
  const [activePhoto, setActivePhoto] = useState<{ url: string; title: string } | null>(null);

  // Derive all active categories for easy filter aggregation
  const uniqueCategories = Array.from(new Set(guests.map((g) => g.category || "Umum"))).filter(Boolean);

  // Filter logic
  const filteredGuests = guests.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "Semua" || g.status === statusFilter;

    const matchesCategory =
      categoryFilter === "Semua" || g.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  function resetFilters() {
    setSearchQuery("");
    setStatusFilter("Semua");
    setCategoryFilter("Semua");
  }

  // Get badge colors based on guest categories
  function getCategoryBadge(cat: string) {
    switch (cat) {
      case "VIP Utama":
      case "VIP":
        return "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30 font-semibold";
      case "Keluarga":
        return "bg-[#5A5A40]/10 text-[#5A5A40] border-[#5A5A40]/25 font-bold";
      case "Rekan Bisnis":
      case "Kerabat":
        return "bg-[#5A5A40]/5 text-[#5A5A40] border-[#5A5A40]/15 font-medium";
      default:
        return "bg-slate-50 border-slate-200 text-[#8A8A70] uppercase";
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-[#D4AF37]/20 shadow-xs overflow-hidden flex flex-col">
      {/* Header filters */}
      <div className="p-6 border-b border-[#F5F5F0] flex flex-col md:flex-row items-center justify-between gap-4 bg-white">
        
        {/* Search */}
        <div className="relative w-full md:max-w-xs" id="search-container">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8A70] w-4 h-4" />
          <input
            id="search-input"
            type="text"
            placeholder="Cari nama tamu atau ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs text-[#333322] border border-[#D4AF37]/30 rounded-xl pl-10 pr-4 py-2.5 bg-[#F5F5F0]/40 focus:bg-white focus:border-[#5A5A40] focus:ring-2 focus:ring-[#5A5A40]/10 focus:outline-none transition placeholder:text-[#8A8A70]"
          />
        </div>

        {/* Category & Attendance Selects */}
        <div className="flex items-center gap-3 w-full md:w-auto" id="filters-container">
          <div className="flex items-center gap-2">
            <Filter className="text-[#8A8A70] w-3.5 h-3.5 hidden sm:inline" />
            <select
              id="category-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs font-medium text-[#5A5A40] bg-[#F5F5F0]/50 border border-[#D4AF37]/20 rounded-xl px-3 py-2.5 focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40] focus:outline-none cursor-pointer hover:bg-white transition"
            >
              <option value="Semua">Semua Kategori</option>
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-medium text-[#5A5A40] bg-[#F5F5F0]/50 border border-[#D4AF37]/20 rounded-xl px-3 py-2.5 focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40] focus:outline-none cursor-pointer hover:bg-white transition"
          >
            <option value="Semua">Semua Status</option>
            <option value="Hadir">Sudah Hadir</option>
            <option value="Belum Hadir">Belum Hadir</option>
          </select>
        </div>
      </div>

      {/* Main Guest Table */}
      <div className="overflow-x-auto" id="guests-table-wrapper">
        {filteredGuests.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center text-[#8A8A70]">
            <Search className="w-12 h-12 text-[#8A8A70]/40 mb-3" />
            <span className="text-sm font-semibold text-[#5A5A40] block">Tidak Menemukan Tamu</span>
            <p className="text-xs text-[#8A8A70] mt-1 max-w-xs mx-auto">
              Cobalah mengubah pencarian Anda atau mengatur kembali filter kategori dan kehadiran yang dipilih.
            </p>
            <button
              onClick={resetFilters}
              className="mt-4 px-4 py-2 border border-[#D4AF37]/20 hover:bg-[#F5F5F0]/50 rounded-xl text-xs font-medium text-[#5A5A40] transition"
              id="reset-filter-btn"
            >
              Atur Ulang Filter
            </button>
          </div>
        ) : (
          <table className="w-full text-left border-collapse" id="guests-data-table">
            <thead>
              <tr className="bg-[#5A5A40] text-white border-b border-[#D4AF37]/20">
                <th className="px-6 py-4 font-serif font-light tracking-wide text-xs">Nama Tamu &amp; ID</th>
                <th className="px-6 py-4 font-serif font-light tracking-wide text-xs">Kategori</th>
                <th className="px-6 py-4 font-serif font-light tracking-wide text-xs">Status</th>
                <th className="px-5 py-4 text-center font-serif font-light tracking-wide text-xs">Pax (Pendamping)</th>
                <th className="px-6 py-4 font-serif font-light tracking-wide text-xs">Waktu Check-In</th>
                <th className="px-6 py-4 font-serif font-light tracking-wide text-xs">Bukti Foto</th>
                <th className="px-6 py-4 font-serif font-light tracking-wide text-xs">Catatan</th>
                <th className="px-6 py-4 text-right font-serif font-light tracking-wide text-xs">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F5F0] text-[#333322] text-xs">
              {filteredGuests.map((guest) => (
                <tr key={guest.id} id={`guest-row-${guest.id}`} className="hover:bg-[#F5F5F0]/30 transition-colors">
                  {/* Name & ID */}
                  <td className="px-6 py-4">
                    <div className="font-semibold text-[#333322] font-sans text-sm">{guest.name}</div>
                    <div className="text-[10px] text-[#8A8A70] font-mono mt-0.5">{guest.id}</div>
                  </td>

                  {/* Category */}
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] border ${getCategoryBadge(guest.category)}`}>
                      {guest.category || "Umum"}
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="px-6 py-4">
                    {guest.status === "Hadir" ? (
                      <span className="flex items-center gap-1.5 text-emerald-700 font-semibold text-xs">
                        <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" /> Hadir
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[#8A8A70] font-normal text-xs">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" /> Belum Hadir
                      </span>
                    )}
                  </td>

                  {/* Companions */}
                  <td className="px-5 py-4 text-center font-semibold font-sans text-[#333322]">
                    {guest.status === "Hadir" ? (
                      <span className="text-[#333322] bg-[#EBEBE4]/50 border border-[#D4AF37]/20 px-2 py-0.5 rounded-md font-mono text-xs">
                        +{guest.guestCount}
                      </span>
                    ) : (
                      <span className="text-[#8A8A70]/60 font-mono text-xs">+{guest.guestCount}</span>
                    )}
                  </td>

                  {/* Check-In Time */}
                  <td className="px-6 py-4 text-[#8A8A70] font-mono text-[11px]">
                    {guest.checkInTime || "-"}
                  </td>

                  {/* Photo Thumbnail */}
                  <td className="px-6 py-4">
                    {guest.photoUrl ? (
                      <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-[#D4AF37]/35 bg-[#F5F5F0] cursor-pointer group shadow-sm"
                           onClick={() => setActivePhoto({ url: guest.photoUrl, title: guest.name })}>
                        <img
                          src={guest.photoUrl}
                          alt={guest.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                          <ZoomIn className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="p-1 px-2 rounded-md border border-[#F5F5F0] bg-white flex items-center justify-center max-w-max text-slate-300">
                        <ImageIcon className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </td>

                  {/* Notes */}
                  <td className="px-6 py-4 max-w-[150px]">
                    {guest.notes ? (
                      <p className="text-[#8A8A70] line-clamp-1 truncate hover:line-clamp-none max-w-[150px]" title={guest.notes}>
                        {guest.notes}
                      </p>
                    ) : (
                      <span className="text-slate-300 italic">-</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5" id={`actions-${guest.id}`}>
                      <button
                        onClick={() => onEditClick(guest)}
                        className="p-1.5 rounded-lg border border-transparent hover:border-[#D4AF37]/25 text-[#5A5A40] hover:bg-white transition"
                        title="Edit Details"
                        id={`edit-btn-${guest.id}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onDeleteClick(guest.id, guest.name)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-650 transition"
                        title="Hapus Rekor"
                        id={`delete-btn-${guest.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer count indicator */}
      <div className="px-6 py-4 border-t border-[#F5F5F0] bg-[#F5F5F0]/30 flex justify-between items-center text-[11px] text-[#8A8A70]">
        <span>Menampilkan <strong>{filteredGuests.length}</strong> dari total <strong>{guests.length}</strong> tamu terdaftar.</span>
        <span className="font-semibold text-[#8A8A70]">Rara &amp; Hilman Wedding Applet</span>
      </div>

      {/* Zoomed Photo Viewer Modal */}
      {activePhoto && (
        <div id="photo-viewer-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm" onClick={() => setActivePhoto(null)}>
          <div className="relative max-w-full md:max-w-xl bg-white rounded-3xl overflow-hidden shadow-2xl p-2 animate-fade" onClick={(e) => e.stopPropagation()}>
            <img
              src={activePhoto.url}
              alt={activePhoto.title}
              className="max-h-[70vh] rounded-2.5xl object-contain mx-auto"
              referrerPolicy="no-referrer"
            />
            <div className="p-4 flex items-center justify-between text-slate-800 border-t border-slate-100 mt-2">
              <div className="text-xs">
                <span className="block font-semibold">{activePhoto.title}</span>
                <span className="block text-[10px] text-slate-400 mt-0.5">Bukti foto check-in kamera</span>
              </div>
              <button
                onClick={() => setActivePhoto(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

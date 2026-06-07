/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { X, UserCheck, AlertCircle } from "lucide-react";
import { Guest } from "../types";

interface AddEditGuestModalProps {
  guest?: Guest; // If undefined, we are in CREATE mode
  onClose: () => void;
  onSave: (guest: Partial<Guest>) => Promise<void>;
}

export default function AddEditGuestModal({ guest, onClose, onSave }: AddEditGuestModalProps) {
  const isEdit = !!guest;
  const [name, setName] = useState<string>(guest?.name || "");
  const [category, setCategory] = useState<string>(guest?.category || "Umum");
  const [status, setStatus] = useState<"Belum Hadir" | "Hadir">(guest?.status || "Belum Hadir");
  const [guestCount, setGuestCount] = useState<number>(guest?.guestCount || 0);
  const [notes, setNotes] = useState<string>(guest?.notes || "");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const categories = ["VIP Utama", "VIP", "Keluarga", "Rekan Bisnis", "Kerabat", "Umum"];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);

    if (!name.trim()) {
      setValidationError("Nama Tamu wajib diisi.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<Guest> = {
        id: guest?.id,
        name: name.trim(),
        category,
        status,
        guestCount,
        notes: notes.trim(),
      };
      await onSave(payload);
    } catch (err: any) {
      setValidationError(err.message || "Gagal menyimpan data tamu.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#D4AF37]/20 flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F5F5F0] bg-[#F5F5F0]/40">
          <div>
            <h3 className="text-xl font-normal text-[#5A5A40] font-serif italic">
              {isEdit ? "Edit Detail Tamu" : "Pendaftaran Tamu Baru"}
            </h3>
            {isEdit && <span className="text-[10px] font-mono text-[#8A8A70] bg-[#EBEBE4]/40 border border-[#D4AF37]/10 px-2 py-0.5 rounded-md mt-1 inline-block">ID: {guest.id}</span>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#EBEBE4]/60 text-[#8A8A70] transition hover:text-[#5A5A40]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {validationError && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-100">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Guest Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#5A5A40] uppercase tracking-wide">Nama Lengkap Tamu</label>
            <input
              type="text"
              placeholder="Contoh: Bapak Ir. Ahmad Yani & Partner"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-[#333322] border border-[#D4AF37]/35 rounded-xl px-4 py-2.5 text-sm focus:border-[#5A5A40] focus:ring-2 focus:ring-[#5A5A40]/10 focus:outline-none placeholder:text-[#8A8A70] bg-white"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#5A5A40] uppercase tracking-wide">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-[#333322] border border-[#D4AF37]/35 rounded-xl px-3 py-2.5 text-sm focus:border-[#5A5A40] focus:ring-2 focus:ring-[#5A5A40]/10 focus:outline-none bg-white font-semibold"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Attendance state */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#5A5A40] uppercase tracking-wide">Status Hadir</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "Belum Hadir" | "Hadir")}
                className="w-full text-[#333322] border border-[#D4AF37]/35 rounded-xl px-3 py-2.5 text-sm focus:border-[#5A5A40] focus:ring-2 focus:ring-[#5A5A40]/10 focus:outline-none bg-white font-semibold"
              >
                <option value="Belum Hadir">Belum Hadir</option>
                <option value="Hadir">Hadir</option>
              </select>
            </div>
          </div>

          {/* Number of companions */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#5A5A40] uppercase tracking-wide">Jumlah Pendamping</label>
            <input
              type="number"
              min="0"
              step="1"
              value={guestCount}
              onChange={(e) => setGuestCount(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full text-[#333322] border border-[#D4AF37]/35 rounded-xl px-4 py-2.5 text-sm focus:border-[#5A5A40] focus:ring-2 focus:ring-[#5A5A40]/10 focus:outline-none bg-white"
            />
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#5A5A40] uppercase tracking-wide">Catatan Khusus</label>
            <textarea
              placeholder="Nomor meja, hubungan kekerabatan, dll. (Opsional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-[#333322] border border-[#D4AF37]/35 rounded-xl px-4 py-2.5 text-sm focus:border-[#5A5A40] focus:ring-2 focus:ring-[#5A5A40]/10 focus:outline-none placeholder:text-[#8A8A70] min-h-[80px] bg-white resize-none"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3 justify-end pt-4 border-t border-[#F5F5F0] mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-[#D4AF37]/25 hover:bg-[#F5F5F0] font-semibold text-[#5A5A40] text-xs transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-[#5A5A40] hover:bg-[#4A4A30] disabled:bg-[#8A8A70]/60 text-white text-xs font-semibold transition shadow-xs"
            >
              {submitting ? "Menyimpan..." : "Simpan Data"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

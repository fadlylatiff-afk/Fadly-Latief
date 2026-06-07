/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { X, Settings, Database, Copy, Check, ExternalLink, RefreshCw, AlertCircle } from "lucide-react";
import { AppSettings } from "../types";
import { CODE_GS_PATCH } from "../lib/gasService";

interface GASConfigModalProps {
  settings: AppSettings;
  onClose: () => void;
  onSave: (settings: AppSettings) => void;
}

export default function GASConfigModal({ settings, onClose, onSave }: GASConfigModalProps) {
  const [mode, setMode] = useState<"local" | "gas">(settings.mode);
  const [url, setUrl] = useState<string>(settings.gasWebAppUrl);
  const [copied, setCopied] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  function handleSave() {
    setSaving(true);
    onSave({
      mode,
      gasWebAppUrl: url.trim()
    });
    setTimeout(() => {
      setSaving(false);
      onClose();
    }, 400);
  }

  function handleCopy() {
    navigator.clipboard.writeText(CODE_GS_PATCH);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#D4AF37]/20 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F5F5F0] bg-[#F5F5F0]/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#EBEBE4] text-[#5A5A40] rounded-xl border border-[#D4AF37]/15">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-normal text-[#5A5A40] font-serif italic">Sinkronisasi Google Sheets</h3>
              <p className="text-[11px] text-[#8A8A70] font-sans">Hubungkan dashboard ini dengan database Google Spreadsheet Anda</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#EBEBE4]/60 text-[#8A8A70] transition hover:text-[#5A5A40]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          
          {/* Toggle Mode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setMode("local")}
              className={`p-4 rounded-2xl border text-left transition relative overflow-hidden flex flex-col justify-between h-28 cursor-pointer ${
                mode === "local"
                  ? "bg-[#F5F5F0]/60 border-[#D4AF37] text-[#333322] shadow-xs"
                  : "bg-white border-[#D4AF37]/20 text-[#8A8A70] hover:bg-[#F5F5F0]/20"
              }`}
            >
              <div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider block w-max mb-1.5 ${
                  mode === "local" ? "bg-[#5A5A40] text-white" : "bg-[#EBEBE4] text-[#8A8A70]"
                }`}>
                  Offline-First
                </span>
                <span className="font-bold text-sm block text-[#5A5A40]">Mode Simulasi (Local)</span>
                <span className="text-[11px] text-[#8A8A70] block mt-1 leading-normal">
                  Data disimpan di peramban lokal, sangat responsif & tanpa koneksi eksternal.
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMode("gas")}
              className={`p-4 rounded-2xl border text-left transition relative overflow-hidden flex flex-col justify-between h-28 cursor-pointer ${
                mode === "gas"
                  ? "bg-[#F5F5F0]/60 border-[#D4AF37] text-[#333322] shadow-xs"
                  : "bg-white border-[#D4AF37]/20 text-[#8A8A70] hover:bg-[#F5F5F0]/20"
              }`}
            >
              <div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider block w-max mb-1.5 ${
                  mode === "gas" ? "bg-[#D4AF37] text-[#333322]" : "bg-[#EBEBE4] text-[#8A8A70]"
                }`}>
                  Live Database
                </span>
                <span className="font-bold text-sm block text-[#5A5A40]">Mode Sinkronisasi Langsung</span>
                <span className="text-[11px] text-[#8A8A70] block mt-1 leading-normal">
                  Secara langsung mensinkronkan data tamu dan foto check-in ke Google Sheets/Drive Anda.
                </span>
              </div>
            </button>
          </div>

          {/* URL Input Form */}
          {mode === "gas" && (
            <div className="flex flex-col gap-2 p-5 rounded-2xl border border-[#D4AF37]/25 bg-[#F5F5F0]/30">
              <label className="text-xs font-bold text-[#5A5A40] uppercase tracking-wide">
                Google Apps Script Web App URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycby.../exec"
                className="w-full text-xs text-[#333322] border border-[#D4AF37]/35 rounded-xl px-4 py-3 focus:border-[#5A5A40] focus:ring-2 focus:ring-[#5A5A40]/10 focus:outline-none placeholder:text-[#8A8A70] font-mono bg-white"
              />
              <span className="text-[10px] text-[#8A8A70]">
                Penting: Web App URL diperoleh setelah mendeploy Apps Script sebagai &apos;Web App&apos; dengan hak akses &apos;Anyone / Siapa Saja&apos;.
              </span>
            </div>
          )}

          {/* Setup Tutorial */}
          <div className="border-t border-[#F5F5F0] pt-6">
            <h4 className="font-bold text-sm text-[#5A5A40] mb-3 flex items-center gap-2">
              <Database className="w-4 h-4 text-[#D4AF37]" id="gas-modal-db-icon" />
              Langkah Integrasi Apps Script & Spreadsheet:
            </h4>
            
            <ol className="list-decimal pl-5 text-xs text-[#5A5A40] space-y-2 mb-4 leading-relaxed font-sans">
              <li>Buka file <strong>Google Sheets</strong> Anda terlebih dahulu.</li>
              <li>Klik menu <strong>Extensions &gt; Apps Script</strong> untuk membuka editor kode Google.</li>
              <li>Salin backend kode dasar yang telah Anda miliki.</li>
              <li>
                <strong>Penting:</strong> Agar mendukung transfer data cross-origin (CORS) dari dashboard web ini ke Google Sheets, 
                tambahkan kode patch di bawah ini ke baris paling bawah file editor Apps Script Anda.
              </li>
              <li>Klik ikon simpan, lalu unduh / terbitkan melalui menu <strong>Deploy &gt; New Deployment &gt; Web App</strong>. Setel akses ke <strong>&apos;Anyone&apos;</strong>.</li>
              <li>Salin URL Web App yang terbentuk lalu tempel pada inputan di atas dan simpan!</li>
            </ol>

            {/* Code Copy Area */}
            <div className="relative rounded-2xl border border-[#D4AF37]/25 bg-slate-950 text-slate-300 font-mono text-[10px] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-850">
                <span className="text-slate-400 font-sans text-xs">Apendiks Patch Code.gs</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2.5 py-1 hover:bg-slate-800 rounded bg-slate-950 text-slate-400 hover:text-white transition font-sans text-xs cursor-pointer"
                >
                  {copied ? (
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

        </div>

        {/* Submit */}
        <div className="flex gap-3 justify-end px-6 py-4 border-t border-[#F5F5F0] bg-[#F5F5F0]/30">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl border border-[#D4AF37]/25 hover:bg-[#F5F5F0] font-semibold text-[#5A5A40] text-xs transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 rounded-xl bg-[#5A5A40] hover:bg-[#4A4A30] disabled:bg-[#8A8A70]/60 text-white text-xs font-bold transition shadow-xs cursor-pointer animate-none"
          >
            {saving ? "Menyimpan..." : "Simpan Pengaturan"}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { X, Upload, Clipboard, CheckCircle, AlertCircle, Info, Download } from "lucide-react";
import { Guest } from "../types";

interface BulkImportModalProps {
  onClose: () => void;
  onImport: (guests: Partial<Guest>[]) => Promise<void>;
}

interface ParsedGuest {
  name: string;
  category: string;
  guestCount: number;
  notes: string;
}

export default function BulkImportModal({ onClose, onImport }: BulkImportModalProps) {
  const [inputText, setInputText] = useState<string>("");
  const [parsedList, setParsedList] = useState<ParsedGuest[]>([]);
  const [importing, setImporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Template placeholders for easy copy paste
  const TABLE_TEMPLATE = 
`Joko Susilo\tVIP Utama\t2\tTeman masa kecil pengantin pria
Siti Aminah\tKeluarga\t1\tTante dari pihak ibu
Hendra Wijaya\tKerabat\t0\tAlumni Universitas Indonesia
Diana Lestari\tUmum\t3\tTetangga kompleks`;

  // Auto parsing whenever raw text changes
  useEffect(() => {
    if (!inputText.trim()) {
      setParsedList([]);
      return;
    }

    const lines = inputText.split(/\r?\n/);
    const parsed: ParsedGuest[] = [];

    lines.forEach((line) => {
      const cleanLine = line.trim();
      if (!cleanLine) return;

      // Detect separator: Tab, Semicolon, or Comma
      let parts: string[] = [];
      if (cleanLine.includes("\t")) {
        parts = cleanLine.split("\t");
      } else if (cleanLine.includes(";")) {
        parts = cleanLine.split(";");
      } else if (cleanLine.includes(",")) {
        parts = cleanLine.split(",");
      } else {
        // Single name fallback
        parts = [cleanLine];
      }

      // Safe extract values from array parts
      const name = parts[0]?.trim() || "Tamu Tanpa Nama";
      const category = parts[1]?.trim() || "Umum";
      const countStr = parts[2]?.trim() || "0";
      const guestCount = Math.max(0, parseInt(countStr) || 0);
      const notes = parts[3]?.trim() || "";

      parsed.push({
        name,
        category,
        guestCount,
        notes
      });
    });

    setParsedList(parsed);
  }, [inputText]);

  async function handleImportConfirm() {
    if (parsedList.length === 0) {
      setError("Masukkan data teks tamu terlebih dahulu.");
      return;
    }

    setImporting(true);
    setError(null);

    try {
      await onImport(parsedList);
    } catch (err: any) {
      setError(err?.message || "Gagal mengimpor daftar tamu.");
    } finally {
      setImporting(false);
    }
  }

  function handlePasteTemplate() {
    setInputText(TABLE_TEMPLATE);
  }

  function handleDownloadFormatFile() {
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
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#D4AF37]/20 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F5F5F0] bg-[#F5F5F0]/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#EBEBE4] text-[#5A5A40] rounded-xl border border-[#D4AF37]/15">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-normal text-[#5A5A40] font-serif italic">Impor Massal Daftar Tamu</h3>
              <p className="text-[11px] text-[#8A8A70]">Salin dan tempel daftar nama dari Excel / Sheets secara langsung</p>
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
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-100">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Guide */}
          <div className="p-4 rounded-2xl bg-[#F5F5F0]/60 border border-[#D4AF37]/15 text-xs text-[#333322] leading-relaxed flex items-start gap-3">
            <Info className="w-5 h-5 text-[#5A5A40] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#5A5A40] mb-1">Panduan Format Kolom Excel:</p>
              <p className="text-[#8A8A70] mb-2 font-sans">
                Kolom harus diatur sesuai urutan berikut: <strong>[Nama] [Kategori] [Jumlah Pendamping] [Catatan]</strong>.
                Kolom dapat dipisah menggunakan <strong>Tab</strong> (Hasil Copy Excel), <strong>Koma (,)</strong>, atau <strong>Titik Koma (;)</strong>.
              </p>
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={handlePasteTemplate}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#EBEBE4]/50 rounded-lg text-[11px] text-[#5A5A40] border border-[#D4AF37]/25 hover:border-[#D4AF37]/50 font-semibold transition cursor-pointer"
                >
                  <Clipboard className="w-3.5 h-3.5 text-[#5A5A40]" /> Gunakan Contoh Template Teks
                </button>
                <button
                  type="button"
                  onClick={handleDownloadFormatFile}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#5A5A40] hover:bg-[#4A4A30] rounded-lg text-[11px] text-white font-semibold transition cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-[#D4AF37]" /> Unduh Format Database (CSV)
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-[300px]">
            {/* Input area */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-[#5A5A40] uppercase tracking-wide block">Tempel Data teks di sini</label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Contoh:&#10;Budi Utama&#9;VIP&#9;1&#9;Duduk Meja 3&#10;Melati Rahma&#9;Umum&#9;0&#9;Kerabat Dekat"
                className="flex-1 min-h-[220px] md:min-h-0 w-full text-[#333322] border border-[#D4AF37]/35 rounded-2xl px-4 py-3 text-xs focus:border-[#5A5A40] focus:ring-2 focus:ring-[#5A5A40]/10 focus:outline-none placeholder:text-[#8A8A70] font-mono bg-white"
              />
            </div>

            {/* Preview Area */}
            <div className="flex flex-col gap-2 border-l border-[#F5F5F0] md:pl-2">
              <label className="text-xs font-bold text-[#5A5A40] uppercase tracking-wide block">
                Pratinjau Hasil Impor ({parsedList.length} Tamu)
              </label>
              <div className="flex-1 border border-[#D4AF37]/15 rounded-2xl overflow-hidden bg-[#F5F5F0]/30 flex flex-col min-h-[220px] md:min-h-0">
                {parsedList.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-[#8A8A70] text-center text-xs">
                    <Clipboard className="w-8 h-8 text-[#8A8A70]/40 mb-2" />
                    <p>Pratinjau impor otomatis muncul di sini setelah Anda menempelkan teks.</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-auto max-h-[350px]">
                    <table className="w-full text-left border-collapse text-[11px] font-sans">
                      <thead>
                        <tr className="bg-[#EBEBE4]/50 border-b border-[#D4AF37]/25 text-[#5A5A40] sticky top-0">
                          <th className="p-2 font-semibold font-serif">Nama Tamu</th>
                          <th className="p-2 font-semibold font-serif">Kategori</th>
                          <th className="p-2 font-semibold font-serif text-center">Pax</th>
                          <th className="p-2 font-semibold font-serif">Catatan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F5F5F0] bg-white">
                        {parsedList.map((g, idx) => (
                          <tr key={idx} className="hover:bg-[#F5F5F0]/30 text-[#333322]">
                            <td className="p-2 font-medium truncate max-w-[120px]">{g.name}</td>
                            <td className="p-2">
                              <span className="px-1.5 py-0.5 rounded-md bg-[#5A5A40]/5 text-[10px] text-[#5A5A40] border border-[#5A5A40]/10 font-bold">
                                {g.category}
                              </span>
                            </td>
                            <td className="p-2 text-center font-mono">{g.guestCount}</td>
                            <td className="p-2 text-[#8A8A70] truncate max-w-[100px]">{g.notes || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 justify-end pt-4 border-t border-[#F5F5F0]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-[#D4AF37]/25 hover:bg-[#F5F5F0] font-semibold text-[#5A5A40] text-xs transition"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleImportConfirm}
              disabled={importing || parsedList.length === 0}
              className="px-6 py-2.5 rounded-xl bg-[#5A5A40] hover:bg-[#4A4A30] disabled:bg-[#8A8A70]/60 disabled:text-white text-white text-xs font-semibold transition shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              {importing ? "Memproses Impor..." : `Konfirmasi Impor ${parsedList.length} Tamu`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

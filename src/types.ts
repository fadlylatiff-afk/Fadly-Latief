/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Guest {
  id: string;
  name: string;
  category: string; // e.g. "VIP", "Keluarga", "Umum", etc.
  status: "Belum Hadir" | "Hadir";
  guestCount: number; // Jumlah pendamping
  checkInTime: string; // "yyyy-MM-dd HH:mm:ss" atau kosong
  photoUrl: string; // URL foto dari Google Drive atau Base64 lokal
  notes: string;
}

export interface AppSettings {
  mode: "local" | "gas";
  gasWebAppUrl: string;
}

export interface DashboardStats {
  totalGuests: number;
  attendedGuests: number;
  pendingGuests: number;
  totalPax: number; // Total Hadir + Pendamping Hadir
  categoryBreakdown: { [category: string]: { total: number; attended: number } };
}

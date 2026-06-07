/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Guest, AppSettings, DashboardStats } from "../types";
import { INITIAL_GUESTS } from "./mockData";

// Declare google global variable for Google Apps Script environments
declare const google: {
  script: {
    run: {
      withSuccessHandler(handler: (result: any) => void): any;
      withFailureHandler(handler: (error: any) => void): any;
      getGuests(): void;
      checkInGuest(id: string, guestCount: number, photoBase64: string, notes: string): void;
      addOrUpdateGuest(guest: any): void;
      deleteGuest(id: string): void;
      bulkImportGuests(guests: any[]): void;
    };
  };
};

const SETTINGS_KEY = "wedding_guest_settings";
const GUESTS_KEY = "wedding_guests_db";

export function getAppSettings(): AppSettings {
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Fallback
    }
  }
  return {
    mode: "local",
    gasWebAppUrl: ""
  };
}

export function saveAppSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

/**
 * Checks if the app is currently running inside the actual Google Apps Script environment (iframe with google.script.run)
 */
export function isGasEnvironment(): boolean {
  return typeof google !== "undefined" && google.script && google.script.run ? true : false;
}

/**
 * Fetch all guests
 */
export async function fetchGuests(settings: AppSettings): Promise<Guest[]> {
  // Mode 1: Actual Google Apps Script RPC
  if (isGasEnvironment()) {
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler((result: any) => {
          resolve(Array.isArray(result) ? result : []);
        })
        .withFailureHandler((error: any) => {
          reject(new Error(error?.message || "Gagal mengambil data dari Google Apps Script"));
        })
        .getGuests();
    });
  }

  // Mode 2: Live GAS Web App API Gateway via Fetch
  if (settings.mode === "gas" && settings.gasWebAppUrl) {
    try {
      const url = `${settings.gasWebAppUrl}?action=getGuests`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        // Save copy to local storage as hot cache
        localStorage.setItem(GUESTS_KEY, JSON.stringify(data));
        return data;
      }
      throw new Error("Format respons tidak valid");
    } catch (err: any) {
      console.warn("API request failed, falling back to local storage cache:", err);
      // Fallback to local cache in case of CORS or offline issues
    }
  }

  // Mode 3: Local Storage / Simulation Mode
  const cached = localStorage.getItem(GUESTS_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // CORRUPT
    }
  }

  // Initial seed
  localStorage.setItem(GUESTS_KEY, JSON.stringify(INITIAL_GUESTS));
  return INITIAL_GUESTS;
}

/**
 * Check-in a guest
 */
export async function checkInGuest(
  settings: AppSettings,
  id: string,
  guestCount: number,
  photoBase64: string,
  notes: string
): Promise<{ success: boolean; message: string; photoUrl?: string }> {
  const timestamp = new Date().toISOString()
    .replace('T', ' ')
    .substring(0, 19); // Simplified yyyy-MM-dd HH:mm:ss format (local)

  // Mode 1: Actual Google Apps Script RPC
  if (isGasEnvironment()) {
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler((result: any) => {
          resolve(result || { success: true, message: "Check-in berhasil!" });
        })
        .withFailureHandler((error: any) => {
          reject(new Error(error?.message || "Gagal melakukan check-in via Google Apps Script"));
        })
        .checkInGuest(id, guestCount, photoBase64, notes);
    });
  }

  // Mode 2: Live GAS Web App API Gateway via Fetch (CORS payload)
  if (settings.mode === "gas" && settings.gasWebAppUrl) {
    try {
      // Send as POST text/plain to bypass CORS Preflight blocks in GAS
      const response = await fetch(settings.gasWebAppUrl, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify({
          action: "checkInGuest",
          id,
          guestCount,
          photoBase64,
          notes
        })
      });
      const resData = await response.json();
      
      // Sync local db to match
      await syncLocalCheckIn(id, guestCount, resData.photoUrl || photoBase64, notes, timestamp);
      return resData;
    } catch (err: any) {
      console.warn("CORS/Connection error, falling back to instant local simulation:", err);
    }
  }

  // Mode 3: Local simulation with instant state update
  await syncLocalCheckIn(id, guestCount, photoBase64, notes, timestamp);
  return {
    success: true,
    message: "Check-in berhasil disimpan di penyimpanan lokal!",
    photoUrl: photoBase64 // local base64 serves as image URL directly
  };
}

async function syncLocalCheckIn(
  id: string,
  guestCount: number,
  photoUrl: string,
  notes: string,
  timestamp: string
) {
  const cached = localStorage.getItem(GUESTS_KEY);
  let guests: Guest[] = cached ? JSON.parse(cached) : INITIAL_GUESTS;

  guests = guests.map((g) => {
    if (g.id === id) {
      return {
        ...g,
        status: "Hadir" as const,
        guestCount,
        photoUrl,
        notes,
        checkInTime: timestamp
      };
    }
    return g;
  });

  localStorage.setItem(GUESTS_KEY, JSON.stringify(guests));
}

/**
 * Add or update a guest
 */
export async function addOrUpdateGuest(settings: AppSettings, guest: Partial<Guest>): Promise<{ success: boolean; message: string }> {
  // Mode 1: Actual Google Apps Script RPC
  if (isGasEnvironment()) {
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler((result: any) => {
          resolve(result || { success: true, message: "Penyimpanan sukses!" });
        })
        .withFailureHandler((error: any) => {
          reject(new Error(error?.message || "Gagal menyimpan tamu"));
        })
        .addOrUpdateGuest(guest);
    });
  }

  // Mode 2: Live GAS Web App API Gateway
  if (settings.mode === "gas" && settings.gasWebAppUrl) {
    try {
      const response = await fetch(settings.gasWebAppUrl, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "addOrUpdateGuest",
          guest
        })
      });
      const resData = await response.json();
      await syncLocalSave(guest);
      return resData;
    } catch (err) {
      console.warn("GAS save failed, fell back to local save:", err);
    }
  }

  // Mode 3: Local simulation
  await syncLocalSave(guest);
  return { success: true, message: "Data tamu berhasil disimpan secara lokal!" };
}

async function syncLocalSave(guest: Partial<Guest>) {
  const cached = localStorage.getItem(GUESTS_KEY);
  const guests: Guest[] = cached ? JSON.parse(cached) : [...INITIAL_GUESTS];
  
  if (guest.id) {
    // Update
    const updated = guests.map((g) => {
      if (g.id === guest.id) {
        return {
          ...g,
          name: guest.name || g.name,
          category: guest.category || g.category,
          status: guest.status || g.status,
          guestCount: guest.guestCount !== undefined ? guest.guestCount : g.guestCount,
          notes: guest.notes !== undefined ? guest.notes : g.notes,
          checkInTime: guest.status === "Hadir" ? (guest.checkInTime || g.checkInTime || new Date().toISOString().replace('T', ' ').substring(0, 19)) : ""
        };
      }
      return g;
    });
    localStorage.setItem(GUESTS_KEY, JSON.stringify(updated));
  } else {
    // Insert new
    const newId = "G-" + Math.floor(100000 + Math.random() * 900000);
    const newGuest: Guest = {
      id: newId,
      name: guest.name || "Tamu Tanpa Nama",
      category: guest.category || "Umum",
      status: guest.status || "Belum Hadir",
      guestCount: guest.guestCount || 0,
      checkInTime: guest.status === "Hadir" ? new Date().toISOString().replace('T', ' ').substring(0, 19) : "",
      photoUrl: "",
      notes: guest.notes || ""
    };
    guests.unshift(newGuest); // Add to beginning of list
    localStorage.setItem(GUESTS_KEY, JSON.stringify(guests));
  }
}

/**
 * Delete a guest
 */
export async function deleteGuest(settings: AppSettings, id: string): Promise<{ success: boolean; message: string }> {
  // Mode 1: Actual Google Apps Script RPC
  if (isGasEnvironment()) {
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler((result: any) => {
          resolve(result || { success: true, message: "Tamu dihapus!" });
        })
        .withFailureHandler((error: any) => {
          reject(new Error(error?.message || "Gagal menghapus tamu"));
        })
        .deleteGuest(id);
    });
  }

  // Mode 2: Live GAS Web App API Gateway
  if (settings.mode === "gas" && settings.gasWebAppUrl) {
    try {
      const response = await fetch(settings.gasWebAppUrl, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "deleteGuest",
          id
        })
      });
      const resData = await response.json();
      await syncLocalDelete(id);
      return resData;
    } catch (err) {
      console.warn("GAS delete failed, fell back to local storage:", err);
    }
  }

  // Mode 3: Local simulation
  await syncLocalDelete(id);
  return { success: true, message: "Tamu berhasil dihapus secara lokal!" };
}

async function syncLocalDelete(id: string) {
  const cached = localStorage.getItem(GUESTS_KEY);
  if (cached) {
    const guests: Guest[] = JSON.parse(cached);
    const filtered = guests.filter((g) => g.id !== id);
    localStorage.setItem(GUESTS_KEY, JSON.stringify(filtered));
  }
}

/**
 * Bulk import multiple guests
 */
export async function bulkImportGuests(settings: AppSettings, guestsArray: Partial<Guest>[]): Promise<{ success: boolean; count: number; message: string }> {
  // Mode 1: Actual Google Apps Script RPC
  if (isGasEnvironment()) {
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler((result: any) => {
          resolve(result || { success: true, count: guestsArray.length, message: "Impor massal sukses!" });
        })
        .withFailureHandler((error: any) => {
          reject(new Error(error?.message || "Gagal impor massal"));
        })
        .bulkImportGuests(guestsArray);
    });
  }

  // Mode 2: Live GAS Web App API Gateway
  if (settings.mode === "gas" && settings.gasWebAppUrl) {
    try {
      const response = await fetch(settings.gasWebAppUrl, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "bulkImportGuests",
          guestsArray
        })
      });
      const resData = await response.json();
      await syncLocalBulkImport(guestsArray);
      return resData;
    } catch (err) {
      console.warn("GAS bulk import failed, fell back to local storage:", err);
    }
  }

  // Mode 3: Local simulation
  await syncLocalBulkImport(guestsArray);
  return {
    success: true,
    count: guestsArray.length,
    message: `Berhasil mengimpor ${guestsArray.length} tamu secara lokal!`
  };
}

async function syncLocalBulkImport(guestsArray: Partial<Guest>[]) {
  const cached = localStorage.getItem(GUESTS_KEY);
  const guests: Guest[] = cached ? JSON.parse(cached) : [...INITIAL_GUESTS];

  guestsArray.forEach((g) => {
    const newId = "G-" + Math.floor(100000 + Math.random() * 900000);
    const newGuest: Guest = {
      id: newId,
      name: g.name || "Tamu Tanpa Nama",
      category: g.category || "Umum",
      status: g.status || "Belum Hadir",
      guestCount: g.guestCount || 0,
      checkInTime: g.status === "Hadir" ? (g.checkInTime || new Date().toISOString().replace('T', ' ').substring(0, 19)) : "",
      photoUrl: "",
      notes: g.notes || ""
    };
    guests.unshift(newGuest);
  });

  localStorage.setItem(GUESTS_KEY, JSON.stringify(guests));
}

/**
 * Calculates dashboard statistics based on guest data
 */
export function calculateStats(guests: Guest[]): DashboardStats {
  const totalGuests = guests.length;
  const attendedGuests = guests.filter((g) => g.status === "Hadir").length;
  const pendingGuests = totalGuests - attendedGuests;
  
  // Calculate total people attending = guest count of attended + the attended guest themselves
  let totalPax = 0;
  guests.forEach((g) => {
    if (g.status === "Hadir") {
      totalPax += 1 + (g.guestCount || 0);
    }
  });

  const categoryBreakdown: { [category: string]: { total: number; attended: number } } = {};
  guests.forEach((g) => {
    const cat = g.category || "Umum";
    if (!categoryBreakdown[cat]) {
      categoryBreakdown[cat] = { total: 0, attended: 0 };
    }
    categoryBreakdown[cat].total += 1;
    if (g.status === "Hadir") {
      categoryBreakdown[cat].attended += 1;
    }
  });

  return {
    totalGuests,
    attendedGuests,
    pendingGuests,
    totalPax,
    categoryBreakdown
  };
}

/**
 * Helpful copy-paste snippet that users can paste into their Appsscript Code.gs
 * to make their Google Apps Script support cross-origin API REST queries!
 */
export const CODE_GS_PATCH = `
/**
 * TAMBAHAN UNTUK SINKRONISASI API WEB (CORS SUPPORT)
 * Tambahkan kode ini ke bagian bawah file Code.gs Anda di Google Apps Script editor.
 * Deployment harus dideploy ulang sebagai Web App baru (Versi baru, Akses: Siapa Saja / Anyone).
 */

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    let result = { success: false, message: "Aksi tidak dikenal" };
    
    if (action === "checkInGuest") {
      result = checkInGuest(payload.id, payload.guestCount || 0, payload.photoBase64 || "", payload.notes || "");
    } else if (action === "addOrUpdateGuest") {
      result = addOrUpdateGuest(payload.guest);
    } else if (action === "deleteGuest") {
      result = deleteGuest(payload.id);
    } else if (action === "bulkImportGuests") {
      result = bulkImportGuests(payload.guestsArray);
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Update fungsi doGet Anda agar mendukung parameter ?action=getGuests secara langsung
function doGet(e) {
  if (e && e.parameter && e.parameter.action === "getGuests") {
    try {
      const guests = getGuests();
      return ContentService.createTextOutput(JSON.stringify(guests))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
      return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  // Default HTML rendering
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Wedding Guest Management Dashboard')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
`;

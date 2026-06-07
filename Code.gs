/**
 * GOOGLE APPS SCRIPT BACKEND ENGINE FOR WEDDING GUEST BOOK
 * Penulis: Dream08
 * Versi: 1.0.0
 * 
 * Tempatkan file ini di editor Google Apps Script Anda (Code.gs).
 * Hubungkan dengan Google Sheets sebagai database utama.
 */

// Konstanta Nama Sheet & Folder Drive
var SHEET_NAME = "Daftar_Tamu";
var FOLDER_NAME = "Foto_CheckIn_Wedding";

/**
 * 1. MENDAPATKAN SPREADSHEET AKTIF
 * Utility untuk mendapatkan objek sheet target aktif. Jika belum ada, otomatis membuat sheet baru dengan header yang sesuai.
 */
function getActiveSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Masukkan Header Kolom
    // Kolom: A:ID, B:Nama, C:Kategori, D:Status, E:Jumlah Pendamping, F:Waktu Hadir, G:Foto Drive, H:Catatan
    sheet.appendRow([
      "id",
      "name",
      "category",
      "status",
      "guestCount",
      "checkInTime",
      "photoUrl",
      "notes"
    ]);
    sheet.getRange("A1:H1").setFontWeight("bold").setBackground("#5A5A40").setFontColor("#FFFFFF");
    sheet.setFrozenRows(1);
    
    // Seed default tamu awal jika kosong
    seedDefaultGuests(sheet);
  }
  return sheet;
}

/**
 * 2. MENGAMBIL SEMUA TAMU (getGuests)
 * Mengembalaan array of object berisi semua data tamu dari Google Sheets.
 */
function getGuests() {
  try {
    var sheet = getActiveSheet();
    var rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) return []; // Hanya header
    
    var guests = [];
    // Index rows mulai dari index 1 (melewati header)
    for (var i = 1; i < rows.length; i++) {
      var row = rows[i];
      // Jika kolom ID kosong, lewati
      if (!row[0]) continue;
      
      guests.push({
        id: String(row[0]),
        name: String(row[1] || ""),
        category: String(row[2] || "Umum"),
        status: String(row[3] || "Belum Hadir"),
        guestCount: Number(row[4] || 0),
        checkInTime: String(row[5] || ""),
        photoUrl: String(row[6] || ""),
        notes: String(row[7] || "")
      });
    }
    return guests;
  } catch (error) {
    throw new Error("Gagal mengambil data tamu: " + error.toString());
  }
}

/**
 * 3. PROSES CHECK-IN TAMU (checkInGuest)
 * Mengubah status tamu menjadi Hadir, merekam timestamp, mencatat cadangan pendamping, dan menyimpan foto snapshot ke Google Drive.
 */
function checkInGuest(id, guestCount, photoBase64, notes) {
  try {
    var sheet = getActiveSheet();
    var data = sheet.getDataRange().getValues();
    var rowIndex = -1;
    
    // Cari baris berdasarkan ID Tamu (index 0)
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(id).trim()) {
        rowIndex = i + 1; // Konversi ke koordinat Google Sheet (1-based index)
        break;
      }
    }
    
    if (rowIndex === -1) {
      return { success: false, message: "Tamu dengan ID " + id + " tidak ditemukan." };
    }
    
    var photoUrl = "";
    // Jika ada kiriman foto base64, simpan ke Google Drive
    if (photoBase64 && photoBase64.indexOf("base64,") > -1) {
      photoUrl = uploadPhotoToDrive(id + "_" + Date.now(), photoBase64);
    }
    
    // Format timestamp lokal (WIB / Waktu setempat)
    var timestamp = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss");
    
    // Update baris target di Google Sheets
    sheet.getRange(rowIndex, 4).setValue("Hadir");
    sheet.getRange(rowIndex, 5).setValue(Number(guestCount || 0));
    sheet.getRange(rowIndex, 6).setValue(timestamp);
    if (photoUrl) {
      sheet.getRange(rowIndex, 7).setValue(photoUrl);
    }
    sheet.getRange(rowIndex, 8).setValue(notes || "");
    
    SpreadsheetApp.flush();
    return { success: true, message: "Check-in sukses atas nama " + data[rowIndex-1][1] + "!", photoUrl: photoUrl };
    
  } catch (error) {
    return { success: false, message: "Error check-in: " + error.toString() };
  }
}

/**
 * 4. TAMBAH ATAU EDIT TAMU (addOrUpdateGuest)
 * Menyisipkan tamu baru atau memperbarui data tamu yang sudah ada berdasarkan ID unik.
 */
function addOrUpdateGuest(guest) {
  try {
    var sheet = getActiveSheet();
    var data = sheet.getDataRange().getValues();
    var rowIndex = -1;
    var guestId = guest.id;
    
    // Cari baris jika ID ada
    if (guestId) {
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim() === String(guestId).trim()) {
          rowIndex = i + 1;
          break;
        }
      }
    } else {
      // Buat ID baru jika data belum memiliki ID
      guestId = "G-" + Math.floor(100000 + Math.random() * 900000);
    }
    
    // Persiapkan nilai
    var idVal = guestId;
    var nameVal = guest.name || "Tamu Tanpa Nama";
    var categoryVal = guest.category || "Umum";
    var statusVal = guest.status || "Belum Hadir";
    var countVal = Number(guest.guestCount || 0);
    var timeVal = guest.checkInTime || "";
    var photoVal = guest.photoUrl || "";
    var notesVal = guest.notes || "";
    
    if (rowIndex > -1) {
      // UPDATE BARIS AKTIF
      sheet.getRange(rowIndex, 2).setValue(nameVal);
      sheet.getRange(rowIndex, 3).setValue(categoryVal);
      sheet.getRange(rowIndex, 4).setValue(statusVal);
      sheet.getRange(rowIndex, 5).setValue(countVal);
      sheet.getRange(rowIndex, 6).setValue(timeVal);
      sheet.getRange(rowIndex, 7).setValue(photoVal);
      sheet.getRange(rowIndex, 8).setValue(notesVal);
    } else {
      // INSERT BARIS BARU (Disisipkan tepat di bawah header)
      sheet.appendRow([idVal, nameVal, categoryVal, statusVal, countVal, timeVal, photoVal, notesVal]);
    }
    
    SpreadsheetApp.flush();
    return { success: true, message: "Daftar tamu berhasil diperbarui!" };
    
  } catch (error) {
    return { success: false, message: "Error menyimpan tamu: " + error.toString() };
  }
}

/**
 * 5. HAPUS TAMU (deleteGuest)
 * Menghapus rekor baris tamu berdasarkan ID unik.
 */
function deleteGuest(id) {
  try {
    var sheet = getActiveSheet();
    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(id).trim()) {
        sheet.deleteRow(i + 1);
        SpreadsheetApp.flush();
        return { success: true, message: "Tamu berhasil dihapus secara permanen!" };
      }
    }
    return { success: false, message: "Tamu tidak ditemukan dalam database." };
  } catch (error) {
    return { success: false, message: "Error menghapus: " + error.toString() };
  }
}

/**
 * 6. IMPOR MASSAL TAMU (bulkImportGuests)
 * Mengimpor kumpulan array tamu yang diunggah secara CSV/JSON.
 */
function bulkImportGuests(guestsArray) {
  try {
    var sheet = getActiveSheet();
    
    for (var i = 0; i < guestsArray.length; i++) {
      var guest = guestsArray[i];
      var newId = guest.id || "G-" + Math.floor(100000 + Math.random() * 900000);
      
      sheet.appendRow([
        newId,
        guest.name || "Tamu Tanpa Nama",
        guest.category || "Umum",
        guest.status || "Belum Hadir",
        Number(guest.guestCount || 0),
        guest.checkInTime || "",
        guest.photoUrl || "",
        guest.notes || ""
      ]);
    }
    SpreadsheetApp.flush();
    return { success: true, count: guestsArray.length, message: "Berhasil mengimpor " + guestsArray.length + " tamu!" };
  } catch (error) {
    return { success: false, message: "Error impor massal: " + error.toString() };
  }
}

/**
 * UTILITY: UPLOAD PHOTO KE GOOGLE DRIVE
 * Mengkonversi gambar Base64 menjadi file di Google Drive dan menghasilkan tautan publik.
 */
function uploadPhotoToDrive(fileName, base64Data) {
  try {
    var splitData = base64Data.split("base64,");
    var contentType = splitData[0].match(/:(.*?);/)[1];
    var base64Clean = splitData[1];
    var decoded = Utilities.base64Decode(base64Clean);
    var blob = Utilities.newBlob(decoded, contentType, fileName + ".jpg");
    
    // Dapatkan atau buat folder penyimpanan
    var parentFolder;
    var folders = DriveApp.getFoldersByName(FOLDER_NAME);
    if (folders.hasNext()) {
      parentFolder = folders.next();
    } else {
      parentFolder = DriveApp.createFolder(FOLDER_NAME);
    }
    
    // Tulis file
    var file = parentFolder.createFile(blob);
    // Atur visibilitas file agar dapat dilihat oleh siapa saja yang memiliki tautan
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return file.getUrl();
  } catch (error) {
    Logger.log("Gagal mengunggah foto ke Google Drive: " + error.toString());
    return ""; // Kembalikan string kosong jika gagal, app akan tetap jalan
  }
}

/**
 * UTILITY: SEED TAMU DEFAULT
 * Mengisi database awal jika spreadsheet baru saja dibentuk agar tidak kosong melompong.
 */
function seedDefaultGuests(sheet) {
  var defaults = [
    ["G-882103", "Bapak Hermawan Prasetyo", "VIP Utama", "Belum Hadir", 0, "", "", "Keluarga Besan Putri"],
    ["G-299105", "Ibu Linda Kartika", "VIP", "Belum Hadir", 2, "", "", "Rekan Bisnis Pengantin Pria"],
    ["G-771109", "Joko Purwanto", "Keluarga", "Belum Hadir", 1, "", "", "Om dari Pihak Pengantin Wanita"],
    ["G-102551", "Siti Aminah Wijaya", "Kerabat", "Belum Hadir", 0, "", "", "Sahabat SMA Pengantin Wanita"],
    ["G-551020", "Andi Budiman, S.T.", "Umum", "Belum Hadir", 3, "", "", "Tetangga Kompleks Perumahan"]
  ];
  
  for (var i = 0; i < defaults.length; i++) {
    sheet.appendRow(defaults[i]);
  }
}

/**
 * =========================================================================
 * JALUR KOMUNIKASI API EKSTERNAL (CORS & WEB APP SINKRONISASI)
 * =========================================================================
 * doGet & doPost untuk melayani REST request dari frontend eksternal.
 */

function doGet(e) {
  try {
    // 1. Melayani Request API mengambil tamu: ?action=getGuests
    if (e && e.parameter && e.parameter.action === "getGuests") {
      var guests = getGuests();
      return ContentService.createTextOutput(JSON.stringify(guests))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // 2. Default: Melayani Tampilan Halaman HTML (Jika React ditanam di Apps Script)
    return HtmlService.createTemplateFromFile('Index')
      .evaluate()
      .setTitle('Wedding Guest Book Dashboard')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;
    var result = { success: false, message: "Aksi tidak dikenal" };
    
    if (action === "checkInGuest") {
      result = checkInGuest(
        payload.id,
        payload.guestCount || 0,
        payload.photoBase64 || "",
        payload.notes || ""
      );
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

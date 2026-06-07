/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from "react";
import { Camera, X, Check, RefreshCw, AlertCircle, Sparkles, UserPlus } from "lucide-react";
import { Guest } from "../types";

interface CameraCheckInModalProps {
  guest: Guest;
  onClose: () => void;
  onConfirm: (guestCount: number, photoBase64: string, notes: string) => Promise<void>;
}

export default function CameraCheckInModal({ guest, onClose, onConfirm }: CameraCheckInModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  
  // State for check-in data
  const [guestCount, setGuestCount] = useState<number>(guest.guestCount || 0);
  const [notes, setNotes] = useState<string>(guest.notes || "");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [flashEffect, setFlashEffect] = useState<boolean>(false);

  // Initialize Camera on Mount
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  async function startCamera() {
    setCameraError(null);
    setCapturedPhoto(null);
    stopCamera();

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(err => {
          console.error("Error playing video:", err);
        });
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn("Camera access denied or unavailable:", err);
      setCameraError(
        "Kamera tidak dapat diakses. Pastikan izin kamera diberikan atau gunakan opsi unggah manual."
      );
      setCameraActive(false);
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  }

  // Flash Capture Function
  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;
    
    // Toggle white flash screen effect
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 200);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      // Set canvas size matching the active video stream size
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      // Draw frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Extract Base64
      const base64 = canvas.toDataURL("image/jpeg", 0.8);
      setCapturedPhoto(base64);
      stopCamera();
    }
  }

  // Fallback Manual Photo Upload handling
  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCapturedPhoto(event.target.result as string);
        stopCamera();
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onConfirm(guestCount, capturedPhoto || "", notes);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#D4AF37]/20 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F5F5F0] bg-[#F5F5F0]/40">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] font-mono">Check-In Baru</span>
            <h3 className="text-xl font-normal text-[#5A5A40] font-serif italic mt-0.5">{guest.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#EBEBE4]/50 text-[#8A8A70] transition hover:text-[#5A5A40]"
          >
            <X className="w-5 h-5" id="close-modal-icon" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          {/* Camera Viewer / Photo Area */}
          <div className="relative aspect-video rounded-2xl bg-[#333322] border border-[#5A5A40]/30 overflow-hidden flex items-center justify-center select-none shadow-inner">
            {/* Flash Overlay */}
            {flashEffect && <div className="absolute inset-0 bg-white z-20 animate-fade" />}

            {!capturedPhoto && cameraActive && (
              <>
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]" // mirror effect
                />
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#5A5A40] hover:bg-[#4A4A30] font-medium text-white transition shadow-lg active:scale-95"
                >
                  <Camera className="w-4 h-4" /> Ambil Foto
                </button>
              </>
            )}

            {!capturedPhoto && !cameraActive && (
              <div className="flex flex-col items-center justify-center p-6 text-center text-[#8A8A70] w-full h-full">
                {cameraError ? (
                  <div className="flex flex-col items-center gap-3">
                    <AlertCircle className="w-8 h-8 text-[#D4AF37]" />
                    <p className="text-xs text-[#EBEBE4] max-w-xs">{cameraError}</p>
                    <label className="mt-2 text-xs text-white bg-[#5A5A40] hover:bg-[#4A4A30] px-4 py-2.5 rounded-xl cursor-pointer font-medium transition border border-[#D4AF37]/20 shadow-xs">
                      Unggah Foto Manual
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="w-8 h-8 text-[#D4AF37] animate-spin" />
                    <p className="text-xs text-[#EBEBE4]">Menghubungkan ke kamera...</p>
                  </div>
                )}
              </div>
            )}

            {capturedPhoto && (
              <div className="relative w-full h-full">
                <img
                  src={capturedPhoto}
                  alt="Captured Guest photo"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#5A5A40]/90 text-[10px] uppercase font-bold text-white tracking-widest backdrop-blur-xs shadow-md">
                  <Check className="w-3 h-3" /> Foto Terambil
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCapturedPhoto(null);
                    startCamera();
                  }}
                  className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 hover:bg-black/75 text-xs text-white transition backdrop-blur-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Ulangi Foto
                </button>
              </div>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {/* Guest Companion Controls */}
          <div className="bg-[#F5F5F0]/60 rounded-2xl p-4 border border-[#D4AF37]/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <label className="text-xs font-bold text-[#5A5A40] block mb-1 uppercase tracking-wide">Jumlah Pendamping</label>
              <p className="text-xs text-[#8A8A70]">Jumlah keluarga/teman yang datang bersama tamu inti</p>
            </div>
            <div className="flex items-center gap-3 bg-white border border-[#D4AF37]/25 rounded-xl p-1.5 shadow-xs self-end md:self-auto">
              <button
                type="button"
                onClick={() => setGuestCount(Math.max(0, guestCount - 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F5F5F0] text-[#5A5A40] transition font-bold text-lg border border-[#F5F5F0] active:scale-95"
              >
                -
              </button>
              <span className="w-10 text-center font-semibold text-[#333322] text-sm font-mono">
                {guestCount} Orang
              </span>
              <button
                type="button"
                onClick={() => setGuestCount(guestCount + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F5F5F0] text-[#5A5A40] transition font-bold text-lg border border-[#F5F5F0] active:scale-95"
              >
                +
              </button>
            </div>
          </div>

          {/* Quick Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#5A5A40] uppercase tracking-wide">Catatan Kehadiran</label>
            <textarea
              placeholder="Tambahkan catatan khusus, contoh: 'Keluarga Mempelai Pria', 'Kursi Meja 5 VIP'..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-[#333322] border border-[#D4AF37]/30 rounded-xl px-4 py-3 text-sm focus:border-[#5A5A40] focus:ring-2 focus:ring-[#5A5A40]/10 focus:outline-none placeholder:text-[#8A8A70] min-h-[70px] resize-none bg-white"
            />
          </div>

          {/* Submit buttons */}
          <div className="flex gap-3 justify-end pt-3 border-t border-[#F5F5F0]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-[#D4AF37]/30 hover:bg-[#F5F5F0] font-semibold text-[#5A5A40] text-xs transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-[#5A5A40] hover:bg-[#4A4A30] disabled:bg-[#8A8A70]/60 text-white text-xs font-semibold transition shadow-xs flex items-center gap-2 active:scale-[0.98]"
            >
              {submitting ? "Memproses..." : "Konfirmasi Hadir (Check-In)"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

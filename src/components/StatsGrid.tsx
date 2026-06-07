/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "motion/react";
import { Users, CheckCircle, Clock, UserCheck } from "lucide-react";
import { DashboardStats } from "../types";

interface StatsGridProps {
  stats: DashboardStats;
}

export default function StatsGrid({ stats }: StatsGridProps) {
  const cards = [
    {
      id: "stat-total",
      title: "Total Undangan",
      value: stats.totalGuests,
      sub: "Akun/Keluarga Terdaftar",
      icon: Users,
      color: "border-[#D4AF37]/20 bg-white text-[#333322]",
      iconColor: "text-[#5A5A40] bg-[#EBEBE4]/60",
    },
    {
      id: "stat-attended",
      title: "Sudah Check-In",
      value: stats.attendedGuests,
      sub: `${((stats.attendedGuests / (stats.totalGuests || 1)) * 100).toFixed(0)}% Tingkat Kehadiran`,
      icon: CheckCircle,
      color: "border-[#D4AF37]/30 bg-[#F5F5F0]/50 text-[#333322]",
      iconColor: "text-[#5A5A40] bg-[#D4AF37]/20",
    },
    {
      id: "stat-pax",
      title: "Total Pax Hadir",
      value: stats.totalPax,
      sub: `Tamu + Pendamping Hadir`,
      icon: UserCheck,
      color: "border-[#D4AF37]/30 bg-[#EBEBE4]/30 text-[#333322]",
      iconColor: "text-[#D4AF37] bg-white border border-[#D4AF37]/20",
    },
    {
      id: "stat-pending",
      title: "Belum Hadir",
      value: stats.pendingGuests,
      sub: "Menunggu Kedatangan",
      icon: Clock,
      color: "border-[#D4AF37]/15 bg-white text-[#8A8A70]",
      iconColor: "text-[#8A8A70] bg-[#F5F5F0]/80",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.id}
            id={card.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className={`flex flex-col justify-between p-5 rounded-2xl border ${card.color} shadow-sm`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider font-bold text-[#8A8A70]">{card.title}</span>
              <div className={`p-2 rounded-xl backdrop-blur-xs ${card.iconColor}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-4xl font-serif text-[#5A5A40] font-normal tracking-tight">
                {card.value}
              </div>
              <p className="text-xs mt-1.5 text-[#8A8A70] truncate">{card.sub}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

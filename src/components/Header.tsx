import React, { useState, useEffect } from "react";
import { Leaf, Award, Flame, Sparkles, RefreshCw, Target, HelpCircle } from "lucide-react";
import { UserProfile } from "../types";
import { motion } from "motion/react";

interface HeaderProps {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onOpenGoalsModal: () => void;
}

export default function Header({ profile, setProfile, onOpenGoalsModal }: HeaderProps) {
  const [tip, setTip] = useState<string>(() => {
    return localStorage.getItem("terra_eco_daily_tip") || "Washing clothes on cold cycles instead of hot saves about 75-90% of the washing machine's electricity demand.";
  });
  const [loadingTip, setLoadingTip] = useState(false);

  async function fetchNewTip() {
    setLoadingTip(true);
    try {
      const res = await fetch("/api/gemini/tip");
      const data = await res.json();
      if (data.tip) {
        setTip(data.tip);
        localStorage.setItem("terra_eco_daily_tip", data.tip);
        localStorage.setItem("terra_eco_last_tip_fetch", Date.now().toString());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTip(false);
    }
  }

  useEffect(() => {
    // Only fetch an initial tip from Gemini on load if we don't have one or if the cache is older than 2 hours
    const lastFetch = localStorage.getItem("terra_eco_last_tip_fetch");
    const now = Date.now();
    if (!lastFetch || now - parseInt(lastFetch, 10) > 2 * 60 * 60 * 1000) {
      fetchNewTip();
    }
  }, []);

  return (
    <div id="eco-header-container" className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Brand Hero & Quick Stats */}
      <div id="brand-hero-card" className="glow-effect lg:col-span-2 bg-[#3d4533]/55 dark:bg-[#152012]/35 backdrop-blur-xl text-[#f4f4f0] rounded-[32px] p-8 shadow-md relative overflow-hidden border border-[#a3b18a]/30">
        <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none transform translate-y-4 translate-x-4">
          <Leaf size={280} className="text-[#a3b18a]" />
        </div>
        
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-white/10 dark:bg-[#9ab083]/10 text-[#d8e5c8] dark:text-[#a0b58c] px-3 py-1 rounded-full text-xs font-mono border border-[#a3b18a]/30 flex items-center gap-1.5">
                <Sparkles size={12} className="animate-pulse" /> Active Carbon Offset Engine
              </span>
            </div>
            <h1 className="text-3xl font-normal tracking-tight mb-2 text-white">
              Welcome back, <span className="font-serif italic text-[#d0e0bc] dark:text-[#b8d0a0] font-bold">{profile.name || "Eco-Warrior"}</span>
            </h1>
            <p className="text-[#e2ebd8]/90 text-sm max-w-xl font-sans mb-6">
              Track small choices daily to visualize how transportation, dietary switches, and home utilities accumulate emissions. Join live custom green challenges to reduce your output immediately.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-white/15 pt-5">
            <div className="text-center sm:text-left">
              <div className="text-xs text-[#cbdab2] dark:text-[#a0b58c] font-mono mb-1 flex items-center justify-center sm:justify-start gap-1 font-semibold">
                <Flame size={14} className="text-[#f59e0b]" /> STREAK
              </div>
              <div className="text-2xl font-black text-white">{profile.dailyStreak} <span className="text-xs text-[#cbdab2] dark:text-[#a0b58c] font-normal">days</span></div>
            </div>
            
            <div className="text-center sm:text-left border-x border-white/15 px-4">
              <div className="text-xs text-[#cbdab2] dark:text-[#a0b58c] font-mono mb-1 flex items-center justify-center sm:justify-start gap-1 font-semibold">
                <Award size={14} className="text-[#f59e0b]" /> ECO POINTS
              </div>
              <div className="text-2xl font-black text-white">{profile.ecoPoints} <span className="text-xs text-[#cbdab2] dark:text-[#a0b58c] font-normal">pts</span></div>
            </div>

            <div className="text-center sm:text-left pl-2">
              <div className="text-xs text-[#cbdab2] dark:text-[#a0b58c] font-mono mb-1 flex items-center justify-center sm:justify-start gap-1 font-semibold">
                <Leaf size={14} className="text-[#cbdab2] dark:text-[#a0b58c]" /> TOTAL SAVED
              </div>
              <div className="text-2xl font-black text-white">{profile.totalSavedCO2.toFixed(1)} <span className="text-xs text-[#cbdab2] dark:text-[#a0b58c] font-normal">kg CO₂</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Tip of the Day Box */}
      <div id="green-tip-card" className="glow-effect bg-white/92 dark:bg-[#1c1c18]/40 backdrop-blur-xl rounded-[32px] p-8 border border-[#e5e5dc] shadow-sm flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3">
          <button 
            onClick={fetchNewTip} 
            disabled={loadingTip}
            title="Ask AI for another tip"
            className="p-2 text-brand-sage hover:text-brand-earth hover:bg-brand-sand rounded-full transition-colors duration-150 relative self-end"
          >
            <RefreshCw size={16} className={`${loadingTip ? "animate-spin text-brand-moss" : ""}`} />
          </button>
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-brand-earth font-bold mb-3 uppercase tracking-wider">
            <Sparkles size={14} /> Tip of the day
          </div>
          
          <motion.p 
            key={tip}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-brand-stone text-sm leading-relaxed pr-6 font-sans italic"
          >
            "{tip}"
          </motion.p>
        </div>

        <div className="border-t border-[#e5e5dc] pt-4 mt-4 flex items-center justify-between">
          <div className="text-xs text-brand-clay flex items-center gap-1">
            <Target size={12} className="text-brand-earth" />
            <span>Target daily: <strong className="text-brand-stone">{profile.weeklyTarget} kg CO₂</strong></span>
          </div>
          <button 
            onClick={onOpenGoalsModal}
            className="text-xs text-brand-earth font-medium hover:underline flex items-center gap-1"
          >
            Adjust Target
          </button>
        </div>
      </div>
    </div>
  );
}

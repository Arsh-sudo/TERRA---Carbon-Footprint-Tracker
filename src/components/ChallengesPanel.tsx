import React, { useState, useEffect } from "react";
import { EcoChallenge, UserProfile } from "../types";
import { Award, CheckCircle2, Circle, Flame, Sparkles, TrendingDown, RefreshCw } from "lucide-react";

interface ChallengesPanelProps {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onAwardChallenge: (co2Saved: number, points: number) => void;
}

const DEFAULT_CHALLENGES: EcoChallenge[] = [
  {
    id: "challenge-1",
    title: "🚴 Active Transportation Commute",
    description: "Replace a short gas-powered solo drive under 3 miles with virtual active travel (walking, running, or cycling).",
    category: "transportation",
    co2Saving: 4.2,
    points: 120,
    completed: false
  },
  {
    id: "challenge-2",
    title: "🥗 Vegan Feast Day",
    description: "Swap classic meat portions with healthy plant-based vegetarian or vegan nutrition choices today.",
    category: "food",
    co2Saving: 3.4,
    points: 100,
    completed: false
  },
  {
    id: "challenge-3",
    title: "☀️ Solar / Line-Dry Laundry",
    description: "Hang-dry heavy laundry loads instead of operating an intensive warm-air active tumble dryer.",
    category: "energy",
    co2Saving: 1.8,
    points: 60,
    completed: false
  },
  {
    id: "challenge-4",
    title: "🔌 Unplug Idle 'Phantom' Electronics",
    description: "Unplug standby electronic equipment (TV, displays, console gaming or power chargers) before bedtime.",
    category: "energy",
    co2Saving: 0.6,
    points: 30,
    completed: false
  },
  {
    id: "challenge-5",
    title: "🛍️ zero-Purchase Commitment",
    description: "Buy strictly zero non-essential imports, plastic wrappers, or cardboard packaging today.",
    category: "lifestyle",
    co2Saving: 2.5,
    points: 80,
    completed: false
  },
  {
    id: "challenge-6",
    title: "🌬️ Natural Climate Ventilation",
    description: "Turn off artificial climate control (AC or high heaters) for 4 consecutive hours, using open ventilation.",
    category: "energy",
    co2Saving: 1.5,
    points: 50,
    completed: false
  }
];

export default function ChallengesPanel({ profile, setProfile, onAwardChallenge }: ChallengesPanelProps) {
  const [challenges, setChallenges] = useState<EcoChallenge[]>(() => {
    // Attempt local recovery of challenges
    const stored = localStorage.getItem("ecotrace_challenges");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        // Fallback
      }
    }
    return DEFAULT_CHALLENGES;
  });

  // Save challenges to local storage whenever they change
  useEffect(() => {
    localStorage.setItem("ecotrace_challenges", JSON.stringify(challenges));
  }, [challenges]);

  const handleToggleComplete = (id: string) => {
    setChallenges(prev => prev.map(ch => {
      if (ch.id === id) {
        const nextState = !ch.completed;
        
        // Award points / subtract points based on transition
        if (nextState) {
          onAwardChallenge(ch.co2Saving, ch.points);
        } else {
          onAwardChallenge(-ch.co2Saving, -ch.points);
        }

        return { ...ch, completed: nextState };
      }
      return ch;
    }));
  };

  const handleResetAll = () => {
    if (window.confirm("Would you like to reset your daily challenges to tackle them tomorrow?")) {
      setChallenges(DEFAULT_CHALLENGES);
    }
  };

  // Compute stats
  const completedCount = challenges.filter(c => c.completed).length;
  const totalCO2SavingPotential = challenges.filter(c => c.completed).reduce((acc, curr) => acc + curr.co2Saving, 0);

  return (
    <div id="eco-challenges-main-card" className="glow-effect bg-white/92 dark:bg-[#1c1c18]/40 backdrop-blur-xl border border-[#e5e5dc] rounded-[32px] p-8 shadow-sm">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-serif italic text-brand-earth tracking-tight flex items-center gap-2">
            <Award className="text-brand-earth" /> Actionable Green Challenges
          </h2>
          <p className="text-xs text-brand-sage">Join active reduction steps to score Eco-Points and mitigate climate impact</p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            type="button" 
            onClick={handleResetAll}
            title="Reset daily challenge states"
            className="p-1.5 hover:bg-brand-sand rounded-lg text-brand-sage hover:text-brand-earth transition-colors cursor-pointer"
          >
            <RefreshCw size={14} />
          </button>

          <span className="bg-brand-moss/20 text-[#556b2f] dark:text-[#a0c58a] text-xs font-mono px-3.5 py-1 rounded-full font-bold border border-[#a3b18a]/30">
            {completedCount} / {challenges.length} completed
          </span>
        </div>
      </div>

      {completedCount > 0 && (
        <div className="bg-brand-moss/15 border border-[#a3b18a]/30 rounded-2xl p-4 mb-5 flex items-center justify-between text-xs sm:text-sm text-brand-earth">
          <div className="flex items-center gap-2">
            <Sparkles className="text-brand-earth shrink-0" size={16} />
            <span>Fantastic! Your task actions saved <strong className="font-extrabold text-sm">{totalCO2SavingPotential.toFixed(1)} kg CO₂</strong> of atmospheric emissions today!</span>
          </div>
        </div>
      )}

      <div id="challenges-list-grid" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {challenges.map(ch => (
          <div 
            key={ch.id} 
            onClick={() => handleToggleComplete(ch.id)}
            className={`cursor-pointer border select-none transition-all duration-150 rounded-2xl p-4 flex gap-3 h-full relative overflow-hidden group ${ch.completed ? "bg-brand-moss/30 dark:bg-brand-moss/15 backdrop-blur-md border-[#a3b18a]/65 text-brand-earth" : "bg-white/90 hover:bg-white dark:bg-zinc-900/35 backdrop-blur-md border-[#e5e5dc] hover:border-brand-earth shadow-xs hover:shadow-sm"}`}
          >
            <div className="shrink-0 pt-0.5">
              {ch.completed ? (
                <CheckCircle2 className="text-brand-earth scale-110 shrink-0" size={18} />
              ) : (
                <Circle className="text-[#d1d1c4] group-hover:text-brand-earth shrink-0" size={18} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className={`text-sm font-semibold tracking-tight ${ch.completed ? "text-brand-earth line-through opacity-70" : "text-brand-stone"}`}>
                {ch.title}
              </h3>
              <p className="text-xs text-brand-sage mt-1 leading-normal">
                {ch.description}
              </p>

              <div className="flex items-center gap-2.5 mt-3">
                <span className="text-[10px] font-mono font-bold uppercase bg-[#f0f0e8] text-brand-cage px-2 py-0.5 rounded border border-[#e5e5dc]/60">
                  {ch.category}
                </span>
                
                <span className="text-[10px] text-[#556b2f] dark:text-[#a0c58a] font-mono font-bold">
                  🌿 -{ch.co2Saving} kg CO₂
                </span>
                
                <span className="text-[10px] text-brand-clay font-mono font-bold">
                  🏆 +{ch.points} pts
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

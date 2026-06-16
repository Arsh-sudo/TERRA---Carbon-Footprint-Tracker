import React, { useState, useEffect } from "react";
import { Sparkles, HelpCircle, RefreshCw, Send, Leaf, Target, HelpCircle as AskIcon } from "lucide-react";
import { CarbonLog, UserProfile } from "../types";

interface AiAdvisorProps {
  logs: CarbonLog[];
  profile: UserProfile;
}

export default function AiAdvisor({ logs, profile }: AiAdvisorProps) {
  const [advice, setAdvice] = useState<string>(() => {
    const cachedAdvice = localStorage.getItem("terra_eco_advice_cache");
    const cachedCount = localStorage.getItem("terra_eco_advice_log_count");
    if (cachedAdvice && cachedCount === logs.length.toString()) {
      return cachedAdvice;
    }
    return "";
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [query, setQuery] = useState<string>("");

  // Calculate some stats to feed the AI
  const getCategoryStats = () => {
    if (logs.length === 0) return { transportation: 0, energy: 0, food: 0, lifestyle: 0, total: 0 };
    let trans = 0, nrg = 0, fd = 0, style = 0, tot = 0;
    logs.forEach(l => {
      trans += l.breakdown.transportation;
      nrg += l.breakdown.energy;
      fd += l.breakdown.food;
      style += l.breakdown.lifestyle;
      tot += l.totalCO2;
    });
    const len = logs.length;
    return {
      transportation: parseFloat((trans / len).toFixed(1)),
      energy: parseFloat((nrg / len).toFixed(1)),
      food: parseFloat((fd / len).toFixed(1)),
      lifestyle: parseFloat((style / len).toFixed(1)),
      total: parseFloat((tot / len).toFixed(1))
    };
  };

  async function generateAdvice(userPromptOverride?: string) {
    setLoading(true);
    try {
      const stats = getCategoryStats();
      const payload = {
        userStats: stats,
        recentLogs: logs,
        goals: [
          `Target Daily Emissions: ${profile.weeklyTarget} kg CO2`,
          userPromptOverride ? `User requested details on: ${userPromptOverride}` : "General overall strategy requested"
        ]
      };

      const res = await fetch("/api/gemini/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.advice) {
        setAdvice(data.advice);
        // Only cache general overall analysis, not query searches
        if (!userPromptOverride) {
          localStorage.setItem("terra_eco_advice_cache", data.advice);
          localStorage.setItem("terra_eco_advice_log_count", logs.length.toString());
        }
      } else {
        setAdvice("The AI Eco-Coach was unable to generate custom inputs at this time. Please check your network or try again.");
      }
    } catch (e: any) {
      console.error(e);
      setAdvice(`Under investigation: Failed to contact our Environmental Intelligence. Please ensure your development server is running and check console. (${e.message})`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Generate initial advice only if not already cached for the current logs count
    const cachedAdvice = localStorage.getItem("terra_eco_advice_cache");
    const cachedCount = localStorage.getItem("terra_eco_advice_log_count");
    if (cachedAdvice && cachedCount === logs.length.toString()) {
      setAdvice(cachedAdvice);
    } else {
      generateAdvice();
    }
  }, [logs.length]);

  const handleCustomQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    generateAdvice(query);
    setQuery("");
  };

  const handleQuickPrompt = (promptText: string) => {
    generateAdvice(promptText);
  };

  return (
    <div id="ai-advisor-section-card" className="glow-effect bg-white/92 dark:bg-[#1c1c18]/40 backdrop-blur-xl border border-[#e5e5dc] rounded-[32px] p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-serif italic text-brand-earth tracking-tight flex items-center gap-2">
            <Sparkles className="text-brand-earth shrink-0" size={20} /> AI Sustainability Coach
          </h2>
          <p className="text-xs text-brand-sage font-sans">Personalized climate reduction strategies driven by artificial intelligence</p>
        </div>
        
        <button
          onClick={() => generateAdvice()}
          disabled={loading}
          className="self-start sm:self-auto text-xs bg-brand-sand hover:bg-[#e5e5dc] text-brand-stone px-3.5 py-2 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-55 cursor-pointer border border-[#e5e5dc]"
        >
          <RefreshCw size={12} className={loading ? "animate-spin text-brand-earth" : ""} />
          <span>Refresh Analysis</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Navigation Sidebar & Prompts */}
        <div id="advisor-prompts-sidebar" className="lg:col-span-1 space-y-4">
          <div className="bg-brand-sand/50 p-4 rounded-2xl border border-[#e5e5dc]">
            <span className="text-[10px] text-brand-sage font-mono font-bold uppercase tracking-wider block mb-3">Ask coach quick queries:</span>
            
            <div className="space-y-1.5 font-sans">
              <button
                onClick={() => handleQuickPrompt("Highlight the single optimal action I can take to carbon-halve my footprint based on my logs.")}
                className="w-full text-left text-xs text-brand-stone hover:text-brand-earth hover:bg-white p-2 rounded-xl transition-all duration-150 border border-transparent hover:border-[#e5e5dc] cursor-pointer"
              >
                🎯 High Impact Action
              </button>
              <button
                onClick={() => handleQuickPrompt("What are high-impact meat-free meal alternatives to replace intensive beef dinners?")}
                className="w-full text-left text-xs text-brand-stone hover:text-brand-earth hover:bg-white p-2 rounded-xl transition-all duration-150 border border-transparent hover:border-[#e5e5dc] cursor-pointer"
              >
                🥗 Sustained Dietary protein
              </button>
              <button
                onClick={() => handleQuickPrompt("Explain why washing clothes at 30 degrees Celsius limits emissions so efficiently.")}
                className="w-full text-left text-xs text-brand-stone hover:text-brand-earth hover:bg-white p-2 rounded-xl transition-all duration-150 border border-transparent hover:border-[#e5e5dc] cursor-pointer"
              >
                🧺 Eco Cold-Washing explained
              </button>
              <button
                onClick={() => handleQuickPrompt("Help me understand carbon grid intensity. What time of day is household electricity cleanest?")}
                className="w-full text-left text-xs text-brand-stone hover:text-brand-earth hover:bg-white p-2 rounded-xl transition-all duration-150 border border-transparent hover:border-[#e5e5dc] cursor-pointer"
              >
                🔌 Grid Intensity timing
              </button>
            </div>
          </div>

          <div className="bg-[#f0f0e8] p-4 rounded-2xl border border-[#e5e5dc] text-xs text-brand-stone space-y-1.5 leading-relaxed">
            <span className="font-bold flex items-center gap-1 text-brand-earth"><Leaf size={12} /> Environmental Fact:</span>
            <span className="text-brand-clay">If everybody limited dietary meat usage and committed to recycling, global organic landfill emissions would fall by over 50%!</span>
          </div>
        </div>

        {/* Advisor output & interactive prompt input */}
        <div id="ai-advisor-render" className="lg:col-span-3 flex flex-col justify-between">
          <div className="bg-brand-milk rounded-2xl p-6 border border-[#e5e5dc] min-h-[220px] max-h-[360px] overflow-y-auto relative text-brand-stone text-sm leading-relaxed whitespace-pre-line font-sans shadow-inner">
            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-brand-milk/80 z-10 transition-opacity">
                <Leaf size={32} className="animate-spin text-brand-earth mb-2" />
                <span className="text-xs text-brand-sage font-mono animate-pulse">Running climate carbon ratios...</span>
              </div>
            ) : null}

            {!advice ? (
              <div className="text-center text-brand-sage py-12">
                Click any prompt or submit custom queries below to unlock your automated carbon analysis!
              </div>
            ) : (
              // Very simple customized formatter for basic markdown headers/lists to look amazing
              advice.split('\n').map((line, index) => {
                if (line.startsWith('### ')) {
                  return <h4 key={index} className="text-sm font-serif italic font-bold text-brand-earth mt-4 mb-2 tracking-tight uppercase">{line.substring(4)}</h4>;
                }
                if (line.startsWith('## ') || line.startsWith('# ')) {
                  return <h3 key={index} className="text-base font-serif italic font-bold text-brand-earth mt-4 mb-2 tracking-tight border-b border-[#e5e5dc] pb-1">{line.replace(/^#+\s*/, '')}</h3>;
                }
                if (line.startsWith('- ') || line.startsWith('* ')) {
                  return <li key={index} className="ml-4 list-disc text-brand-clay my-1">{line.substring(2)}</li>;
                }
                if (/^\d+\.\s*/.test(line)) {
                  return <li key={index} className="ml-4 list-decimal text-brand-clay my-1">{line.replace(/^\d+\.\s*/, '')}</li>;
                }
                return <p key={index} className="my-1.5 text-brand-stone leading-relaxed">{line}</p>;
              })
            )}
          </div>

          {/* Prompt Entry Box Form */}
          <form onSubmit={handleCustomQuerySubmit} className="mt-4 flex items-center gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask the AI Advisor: e.g. How do I swap petrol trips easily?"
              className="flex-1 text-sm bg-brand-milk border border-[#e5e5dc] rounded-xl px-4 py-2.5 text-brand-stone focus:outline-none focus:border-brand-earth"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="bg-brand-earth hover:bg-[#4a4a35] text-white p-2.5 rounded-xl transition-all disabled:opacity-40 cursor-pointer shadow-sm"
              title="Submit prompt query"
            >
              <Send size={16} />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

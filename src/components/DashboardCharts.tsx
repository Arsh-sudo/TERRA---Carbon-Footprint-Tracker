import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, BarChart, Bar, Legend } from "recharts";
import { CarbonLog } from "../types";
import { Leaf, TrendingDown, Info, HelpCircle } from "lucide-react";

interface DashboardChartsProps {
  logs: CarbonLog[];
  weeklyTarget: number;
}

export default function DashboardCharts({ logs, weeklyTarget }: DashboardChartsProps) {
  // 1. Calculate stats
  const totalLogs = logs.length;
  
  if (totalLogs === 0) {
    return (
      <div id="charts-empty-state" className="bg-white/92 dark:bg-zinc-900/40 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm text-center flex flex-col items-center justify-center min-h-[350px]">
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-full text-emerald-600 dark:text-emerald-400 mb-4 animate-bounce">
          <Leaf size={36} />
        </div>
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">No Emissions Logs Found</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mb-6">
          Start logging your activities using the form below (transportation, food choices, home power, and waste processing) to construct real-time footprint graphs.
        </p>
      </div>
    );
  }

  // Calculate averages
  let totalTransport = 0;
  let totalEnergy = 0;
  let totalFood = 0;
  let totalLifestyle = 0;
  let accumulatedCO2 = 0;

  logs.forEach(log => {
    totalTransport += log.breakdown.transportation;
    totalEnergy += log.breakdown.energy;
    totalFood += log.breakdown.food;
    totalLifestyle += log.breakdown.lifestyle;
    accumulatedCO2 += log.totalCO2;
  });

  const avgTransport = parseFloat((totalTransport / totalLogs).toFixed(1));
  const avgEnergy = parseFloat((totalEnergy / totalLogs).toFixed(1));
  const avgFood = parseFloat((totalFood / totalLogs).toFixed(1));
  const avgLifestyle = parseFloat((totalLifestyle / totalLogs).toFixed(1));
  const avgTotal = parseFloat((accumulatedCO2 / totalLogs).toFixed(1));

  // Data for Category breakdown (Pie Chart)
  const pieData = [
    { name: "🚗 Transportation", value: avgTransport, color: "#8a8a75" }, // brand-sage
    { name: "⚡ Energy & Utility", value: avgEnergy, color: "#5a5a40" },     // brand-earth
    { name: "🍔 Dietary/Food", value: avgFood, color: "#a3b18a" },       // brand-moss
    { name: "🛍️ Consumer Lifestyle", value: avgLifestyle, color: "#707060" } // brand-clay
  ].filter(item => item.value > 0);

  // Data for Trend Line (Area Chart) - last 10 entries sorted chronologically
  const sortedLogs = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const trendData = sortedLogs.slice(-10).map(log => ({
    date: log.date.substring(5), // Keep MM-DD format
    "CO₂ emission (kg)": log.totalCO2,
    "Daily Target limit": weeklyTarget
  }));

  // Data for comparison benchmarks
  const benchmarkData = [
    { name: "Sustainable", "CO₂ (kg)": 4.0, color: "#a3b18a" },
    { name: "Your Daily Avg", "CO₂ (kg)": avgTotal, color: avgTotal <= weeklyTarget ? "#5a5a40" : "#707060" },
    { name: "Your Target", "CO₂ (kg)": weeklyTarget, color: "#8a8a75" },
    { name: "Global Avg", "CO₂ (kg)": "#d1d1c4" === "#d1d1c4" ? "#3d3d33" : "#d1d1c4" }
  ];

  const getCO2PerformancePercent = () => {
    const diff = ((avgTotal - 11.0) / 11.0) * 100;
    if (diff < 0) {
      return { text: `${Math.abs(Math.round(diff))}% better than the global average`, positive: true };
    }
    return { text: `${Math.round(diff)}% higher than global averages`, positive: false };
  };

  const performance = getCO2PerformancePercent();

  return (
    <div id="analytics-grid-container" className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
      
      {/* 1. Historical Footprint Trend */}
      <div id="chart-trend-card" className="glow-effect xl:col-span-2 bg-white/92 dark:bg-[#1c1c18]/40 backdrop-blur-xl border border-[#e5e5dc] rounded-[32px] p-8 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-serif italic text-brand-earth tracking-tight">Emission Trend Line</h3>
            <p className="text-xs text-brand-sage">Daily Carbon Footprint progression (last 10 logs)</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-brand-earth bg-brand-sand px-2.5 py-1 rounded-full border border-brand-sage/20">
            <TrendingDown size={12} /> Live tracking
          </div>
        </div>

        <div className="h-64 mt-4 select-none">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCO2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5a5a40" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#5a5a40" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#8a8a75" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#8a8a75" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: "16px", 
                  background: "var(--color-brand-milk)", 
                  border: "1px solid var(--color-brand-clay)", 
                  color: "var(--color-brand-stone)",
                  fontSize: "12px"
                }} 
              />
              <Area type="monotone" dataKey="CO₂ emission (kg)" stroke="#5a5a40" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCO2)" />
              <Area type="monotone" dataKey="Daily Target limit" stroke="#707060" strokeWidth={1.5} strokeDasharray="4 4" fill="none" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Composition / Category Pie Chart & comparison benchmark card */}
      <div id="chart-breakdown-card" className="glow-effect bg-white/92 dark:bg-[#1c1c18]/40 backdrop-blur-xl border border-[#e5e5dc] rounded-[32px] p-8 shadow-sm flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-serif italic text-brand-earth tracking-tight">Source Distribution</h3>
          <p className="text-xs text-brand-sage">Averages of logged categories (kg CO₂/day)</p>
        </div>

        {pieData.length === 0 ? (
          <div className="text-center py-10 text-brand-sage text-sm">No positive emission logs to analyze.</div>
        ) : (
          <div className="flex flex-col items-center justify-center my-2">
            <div className="h-44 w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`${value} kg CO₂`, "Avg Emissions"]}
                    contentStyle={{ borderRadius: "16px", background: "var(--color-brand-milk)", border: "1px solid var(--color-brand-clay)", color: "var(--color-brand-stone)", fontSize: "11px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-serif italic text-brand-earth">{avgTotal}</span>
                <span className="text-[10px] text-brand-sage font-mono uppercase tracking-widest">kg Avg</span>
              </div>
            </div>

            {/* Custom Legend */}
            <div className="grid grid-cols-2 gap-2 mt-2 w-full text-xs">
              {pieData.map((item, index) => (
                <div key={index} className="flex items-center gap-1.5 p-1 bg-brand-milk border border-[#e5e5dc] rounded-xl">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-brand-stone font-sans truncate" title={item.name}>
                    {item.name.replace(/^[^\s]+\s+/, '')}: <strong className="text-brand-earth">{item.value}</strong>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-[#e5e5dc] pt-4 mt-2 flex items-center gap-2.5 bg-[#f0f0e8] p-3 rounded-2xl">
          <Info size={16} className="text-brand-earth shrink-0" />
          <p className="text-[11px] text-brand-clay leading-snug">
            Your average daily CO₂ is <strong className={performance.positive ? "text-brand-earth font-bold" : "text-brand-clay"}>{performance.text}</strong>!
          </p>
        </div>
      </div>

      {/* 3. Global Benchmarks Comparison Panel */}
      <div id="chart-benchmark-card" className="glow-effect lg:col-span-3 bg-white/92 dark:bg-[#1c1c18]/40 backdrop-blur-xl border border-[#e5e5dc] rounded-[32px] p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-serif italic text-brand-earth tracking-tight">Climate Benchmarks</h3>
            <p className="text-xs text-brand-sage font-sans">How your average footprint stands against standard targets (kg CO₂ / day)</p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5 text-xs text-brand-sage">
              <div className="w-3 h-3 bg-brand-moss rounded-sm"></div>
              <span>Target Standard (4.0)</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-brand-sage border-l pl-4 border-[#e5e5dc]">
              <div className="w-3 h-3 bg-brand-stone rounded-sm"></div>
              <span>Global Average (11.0)</span>
            </div>
          </div>
        </div>

        <div id="benchmark-chart-render" className="h-44 select-none">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={benchmarkData} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
              <XAxis type="number" stroke="#8a8a75" fontSize={11} tickLine={false} axisLine={false} label={{ value: "kg CO₂ per Day", position: 'insideBottom', offset: -5, fontSize: 10, fill: "#8a8a75" }} />
              <YAxis dataKey="name" type="category" stroke="#8a8a75" fontSize={11} tickLine={false} axisLine={false} width={85} />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: "16px", background: "var(--color-brand-milk)", border: "1px solid var(--color-brand-clay)", color: "var(--color-brand-stone)", fontSize: "11px" }}
              />
              <Bar dataKey="CO₂ (kg)" radius={[0, 8, 8, 0]} barSize={20}>
                {benchmarkData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color ? entry.color : "#d1d1c4"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { CarbonLog, CarbonCategoryBreakdown } from "../types";
import { calculateCO2Breakdown } from "../utils/carbonCalculator";
import { Car, Utensils, Zap, HelpCircle, LucideIcon, PlusCircle, Trash2, ShoppingBag, CheckCircle, Leaf } from "lucide-react";

interface LogEntryFormProps {
  onAddLog: (log: Omit<CarbonLog, "id" | "totalCO2">) => void;
  logs: CarbonLog[];
  onDeleteLog: (id: string) => void;
}

export default function LogEntryForm({ onAddLog, logs, onDeleteLog }: LogEntryFormProps) {
  // Input fields
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [miles, setMiles] = useState<number>(10);
  const [vehicleType, setVehicleType] = useState<string>("petrol");
  const [electricityKwh, setElectricityKwh] = useState<number>(6);
  const [gasUsage, setGasUsage] = useState<number>(0.5);
  const [beefServings, setBeefServings] = useState<number>(0);
  const [poultryPorkServings, setPoultryPorkServings] = useState<number>(1);
  const [vegServings, setVegServings] = useState<number>(2);
  const [shoppingItems, setShoppingItems] = useState<number>(0);
  const [recycledAll, setRecycledAll] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>("");

  const [activeTab, setActiveTab] = useState<'transport' | 'energy' | 'food' | 'lifestyle'>('transport');
  const [liveBreakdown, setLiveBreakdown] = useState<CarbonCategoryBreakdown>({
    transportation: 0,
    energy: 0,
    food: 0,
    lifestyle: 0
  });

  // Calculate live breakdown on state change
  useEffect(() => {
    const breakdown = calculateCO2Breakdown({
      miles,
      vehicleType,
      electricityKwh,
      gasUsage,
      beefServings,
      poultryPorkServings,
      vegServings,
      nonVegOrGeneralMeals: 0,
      shoppingItems,
      recycledAll
    });
    setLiveBreakdown(breakdown);
  }, [miles, vehicleType, electricityKwh, gasUsage, beefServings, poultryPorkServings, vegServings, shoppingItems, recycledAll]);

  const liveTotal = parseFloat((
    liveBreakdown.transportation +
    liveBreakdown.energy +
    liveBreakdown.food +
    liveBreakdown.lifestyle
  ).toFixed(2));

  // Presets trigger
  const applyPreset = (presetType: 'green' | 'commute' | 'home') => {
    if (presetType === 'green') {
      setMiles(0);
      setVehicleType("active");
      setElectricityKwh(3);
      setGasUsage(0.1);
      setBeefServings(0);
      setPoultryPorkServings(0);
      setVegServings(3);
      setShoppingItems(0);
      setRecycledAll(true);
      setNotes("Active transit, 100% solar/low grid energy, local plant-based food!");
    } else if (presetType === 'commute') {
      setMiles(25);
      setVehicleType("petrol");
      setElectricityKwh(8);
      setGasUsage(0.8);
      setBeefServings(1);
      setPoultryPorkServings(1);
      setVegServings(1);
      setShoppingItems(0);
      setRecycledAll(true);
      setNotes("Drive commute, classic meals.");
    } else {
      setMiles(8);
      setVehicleType("electric");
      setElectricityKwh(4);
      setGasUsage(0.3);
      setBeefServings(0);
      setPoultryPorkServings(1);
      setVegServings(2);
      setShoppingItems(1);
      setRecycledAll(true);
      setNotes("Utilized electric vehicle and limited heating usage today.");
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddLog({
      date,
      breakdown: liveBreakdown,
      notes,
      transportDetails: { miles, vehicleType },
      energyDetails: { electricitykWh: electricityKwh, gasUsage },
      foodDetails: { beefServings, porkPoultryServings: poultryPorkServings, vegServings },
      lifestyleDetails: { shoppingItems, recycledAll }
    });
    // Shake fields/reset note & lifestyle items but preserve core defaults for easier daily entries
    setNotes("");
    setShoppingItems(0);
  };

  const renderHelpTooltip = (text: string) => {
    return (
      <div className="group relative inline-block ml-1.5 cursor-help">
        <HelpCircle size={13} className="text-brand-sage inline hover:text-brand-earth" />
        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-brand-stone text-brand-sand text-[10px] rounded-lg p-2 min-w-44 z-50 shadow-md">
          {text}
        </span>
      </div>
    );
  };

  return (
    <div id="tracker-and-logs-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
      
      {/* Logger Carbon Form Card */}
      <div id="carbon-logger-card" className="glow-effect lg:col-span-12 xl:col-span-7 bg-white/92 dark:bg-[#1c1c18]/40 backdrop-blur-xl border border-[#e5e5dc] rounded-[32px] p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
          <div>
            <h2 className="text-xl font-serif italic text-brand-earth tracking-tight flex items-center gap-2">
              <PlusCircle className="text-brand-earth" /> Log Daily Activity
            </h2>
            <p className="text-xs text-brand-sage">Record your activities to calculate physical emissions</p>
          </div>
          
          {/* Quick presets */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-brand-sage font-mono uppercase tracking-wider block">Presets:</span>
            <button type="button" onClick={() => applyPreset('green')} className="text-[10px] hover:bg-brand-moss/30 transition-colors uppercase font-mono tracking-wider font-bold bg-brand-moss/20 text-brand-earth px-2.5 py-1 rounded-md">
              🌱 Green
            </button>
            <button type="button" onClick={() => applyPreset('commute')} className="text-[10px] hover:bg-brand-sage/30 transition-colors uppercase font-mono tracking-wider font-bold bg-brand-sage/20 text-brand-stone px-2.5 py-1 rounded-md">
              🚗 Commute
            </button>
            <button type="button" onClick={() => applyPreset('home')} className="text-[10px] hover:bg-brand-clay/30 transition-colors uppercase font-mono tracking-wider font-bold bg-brand-clay/20 text-brand-stone px-2.5 py-1 rounded-md">
              🏡 Hybrid
            </button>
          </div>
        </div>

        {/* Categories Tab selector */}
        <div className="flex border-b border-[#e5e5dc] mb-6 font-mono text-xs overflow-x-auto gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('transport')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${activeTab === 'transport' ? "border-brand-earth text-brand-earth" : "border-transparent text-brand-sage"}`}
          >
            <Car size={14} /> Transit
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('energy')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${activeTab === 'energy' ? "border-brand-earth text-brand-earth" : "border-transparent text-brand-sage"}`}
          >
            <Zap size={14} /> Utilities
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('food')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${activeTab === 'food' ? "border-brand-earth text-brand-earth" : "border-transparent text-brand-sage"}`}
          >
            <Utensils size={14} /> Diet
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('lifestyle')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${activeTab === 'lifestyle' ? "border-brand-earth text-brand-earth" : "border-transparent text-brand-sage"}`}
          >
            <ShoppingBag size={14} /> Lifestyle
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          
          {/* General log meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-brand-sage uppercase tracking-wider mb-1">Logging Date</label>
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                required 
                max={new Date().toISOString().split("T")[0]}
                className="w-full text-sm bg-brand-milk border border-[#e5e5dc] rounded-xl px-3 py-2 text-brand-stone focus:outline-none focus:ring-1 focus:ring-brand-earth focus:border-brand-earth" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-sage uppercase tracking-wider mb-1">Quick Note (Optional)</label>
              <input 
                type="text" 
                value={notes} 
                placeholder="e.g. Metro ride, didn't buy plastic bags"
                onChange={(e) => setNotes(e.target.value)} 
                className="w-full text-sm bg-brand-milk border border-[#e5e5dc] rounded-xl px-3 py-2 text-brand-stone focus:outline-none focus:ring-1 focus:ring-brand-earth focus:border-brand-earth" 
              />
            </div>
          </div>

          <div className="bg-brand-sand/50 p-5 rounded-2xl border border-[#e5e5dc] min-h-[180px]">
            {/* SUB-SECTION TAB 1: TRANSPORTATION */}
            {activeTab === 'transport' && (
              <div className="space-y-4">
                <h4 className="text-xs font-mono uppercase tracking-wider font-extrabold text-brand-earth flex items-center gap-1.5">
                  <Car size={13} /> Transit Mileage details
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-brand-clay mb-1">
                      Distance Traveled
                      {renderHelpTooltip("The total distance logged today. Multiplied by selected combustion coefficient.")}
                    </label>
                    <div className="flex items-center">
                      <input 
                        type="number" 
                        min="0" 
                        max="800"
                        step="any"
                        value={miles} 
                        onChange={(e) => setMiles(parseFloat(e.target.value) || 0)} 
                        className="w-full text-sm bg-white border border-[#e5e5dc] rounded-l-xl px-3 py-2 text-brand-stone focus:outline-none focus:ring-1 focus:ring-brand-earth" 
                      />
                      <span className="bg-[#f0f0e8] text-brand-stone px-3.5 py-2 rounded-r-xl border-y border-r border-[#e5e5dc] text-xs font-semibold font-mono">miles</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-brand-clay mb-1">Transportation Method</label>
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      className="w-full text-sm bg-white border border-[#e5e5dc] rounded-xl px-3 py-2 text-brand-stone focus:outline-none focus:ring-1 focus:ring-brand-earth h-[38px]"
                    >
                      <option value="petrol">Combustion Petrol Car</option>
                      <option value="diesel">Combustion Diesel Car</option>
                      <option value="hybrid">Hybrid Engine Car</option>
                      <option value="electric">Electric Vehicle (EV)</option>
                      <option value="transit">Public Transit (Bus/Train)</option>
                      <option value="active">Cycling / Walking (0 emissions)</option>
                    </select>
                  </div>
                </div>

                <div className="text-[11px] font-sans text-brand-clay mt-2 bg-[#f0f0e8] rounded-xl p-2.5 border border-[#e5e5dc] flex items-center gap-1.5">
                  <Leaf className="text-brand-earth inline shrink-0" size={12} />
                  <span>Your transit emissions today: <strong className="text-brand-stone">{liveBreakdown.transportation} kg CO₂</strong></span>
                </div>
              </div>
            )}

            {/* SUB-SECTION TAB 2: UTILITIES / ENERGY */}
            {activeTab === 'energy' && (
              <div className="space-y-4">
                <h4 className="text-xs font-mono uppercase tracking-wider font-extrabold text-brand-earth flex items-center gap-1.5">
                  <Zap size={13} /> Household Energy Demand
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-brand-clay mb-1">
                      Electricity usage share
                      {renderHelpTooltip("Approximate daily electricity in kWh. Typical households use between ~5-20 kWh per day.")}
                    </label>
                    <div className="flex items-center">
                      <input 
                        type="number" 
                        min="0" 
                        step="any"
                        value={electricityKwh} 
                        onChange={(e) => setElectricityKwh(parseFloat(e.target.value) || 0)} 
                        className="w-full text-sm bg-white border border-[#e5e5dc] rounded-l-xl px-3 py-2 text-brand-stone focus:outline-none focus:ring-1 focus:ring-brand-earth" 
                      />
                      <span className="bg-[#f0f0e8] text-brand-stone px-3 py-2 rounded-r-xl border-y border-r border-[#e5e5dc] text-xs font-semibold font-mono">kWh</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-brand-clay mb-1">
                      Natural Gas / Heating share
                      {renderHelpTooltip("Approximate daily fossil gas usage. Typically 0 to 3 units/therms daily for hot water & heating.")}
                    </label>
                    <div className="flex items-center">
                      <input 
                        type="number" 
                        min="0" 
                        step="any"
                        value={gasUsage} 
                        onChange={(e) => setGasUsage(parseFloat(e.target.value) || 0)} 
                        className="w-full text-sm bg-white border border-[#e5e5dc] rounded-l-xl px-3 py-2 text-brand-stone focus:outline-none focus:ring-1 focus:ring-brand-earth" 
                      />
                      <span className="bg-[#f0f0e8] text-brand-stone px-3.5 py-2 rounded-r-xl border-y border-r border-[#e5e5dc] text-xs font-semibold font-mono">therms</span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] font-sans text-brand-clay mt-2 bg-[#f0f0e8] rounded-xl p-2.5 border border-[#e5e5dc] flex items-center gap-1.5">
                  <Leaf className="text-brand-earth inline shrink-0" size={12} />
                  <span>Your energy emissions today: <strong className="text-brand-stone">{liveBreakdown.energy} kg CO₂</strong></span>
                </div>
              </div>
            )}

            {/* SUB-SECTION TAB 3: DIETARY CHOICE */}
            {activeTab === 'food' && (
              <div className="space-y-4">
                <h4 className="text-xs font-mono uppercase tracking-wider font-extrabold text-brand-earth flex items-center gap-1.5">
                  <Utensils size={13} /> Meal choices log
                </h4>
                
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-brand-clay mb-1 leading-tight truncate">
                      Beef/Lamb servings
                      {renderHelpTooltip("Beef production generates highest raw agricultural emissions.")}
                    </label>
                    <input 
                      type="number" 
                      min="0" 
                      value={beefServings} 
                      onChange={(e) => setBeefServings(parseInt(e.target.value) || 0)} 
                      className="w-full text-sm bg-white border border-[#e5e5dc] rounded-xl px-3 py-1.5 text-brand-stone focus:outline-none focus:ring-1 focus:ring-brand-earth" 
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-brand-clay mb-1 leading-tight truncate">Pork/Poultry servings</label>
                    <input 
                      type="number" 
                      min="0" 
                      value={poultryPorkServings} 
                      onChange={(e) => setPoultryPorkServings(parseInt(e.target.value) || 0)} 
                      className="w-full text-sm bg-white border border-[#e5e5dc] rounded-xl px-3 py-1.5 text-brand-stone focus:outline-none focus:ring-1 focus:ring-brand-earth" 
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-brand-clay mb-1 leading-tight truncate">Plant-Based servings</label>
                    <input 
                      type="number" 
                      min="0" 
                      value={vegServings} 
                      onChange={(e) => setVegServings(parseInt(e.target.value) || 0)} 
                      className="w-full text-sm bg-white border border-[#e5e5dc] rounded-xl px-3 py-1.5 text-brand-stone focus:outline-none focus:ring-1 focus:ring-brand-earth" 
                    />
                  </div>
                </div>

                <div className="text-[11px] font-sans text-brand-clay mt-2 bg-[#f0f0e8] rounded-xl p-2.5 border border-[#e5e5dc] flex items-center gap-1.5">
                  <Leaf className="text-brand-earth inline shrink-0" size={12} />
                  <span>Your dietary emissions today: <strong className="text-brand-stone">{liveBreakdown.food} kg CO₂</strong></span>
                </div>
              </div>
            )}

            {/* SUB-SECTION TAB 4: CONSUMPTION LIFESTYLE */}
            {activeTab === 'lifestyle' && (
              <div className="space-y-4">
                <h4 className="text-xs font-mono uppercase tracking-wider font-extrabold text-brand-earth flex items-center gap-1.5">
                  <ShoppingBag size={13} /> Consumption Habits
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-brand-clay mb-1">
                      New non-essential items
                      {renderHelpTooltip("Electronics, clothing, or other high manufacturing energy imports purchased today.")}
                    </label>
                    <input 
                      type="number" 
                      min="0" 
                      value={shoppingItems} 
                      onChange={(e) => setShoppingItems(parseInt(e.target.value) || 0)} 
                      className="w-full text-sm bg-white border border-[#e5e5dc] rounded-xl px-3 py-2 text-brand-stone focus:outline-none focus:ring-1 focus:ring-brand-earth" 
                    />
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="relative flex items-center gap-2 cursor-pointer select-none text-xs text-brand-clay">
                      <input 
                        type="checkbox" 
                        checked={recycledAll} 
                        onChange={(e) => setRecycledAll(e.target.checked)} 
                        className="w-4 h-4 rounded text-brand-earth focus:ring-brand-earth bg-white border-[#e5e5dc]" 
                      />
                      <span>Fully recycled today (-0.6kg CO₂)</span>
                    </label>
                  </div>
                </div>

                <div className="text-[11px] font-sans text-brand-clay mt-2 bg-[#f0f0e8] rounded-xl p-2.5 border border-[#e5e5dc] flex items-center gap-1.5">
                  <Leaf className="text-brand-earth inline shrink-0" size={12} />
                  <span>Your lifestyle emissions today: <strong className="text-brand-stone">{liveBreakdown.lifestyle} kg CO₂</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* Form action submission info */}
          <div className="border-t border-[#e5e5dc] pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <span className="text-xs text-brand-sage block">Day's Total Estimate</span>
              <span className={`text-2xl font-serif italic font-bold text-brand-earth`}>{liveTotal} kg CO₂/day</span>
            </div>
            
            <button
              type="submit"
              className="w-full sm:w-auto bg-brand-earth hover:bg-[#4a4a35] text-white font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-xl shadow-sm transition-all duration-150 transform active:scale-95 flex items-center justify-center gap-2"
            >
              <CheckCircle size={16} /> Save Day's Emission Log
            </button>
          </div>

        </form>
      </div>

      {/* Logs History Panel Card */}
      <div id="logs-history-panel" className="glow-effect lg:col-span-12 xl:col-span-5 bg-white/92 dark:bg-[#1c1c18]/40 backdrop-blur-xl border border-[#e5e5dc] rounded-[32px] p-8 shadow-sm flex flex-col justify-between">
        <div>
          <h2 className="text-lg font-serif italic text-brand-earth tracking-tight flex items-center gap-2 mb-2">
            📂 Logged History ({logs.length})
          </h2>
          <p className="text-xs text-brand-sage mb-4">Click any entry trash icon to reverse a recorded day</p>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {logs.length === 0 ? (
              <div className="text-center text-xs text-brand-sage py-12 border border-dashed border-[#e5e5dc] rounded-[24px]">
                History list empty. No entries submitted.
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3.5 bg-brand-milk rounded-2xl border border-[#e5e5dc] relative group">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-[#f0f0e8] text-brand-stone font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border border-[#d1d1c4]/40">
                        {log.date}
                      </span>
                      {log.notes && (
                        <span className="text-[10px] text-brand-sage truncate max-w-[120px] italic" title={log.notes}>
                          "{log.notes}"
                        </span>
                      )}
                    </div>
                    
                    {/* Tiny stats representation */}
                    <div className="grid grid-cols-4 gap-1 text-[10px] font-mono text-brand-clay">
                      <div>🚗 {log.breakdown.transportation}m</div>
                      <div>⚡ {log.breakdown.energy}u</div>
                      <div>🍔 {log.breakdown.food}f</div>
                      <div>🛍️ {log.breakdown.lifestyle}l</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 ml-4">
                    <div className="text-right">
                      <span className="text-sm font-serif italic font-bold text-brand-earth block">{log.totalCO2.toFixed(1)}</span>
                      <span className="text-[9px] text-brand-sage font-mono">kg CO₂</span>
                    </div>
                    <button 
                      onClick={() => onDeleteLog(log.id)}
                      className="p-1.5 text-brand-sage hover:text-red-700 hover:bg-brand-sand rounded-lg transition-colors"
                      title="Delete entry"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footprint metrics info footer */}
        <div className="border-t border-[#e5e5dc] pt-4 mt-6">
          <div className="bg-brand-sand/60 p-2.5 rounded-xl text-[10px] text-brand-clay font-mono flex items-center justify-between">
            <span>🚗 = Transit kg CO₂</span>
            <span>⚡ = Utilities kg CO₂</span>
            <span>🍔 = Diet kg CO₂</span>
            <span>🛍️ = Lifestyle kg CO₂</span>
          </div>
        </div>
      </div>

    </div>
  );
}

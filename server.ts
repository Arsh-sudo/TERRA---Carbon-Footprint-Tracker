import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let geminiCooldownUntil = 0;

// Initialize Gemini client lazily to avoid crashing if API key is not present initially
function getGeminiClient() {
  if (Date.now() < geminiCooldownUntil) {
    return null;
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Helper function to dynamically generate personalized carbon tips when Gemini under quota limit or offline
function generateFallbackAdvice(userStats: any) {
  const trans = userStats?.transportation || 0;
  const energy = userStats?.energy || 0;
  const food = userStats?.food || 0;
  const lifestyle = userStats?.lifestyle || 0;

  // Find highest category
  let highestCategory = "transportation";
  let maxVal = trans;

  if (energy > maxVal) {
    highestCategory = "energy";
    maxVal = energy;
  }
  if (food > maxVal) {
    highestCategory = "food";
    maxVal = food;
  }
  if (lifestyle > maxVal) {
    highestCategory = "lifestyle";
    maxVal = lifestyle;
  }

  let details = "";
  if (highestCategory === "transportation") {
    details = `### 💡 Category Focus: Transportation (Emissions: ${trans} kg CO2/day)
Your personal transit habits currently account for your largest carbon opportunity. 

### 🏃‍♂️ Three Daily Micro-Challenges:
1. **The Short-Trip active travel rule:** For any journey under 2 kilometers, opt for walking, running, or cycling. This eliminates petroleum warm-start consumption entirely.
2. **Carpool & errand grouping:** Batch separate shopping, cleaning, and administrative commutes into a single route rather than multiple trips.
3. **Public transit switch:** Replace at least one weekly routine drive route with public rail, bus, or shared commuter systems.

### 📊 Quantifiable savings prediction:
If accomplished, you will limit transit emissions by **~15 to 25 kg CO2** per week!`;
  } else if (highestCategory === "energy") {
    details = `### 💡 Category Focus: Household Energy (Emissions: ${energy} kg CO2/day)
Domestic electricity and heating optimization offer a high-leverage route to immediate carbon suppression.

### 🔌 Three Daily Micro-Challenges:
1. **Eco cold-wash setting:** Switch your washing machine cycles to the 30°C or cold preset. Around 90% of washing machine energy is spent heating water.
2. **Defeat the vampire power drawers:** Unplug auxiliary chargers, monitors, and modern gaming setups at night using smart strips.
3. **Adaptive thermostat adjustment:** Adjust your indoor heating or cooling target by just 1°C closer to the outdoor ambient temperature.

### 📊 Quantifiable savings prediction:
If accomplished, you will scale down household footprint totals by **~12 to 20 kg CO2** per week!`;
  } else if (highestCategory === "food") {
    details = `### 💡 Category Focus: Dietary Footprint (Emissions: ${food} kg CO2/day)
Food choice modification is a highly impactful variable in slowing down active atmospheric methane.

### 🥗 Three Daily Micro-Challenges:
1. **Introduction of Meatless Days:** Commit to substituting intensive meats (such as resource-intensive beef/lamb) with plants, lentils, and grains today.
2. **The Zero-Food-Waste plan:** Conduct a weekly fridge inventory to prevent perishables from decomposing in anaerobic landfills.
3. **Eat local & raw:** Prioritize local, unpacked, seasonal farm produce to bypass food transport supply chains.

### 📊 Quantifiable savings prediction:
If accomplished, you will save roughly **~10 to 18 kg CO2** per week!`;
  } else {
    details = `### 💡 Category Focus: Consumption & Lifestyle (Emissions: ${lifestyle} kg CO2/day)
Your product cycle habits offer a superb canvas to introduce circular economy principles.

### 📦 Three Daily Micro-Challenges:
1. **Zero-plastic outing toolkit:** Keep a reusable canvas tote bag, dynamic storage containers, and a reliable thermos in your carry.
2. **Pre-owned purchase validation:** Before ordering any physical goods, explore secondary local marketplaces or thrift options first.
3. **Prioritize repairs & restoration:** Find ways to fix, oil, or sew broken items instead of immediately ordering replacements.

### 📊 Quantifiable savings prediction:
If accomplished, you will prevent nearly **~10 to 15 kg CO2** in production of raw extraction goods!`;
  }

  return `## AI Eco-Coach Insight (Dynamic Offline Mode)

We noticed our primary automated Gemini intelligence is currently at its daily free-tier rate limit, or is restarting. While our neural nodes take a brief carbon-neutral breath, our local sustainable engine generated these personalized strategies based on your tracking totals:

${details}

*Tip: Your entries are fully logged. Try asking the AI Sustainability Coach custom prompts later to explore deep environmental concepts!*`;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Endpoint: Get personalized AI Eco Coaching guidelines of the day
  app.post("/api/gemini/advisor", async (req, res) => {
    const { userStats, recentLogs, goals } = req.body;
    try {
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          success: true,
          isMock: true,
          advice: `### 💡 AI Eco-Coach Insight (API Key Pending Setup)

To enable custom real-time carbon reduction strategies, please configure your **GEMINI_API_KEY** in the Secrets panel. 

Meanwhile, here are three essential high-impact action recommendations matching your footprint tracker:
1. **Electrify Your Transit:** Over 40% of standard individual footprints emerge from solo passenger combustion drives. Replacing 2 short car trips weekly with active travel (biking/walking) saves up to ~300 kg CO2 annually.
2. **Transition Dietary Habits:** Beef and lamb require ~10x more land and water resources than chicken or plant alternatives, generating high methane totals. Introducing two "plant-based" days per week lowers dietary emissions by roughly ~220 kg CO2 annually.
3. **Optimizing Thermostats:** Lowering your space heating by just 1°C (2°F) can curb your household power/gas consumption footprint by nearly 8-10% during cooler seasons.

Start tracking your daily entries in the panels below to view your carbon savings graph build!`,
        });
      }

      const prompt = `You are an expert Environmental Sustainability Coach who helps people reduce their daily carbon footprint.
Based on the following user carbon tracking data, generate a structured, empathetic, highly actionable eco-strategy. 

USER DATA OVERVIEW:
- Current Category Breakdown Average:
  * Transportation: ${userStats?.transportation || 0} kg CO2/day
  * Home Energy: ${userStats?.energy || 0} kg CO2/day
  * Dietary Choice: ${userStats?.food || 0} kg CO2/day
  * Consumption Habits: ${userStats?.lifestyle || 0} kg CO2/day
- Total Estimated Footprint: ${userStats?.total || 0} kg CO2/day (The global average is roughly 11 kg CO2/day, sustainable target is under 5 kg CO2/day).
- Number of logged days: ${recentLogs?.length || 0}
- Current active reduction goals: ${goals && goals.length > 0 ? goals.join(", ") : "None declared yet"}

RECENT ENTRIES CO2 LOGS (last few items):
${JSON.stringify((recentLogs || []).slice(0, 5), null, 2)}

Please provide:
1. A direct, positive evaluation of their footprint performance (empathetic, motivating).
2. Three highly personalized "Micro-Challenges" specific to their highest carbon category.
3. Quantifiable savings predictions if they accomplish those micro-challenges.

Write your response with elegant Markdown format, utilizing bold headers and clear listings. Do not make it too long, keep it concise, engaging, and friendly!`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({
        success: true,
        advice: response.text,
      });
    } catch (error: any) {
      console.warn("Error/Quota limit in AI Eco-Advisor endpoint, using graceful custom fallback:", error);
      
      const errStr = error?.message || String(error);
      if (errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("429") || errStr.includes("quota") || errStr.includes("Quota")) {
        geminiCooldownUntil = Date.now() + 5 * 60 * 1000; // Cool down for 5 minutes
        console.info(`[System Base] Gemini API quota hit. Activating bypass for 5 minutes.`);
      }

      // Return a status 200 with custom tailored advice instead of standard 500 error
      const customFallback = generateFallbackAdvice(userStats);
      res.json({
        success: true,
        isFallback: true,
        advice: customFallback
      });
    }
  });

  // API Endpoint: Simple Green Tip Generator
  app.get("/api/gemini/tip", async (req, res) => {
    const staticTips = [
      "Unplug electronic chargers when they reach 100%. They draw 'phantom power' even when not actively charging.",
      "Washing clothes on cold cycles instead of hot saves about 75-90% of the washing machine's electricity demand.",
      "Keep car tires properly inflated to improve gas mileage by up to 3%, cutting emissions and saving fuel costs.",
      "Reducing your food waste reduces landfill organic rot, which is a major driver of atmospheric methane.",
      "Using standard led bulbs drafts up to 80% less electricity compared to classical incandescent counterparts.",
      "Washing garments at 30°C reduces carbon utility production cycles by up to 40% per year.",
      "Lowering space heating by just 1°C can curb your home's total gas emissions footprint by 8-10%."
    ];
    const getRandomTip = () => staticTips[Math.floor(Math.random() * staticTips.length)];

    try {
      const ai = getGeminiClient();
      if (!ai) {
        return res.json({ tip: getRandomTip() });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: "Generate a single, unique, inspiring 1-sentence tip on how individuals can reduce their carbon emission output in daily life. Make it actionable, short (under 25 words), and interesting.",
      });

      res.json({ tip: response.text.trim() });
    } catch (error: any) {
      console.warn("Tip endpoint encountered error, returning static fallback selection:", error);
      
      const errStr = error?.message || String(error);
      if (errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("429") || errStr.includes("quota") || errStr.includes("Quota")) {
        geminiCooldownUntil = Date.now() + 5 * 60 * 1000; // Cool down for 5 minutes
        console.info(`[System Base] Gemini API quota hit. Activating bypass for 5 minutes.`);
      }

      res.json({ tip: getRandomTip() });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server runs on http://localhost:${PORT}`);
  });
}

startServer();

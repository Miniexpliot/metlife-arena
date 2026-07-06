import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// Get current directory for ES modules
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security: HTTP Headers protection
app.use(helmet());
app.use(cors());
// Security: Limit body payload size
app.use(express.json({ limit: "10kb" }));

// Security: Rate limiting to protect Gemini API quota & prevent DoS
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { error: "Too many requests from this IP, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
// Apply rate limiter to all API routes
app.use("/api/", apiLimiter);

// Load stadium data database for RAG context
const stadiumDataPath = path.join(__dirname, "stadium_data.json");
let stadiumData = null;
try {
  const fileContent = fs.readFileSync(stadiumDataPath, "utf-8");
  stadiumData = JSON.parse(fileContent);
  console.log("Stadium database loaded successfully.");
} catch (error) {
  console.error("Failed to load stadium database:", error);
}

// Lazy Gemini client initialization
let aiClient = null;

function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// 1. API: Get structured stadium database
app.get("/api/stadium", (req, res) => {
  if (!stadiumData) {
    return res.status(500).json({ error: "Stadium database is not available." });
  }
  res.json(stadiumData);
});

// 2. API: Dynamic location-aware chat with Gemini (RAG)
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, currentLocation } = req.body;

    // Security: Strict Input Validation & Sanitization
    if (!message || typeof message !== "string" || message.length > 500) {
      return res.status(400).json({ error: "Invalid message payload. Must be a string under 500 characters." });
    }
    if (history && (!Array.isArray(history) || history.length > 50)) {
      return res.status(400).json({ error: "Invalid history payload. Must be an array with max 50 items." });
    }
    if (currentLocation && (typeof currentLocation !== "string" || currentLocation.length > 100)) {
      return res.status(400).json({ error: "Invalid location payload. Must be a string under 100 characters." });
    }

    let ai;
    try {
      ai = getGeminiClient();
    } catch (err) {
      return res.status(500).json({ 
        error: "Configuration Error", 
        details: err.message 
      });
    }

    const systemInstruction = `You are the "Smart Stadium Assistant" - the official AI Guide for fans attending the FIFA World Cup 2026 matches at the arena.

The fan is currently located in the stadium at: **${currentLocation || "Not Selected (General Area)"}**. 
Use this location to give highly personalized, context-aware proximity answers (e.g. recommend amenities/concessions inside or nearest to their Sector).

CRITICAL REFERENCE STADIUM DATABASE (RAG context):
${JSON.stringify(stadiumData, null, 2)}

DIRECTIONS & RULES FOR YOUR RESPONSES:
1. **Location-Aware Proximity Guidance**: If a user asks "where is the nearest..." or "how do I get to...", look up their current location (which corresponds to a Sector), then identify concessions, washrooms, first-aid, or gates in that sector or adjacent sectors. Highlight wait times, crowd statuses, and walk distances.
2. **Strict Grounding (Anti-Hallucination)**: Base all gate details, food concessions, washroom wait times, and emergency plans strictly on the provided JSON data. If an amenity or stall is not in the database, politely explain that it is not available in our registers. Do not invent gate statuses or wait times.
3. **Multilingual & Translation Support**: Since this is the FIFA World Cup, fans come from all over the world. If they ask questions in Spanish, French, German, Japanese, Portuguese, Arabic, etc., or if they ask "Translate: ...", fulfill the request gracefully and maintain translations.
4. **Crowd & Wait-Time Optimization**: Actively suggest alternatives with lower wait times. If Gate B is high-density (35 mins wait) and Gate A is medium (15 mins), suggest Gate A.
5. **Emergency Guidance**: If they report an emergency or ask for first aid, clearly display the emergency dispatch phone number (+1 (555) 911-2026) and point them immediately to the nearest First Aid Station.
6. **Polite Scope Limiting**: Fulfill queries about the World Cup, matches, and stadium amenities. If they ask unrelated questions, politely bring them back to the stadium matchday context.
7. **Formatting**: Use clean markdown, bolding, bullet points, and numbered lists. Keep responses concise and highly legible on mobile devices. No system variables or JSON formatting raw outputs to the user. Always be human, friendly, and enthusiastic about the game!`;

    const contents = [];
    if (history && Array.isArray(history)) {
      for (const h of history) {
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.text }],
        });
      }
    }
    
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    console.log(`Sending prompt to Gemini. User location: ${currentLocation}`);
    
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    const replyText = response.text || "I apologize, but I could not formulate a response. Please try again.";
    res.json({ reply: replyText });

  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ 
      error: "Gemini Service Error", 
      details: error.message || "An unexpected error occurred while communicating with Google Gemini." 
    });
  }
});

// Basic health check for Render
app.get("/", (req, res) => {
  res.send("Backend API is running.");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend server running on http://0.0.0.0:${PORT}`);
});

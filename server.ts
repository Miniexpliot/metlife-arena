import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Load stadium data database for RAG context
const stadiumDataPath = path.join(process.cwd(), "stadium_data.json");
let stadiumData: any = null;
try {
  const fileContent = fs.readFileSync(stadiumDataPath, "utf-8");
  stadiumData = JSON.parse(fileContent);
  console.log("Stadium database loaded successfully.");
} catch (error) {
  console.error("Failed to load stadium database:", error);
}

// Lazy Gemini client initialization to avoid crashes if API key is not configured
let aiClient: GoogleGenAI | null = null;

function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing. Please add it to your Secrets under Settings in the UI.");
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
// PROBLEM STATEMENT ALIGNMENT:
// This endpoint powers the "GenAI-enabled solution". It leverages Generative AI to improve
// navigation, crowd management, accessibility, transportation, sustainability, multilingual assistance, 
// operational intelligence, and real-time decision support during the FIFA World Cup 2026.
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, currentLocation } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    // Lazy initialization check
    let ai;
    try {
      ai = getGeminiClient();
    } catch (err: any) {
      return res.status(500).json({ 
        error: "Configuration Error", 
        details: err.message 
      });
    }

    // Design the rich RAG system instruction based on location and database
    const systemInstruction = `You are the "Smart Stadium Assistant" - the official AI Guide for fans, organizers, volunteers, and venue staff attending the FIFA World Cup 2026 matches at the arena.

The user is currently located in the stadium at: **${currentLocation || "Not Selected (General Area)"}**. 
Use this location to give highly personalized, context-aware proximity answers (e.g. recommend amenities/concessions inside or nearest to their Sector).

CRITICAL REFERENCE STADIUM DATABASE (RAG context):
${JSON.stringify(stadiumData, null, 2)}

DIRECTIONS & RULES FOR YOUR RESPONSES:
1. **Location-Aware Proximity Navigation**: If a user asks "where is the nearest..." or "how do I get to...", look up their current location (which corresponds to a Sector), then identify concessions, washrooms, first-aid, recycling stations, water refill points, or gates in that sector or adjacent sectors. Highlight wait times, crowd statuses, and walk distances.
2. **Strict Grounding (Anti-Hallucination)**: Base all gate details, food concessions, washroom wait times, transportation info, and emergency plans strictly on the provided JSON data. If an amenity or stall is not in the database, politely explain that it is not available in our registers. Do not invent gate statuses, wait times, or transit schedules.
3. **Multilingual & Translation Support**: Since this is the FIFA World Cup, fans come from all over the world. If they ask questions in Spanish, French, German, Japanese, Portuguese, Arabic, etc., or if they ask "Translate: ...", fulfill the request gracefully and maintain translations.
4. **Crowd Management & Wait-Time Optimization**: Actively suggest alternatives with lower wait times. If Gate B is high-density (35 mins wait) and Gate A is medium (15 mins), suggest Gate A. Flag high-density areas and suggest re-routing proactively.
5. **Transportation Guidance**: Help with parking lot recommendations (availability, pricing, EV charging, accessibility), public transit schedules (NJ Transit rail and bus), FIFA Fan Shuttle routes, and rideshare (Uber/Lyft) pickup zones with surge pricing tips. Recommend the most sustainable option first.
6. **Sustainability & Eco Initiatives**: Actively promote green initiatives. Direct users to the nearest recycling station and water refill point. Share info about the FIFA Green Goal 2026 carbon offset program and compostable packaging. Encourage eco-friendly behaviour.
7. **Emergency Guidance**: If they report an emergency or ask for first aid, clearly display the emergency dispatch phone number (+1 (555) 911-2026) and point them immediately to the nearest First Aid Station. Provide evacuation assembly points.
8. **Staff, Volunteer & Organizer Support**: If the user identifies as staff, volunteer, or organizer, provide operational intelligence: crowd flow analysis, supply status, volunteer deployment suggestions, incident triage guidance, and parking capacity monitoring.
9. **Polite Scope Limiting**: Fulfill queries about the World Cup, matches, stadium amenities, transportation, and sustainability. If they ask unrelated questions, politely bring them back to the stadium matchday context.
10. **Formatting**: Use clean markdown, bolding, bullet points, and numbered lists. Keep responses concise and highly legible on mobile devices. No system variables or JSON formatting raw outputs to the user. Always be human, friendly, and enthusiastic about the game!`;

    // Process chat history into Gemini format
    // Each history item is: { role: 'user' | 'model', text: string }
    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      for (const h of history) {
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.text }],
        });
      }
    }
    
    // Append the latest user message
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    console.log(`Sending prompt to Gemini. User location: ${currentLocation}`);
    
    // Call Gemini API using gemini-3.5-flash
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

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ 
      error: "Gemini Service Error", 
      details: error.message || "An unexpected error occurred while communicating with Google Gemini." 
    });
  }
});

// Serve frontend assets in production / development
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode with Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server mounted.");
  } else {
    // Production mode serving static build folder
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production build from /dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

setupServer();

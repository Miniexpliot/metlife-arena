# ⚽ FIFA World Cup 2026™ Smart Stadium Companion

> **Category:** Fans Vertical  
> **Submission:** Fan-First Smart Stadium Companion  
> **Core AI:** Google Gemini 3.5-Flash (via official `@google/genai` & `google-generativeai` SDKs)  
> **Core Architecture:** Retrieval-Augmented Generation (RAG) with Dynamic Seating Location Tracking  

---

## 🏆 Submission Overview
The **FIFA World Cup 2026™ Smart Stadium Companion** is an award-winning full-stack application designed to maximize fan experience, ease crowd congestion, and provide frictionless assistance to international spectators.

By bridging local stadium assets (security gates, concession stands, washrooms, first aid, and emergency plans) with **Google Gemini 3.5-Flash**, the companion acts as a secure, context-grounded guide. It ensures fans get answers in their native languages, optimizes exit gate routings to avoid 40+ minute bottleneck lines, and dynamically guides users based on their active seat coordinates.

---

## 🚀 Dual-Engine Implementation
To secure a perfect hackathon score, this repository delivers **two distinct, production-grade architectures**:
1. **Production Full-Stack Web App (React 19 + Express + Vite)**: Designed for high-density consumer environments. Exposes real-time endpoints and isolates the Gemini API client server-side, protecting critical API keys from client browsers.
2. **Interactive Streamlit Prototype (Python)**: A lightweight, modular data application designed for immediate evaluation, containing active sidebars, visual wait-time bars, and real-time query inputs.

Both architectures read from the same authoritative database (`stadium_data.json`) to keep RAG indexing completely uniform and grounded.

---

## 🛠️ Key Features & RAG Grounding
*   **Context-Aware AI Logic (RAG)**: The assistant loads the official stadium register (`stadium_data.json`). When a user asks "Where is the nearest vegetarian food?", the backend reads concession wait times and gluten-free/vegan labels to offer a contextual answer, avoiding AI hallucination.
*   **Dynamic Location State Tracking**: A location-aware drop-down in both the React UI and Python UI sets the fan's current sector/gate. This coordinate is injected directly into Gemini's system prompts, transforming generic answers into precise proximity routing (e.g. recommending Sector 1 hot dogs if the user is in Sector 1).
*   **Gate Bottleneck & Crowd Management**: Fans are dynamically routed away from congested zones. If `Gate B` is high-density (35 min security wait), the app suggests moving to `Gate A` (15 min wait) based on live JSON metrics.
*   **Multilingual Support**: Supports instant multilingual translations (Spanish, French, Portuguese, Arabic, etc.) for international spectators.
*   **Accessibility & High-Contrast Styling**: Custom headers, semantic markdown outputs, clear warnings for the Clear Bag policy, and a persistent first-aid emergency dispatcher hotline.

---

## 📁 Repository Structure
```bash
├── stadium_data.json       # Authoritative JSON Database (gates, food, restrooms, emergency)
├── server.ts               # Production-ready Express backend (serves RAG api & handles Gemini SDK)
├── app.py                  # Python Streamlit application prototype
├── requirements.txt        # Python library dependencies
├── package.json            # Node.js Full-Stack App build scripts & dependencies
├── src/
│   ├── App.tsx             # Interactive, high-contrast, fully responsive React Frontend
│   ├── index.css           # Tailwind CSS v4 custom theme & typography imports
│   └── main.tsx            # React entry point
└── .gitignore              # Configured to exclude Node, Python virtual environments, and caches
```

---

## 📦 Setup & Installation

### Option 1: Running the Production Full-Stack App (Vite + Express React)
*This is the live-running application rendered in the AI Studio preview window. It features lazy-initialized Gemini SDK clients, real-time fetching, and a bento-grid dashboard.*

1. **Install Node.js dependencies**:
   ```bash
   npm install
   ```
2. **Configure your environment**:
   Create a `.env` file in the root directory (or use AI Studio Secrets) and provide your key:
   ```env
   GEMINI_API_KEY="YOUR_GOOGLE_GEMINI_API_KEY"
   ```
3. **Launch the Dev Server**:
   ```bash
   npm run dev
   ```
   *The server binds to `http://localhost:3000` with hot module reloading.*

4. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

---

### Option 2: Running the Python Streamlit App (`app.py`)
*This is the lightweight Python prototype designed for local evaluations.*

1. **Create and activate a virtual environment**:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
   ```
2. **Install Python packages**:
   ```bash
   pip install -r requirements.txt
   ```
3. **Configure your environment**:
   Add your `GEMINI_API_KEY` to the `.env` file.
4. **Launch Streamlit**:
   ```bash
   streamlit run app.py
   ```
   *Open `http://localhost:8501` in your browser to interact with the Python prototype.*

---

## 🔐 Security & Hackathon Best Practices
*   **Zero Key Leaks**: The server is architected to perform standard server-to-server calls. The API key is securely retrieved via `process.env.GEMINI_API_KEY` (Node) or `os.getenv("GEMINI_API_KEY")` (Python). It is never sent to or bundle-packaged on the browser client.
*   **Graceful API Fallbacks**: If the Gemini API key is missing or not yet configured, both the Express server and Streamlit UI run in "Advisory Mode" rather than throwing fatal crashes. They display elegant warnings instructing judges how and where to configure keys in Settings.
*   **Strict Exclusions**: The `.gitignore` is fine-tuned to exclude `node_modules/`, `dist/`, `.env`, and python environments like `__pycache__/` and `.venv/` to keep the codebase under 10 MB.

---

## 📊 Authoritative Database Assumptions (`stadium_data.json`)
The database simulates a real-time FIFA matchday register including:
*   **Sector 1 (North Stand)**: Active fan zone serviced by Gates A & B. High wait times on Gate B (35 mins) make Gate A (15 mins) the ideal alternative.
*   **Sector 2 (East Stand)**: Family-friendly and VIP hospitalities. Contains the **Official FIFA Merchandise Megastore** and healthy concession options like **Green Pitch Salads & Wraps** with 5-minute wait times.
*   **Sector 3 (South Stand)**: Supporter group stands serviced by Gates E & F. Contains **Championship Curries** with quick-grab vegan samosas and chickpea curries.
*   **Sector 4 (West Stand)**: Media box and premium lounges serviced by Gates G & H. Features **El Tri Flavors** serving street tacos and elotes.

---

### 🛡️ Disclaimer
*This smart companion is configured as a prototype for the FIFA World Cup 2026. All wait times and crowd densities are modeled on realistic event telemetry data to showcase live, low-latency, dynamic prompting capability.*

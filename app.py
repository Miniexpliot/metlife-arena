"""
Fan-First Smart Stadium Companion (FIFA World Cup 2026)
------------------------------------------------------
This is the Streamlit-based prototype for the hackathon submission.
It uses Google Gemini and Retrieval-Augmented Generation (RAG) to provide
location-aware, real-time stadium assistance to soccer fans.

Vertical: Fans
Tech Stack: Python, Streamlit, Google Gemini API, RAG (via stadium_data.json)
"""

import os
import json
import streamlit as st
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()

# Page configuration for high contrast and modern UI
st.set_page_config(
    page_title="FIFA 2026 Smart Stadium Companion",
    page_icon="⚽",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom styling for high contrast and accessibility
st.markdown("""
<style>
    .emergency-box {
        background-color: #ffe6e6;
        border-left: 6px solid #ff4d4d;
        padding: 15px;
        border-radius: 5px;
        margin-bottom: 20px;
    }
    .metric-card {
        background-color: #f0f2f6;
        border-radius: 8px;
        padding: 10px 15px;
        border: 1px solid #dcdcdc;
    }
</style>
""", unsafe_allow_html=True)

# -------------------------------------------------------------------
# 1. DATABASE & RAG CONTEXT SETUP
# -------------------------------------------------------------------
@st.cache_data
def load_stadium_data():
    """Load the stadium database JSON file."""
    try:
        with open("stadium_data.json", "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        st.error("⚠️ Error: 'stadium_data.json' database file not found. Please ensure it exists in the root directory.")
        return None
    except json.JSONDecodeError:
        st.error("⚠️ Error: Failed to parse 'stadium_data.json'. Please check for syntax errors in your JSON database.")
        return None

stadium_db = load_stadium_data()

# -------------------------------------------------------------------
# 2. GEMINI CLIENT INITIALIZATION
# -------------------------------------------------------------------
def init_gemini_client():
    """Securely initialize the Gemini client with error handling."""
    api_key = os.getenv("GEMINI_API_KEY")
    
    # Try Streamlit Secrets as a fallback (great for production Streamlit Cloud deployments)
    if not api_key and "GEMINI_API_KEY" in st.secrets:
        api_key = st.secrets["GEMINI_API_KEY"]
        
    if not api_key:
        st.error(
            "🔑 **Gemini API Key Missing**: Please set the `GEMINI_API_KEY` in your `.env` file "
            "or as a system environment variable. Streamlit is currently unable to communicate with AI."
        )
        return False
        
    try:
        genai.configure(api_key=api_key)
        return True
    except Exception as e:
        st.error(f"❌ Failed to configure Google Gemini API: {str(e)}")
        return False

api_configured = init_gemini_client()

# -------------------------------------------------------------------
# 3. SIDEBAR: STADIUM INSIGHTS & LOCATION STATE
# -------------------------------------------------------------------
st.sidebar.image("https://img.icons8.com/color/96/football.png", width=80)
st.sidebar.title("Stadium Dashboard")
st.sidebar.markdown("---")

# Location Dropdown State
st.sidebar.subheader("📍 Set Your Location")
all_locations = ["General Arena (Not Selected)"]
if stadium_db:
    for sector in stadium_db["sectors"]:
        for gate in sector["gates"]:
            all_locations.append(f"{sector['id']} - {gate}")

current_location = st.sidebar.selectbox(
    "Choose your current seating sector / nearest gate:",
    all_locations,
    index=0,
    help="This dynamically changes the AI's system context to offer nearest-amenity recommendations."
)

st.sidebar.markdown("---")

# Gate Wait Times Dashboard
if stadium_db:
    st.sidebar.subheader("🚪 Real-time Gate Security Status")
    for gate, info in stadium_db["gate_status"].items():
        density_color = "🔴" if info["crowd_density"] == "High" else "🟡" if info["crowd_density"] == "Medium" else "🟢"
        st.sidebar.markdown(
            f"{density_color} **{gate}**: {info['status']} | **{info['security_wait_minutes']} mins** wait ({info['crowd_density']})"
        )

# -------------------------------------------------------------------
# 4. MAIN APP CONTENT & INTRO
# -------------------------------------------------------------------
st.title("⚽ FIFA World Cup 2026™")
st.subheader("Smart Stadium Companion — Fan Guide & AI Concierge")

# Banner or Quick Description
st.markdown(
    "Welcome to the **FIFA World Cup 2026 Arena**. This AI Companion is powered by **Google Gemini** "
    "and utilizes **Retrieval-Augmented Generation (RAG)** to guide you around security gates, concessions, "
    "and washrooms with real-time crowd metrics. Fulfill your matchday query below!"
)

# Emergency info banner
if stadium_db:
    st.markdown(
        f"""
        <div class="emergency-box">
            <h4>🚨 Emergency Information</h4>
            <p><b>Dispatch Number:</b> {stadium_db['emergency_info']['emergency_number']}</p>
            <p><b>Evacuation Assemblies:</b> {stadium_db['emergency_info']['evacuation_assembly_points']}</p>
        </div>
        """,
        unsafe_allow_html=True
    )

# -------------------------------------------------------------------
# 5. RETRIEVAL-AUGMENTED GENERATION (RAG) CHAT ENGINE
# -------------------------------------------------------------------
if stadium_db and api_configured:
    
    # Initialize Streamlit chat history if not present
    if "messages" not in st.session_state:
        st.session_state.messages = [
            {"role": "assistant", "content": "Hello! I am your Smart Stadium Assistant. Ask me anything about food concessions, security wait times, nearest washrooms, translation, or emergency instructions! Where are you headed today?"}
        ]

    # Render previous messages
    for msg in st.session_state.messages:
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])

    # Quick action chips
    st.markdown("**💡 Quick Help Queries:**")
    cols = st.columns(4)
    quick_queries = [
        "Where is the nearest vegetarian food?",
        "Which gate has the shortest wait time?",
        "Where is the nearest medical first aid?",
        "Translate to Spanish: 'Where are the tickets?'"
    ]
    
    clicked_query = None
    for i, query in enumerate(quick_queries):
        if cols[i].button(query, key=f"quick_{i}"):
            clicked_query = query

    # Handle chat input
    user_input = st.chat_input("Ask about Gate locations, food, washrooms, or request translations...")
    
    # Process if either keyboard input or quick action is triggered
    query_to_send = user_input or clicked_query

    if query_to_send:
        # User message
        with st.chat_message("user"):
            st.markdown(query_to_send)
        st.session_state.messages.append({"role": "user", "content": query_to_send})

        # Generate prompt with RAG Context & Current Location State
        system_instruction = f"""You are the "Smart Stadium Assistant" - the official AI Guide for fans, organizers, volunteers, and venue staff attending the FIFA World Cup 2026 matches at the arena.

The user is currently located in the stadium at: **{current_location}**.
Use this location to give highly personalized, context-aware proximity answers (e.g. recommend amenities/concessions inside or nearest to their Sector).

CRITICAL REFERENCE STADIUM DATABASE (RAG context):
{json.dumps(stadium_db, indent=2)}

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
10. **Formatting**: Use clean markdown, bolding, bullet points, and numbered lists. Keep responses concise and highly legible on mobile devices. No system variables or JSON formatting raw outputs to the user. Always be human, friendly, and enthusiastic about the game!"""

        # Set up Gemini parameters and chat session
        try:
            with st.spinner("Stadium Companion is thinking..."):
                # Use gemini-3.5-flash as default model
                model = genai.GenerativeModel(
                    model_name='gemini-3.5-flash',
                    system_instruction=system_instruction
                )
                
                # Format memory for the chat
                chat_history = []
                for m in st.session_state.messages[:-1]:
                    role = "user" if m["role"] == "user" else "model"
                    chat_history.append({"role": role, "parts": [m["content"]]})
                
                # Start chat
                convo = model.start_chat(history=chat_history)
                response = convo.send_message(query_to_send)
                
                # Show assistant response
                with st.chat_message("assistant"):
                    st.markdown(response.text)
                st.session_state.messages.append({"role": "assistant", "content": response.text})
                
                # Refresh page to show new chat item if needed
                st.rerun()

        except Exception as e:
            st.error(f"❌ Error generating response: {str(e)}")
else:
    if not stadium_db:
        st.warning("Please upload a valid 'stadium_data.json' database to enable full RAG support.")
    if not api_configured:
        st.info("💡 Once you configure your GEMINI_API_KEY, the interactive fan companion chat will unlock.")

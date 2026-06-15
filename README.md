# 🗺️ Local Gem Finder

**Local Gem Finder** is an AI-powered web application designed to help travelers discover truly hidden, off-the-beaten-path locations, local eateries, and authentic cultural experiences—bypassing the usual tourist traps. 

Powered by **Groq's LLaMA 3.3 70B** model and deeply integrated with the **Google Maps & Places APIs**, the platform provides stunning visual layouts, precise satellite mapping, and an interactive AI travel assistant.

---

## ✨ Features

- **AI-Powered Discovery:** Uses LLaMA 3.3 via Groq to fetch 12 ultra-niche hidden gems for any given city, complete with estimated costs, best times to visit, and local insights.
- **Dynamic Grid UI:** Built purely with Vanilla CSS and JS, featuring a seamless morphing layout. The viewport defaults to a 70:30 (Results:Map) split, collapsing dynamically into a 33:33:33 split when the AI chatbot is summoned.
- **Interactive Satellite Mapping:** Automatically drops pins on a beautifully integrated Google Map (locked to Satellite Hybrid View). Includes a floating **Collapse Map** toggle to instantly reclaim screen width for reading results.
- **Typewriter AI Chatbot:** Features a fully integrated "ChatGPT-style" streaming text effect. Ask the travel assistant for 1-day itineraries or local customs, and watch it stream the markdown responses character-by-character with a blinking cursor.
- **Google Places Imagery:** Uses the Google Places API to dynamically fetch the official, high-quality photograph for every hidden gem discovered.
- **Favorites & Itinerary Export:** Save your favorite gems directly to your browser's LocalStorage and download the AI's generated itinerary directly to your system as an `.ics` Calendar file.

---

## 🛠️ Technology Stack

- **Frontend:** Vanilla HTML5, CSS3 (CSS Grid, Flexbox, Micro-animations), Vanilla JavaScript.
- **Backend:** Node.js, Express.js.
- **AI Core:** [Groq API](https://groq.com/) (LLaMA 3.3 70B Versatile).
- **Mapping & Media:** [Google Maps JavaScript API](https://developers.google.com/maps) and [Google Places API (New)](https://developers.google.com/maps/documentation/places/web-service/overview).

---

## 🚀 Local Setup & Installation

### 1. Prerequisites
- **Node.js** (v18 or higher)
- A **Groq API Key**
- A **Google Cloud API Key** (with Maps JavaScript API and Places API enabled)

### 2. Clone the Repository
```bash
git clone https://github.com/Shreyas-S-809/Local-Gem-Finder.git
cd Local-Gem-Finder
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Create a `.env` file in the root of the project:
```bash
touch .env
```
Add your API keys to the `.env` file:
```env
# Backend / AI Configuration
PORT=3000
GROQ_API_KEY=your_groq_api_key_here

# Mapping & Imagery
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```
*(Note: Do not commit your `.env` file to version control. It is already safely included in the `.gitignore`.)*

### 5. Run the Server
Start the local development server:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000`.

---

## 🎨 UI/UX Design Philosophy

The interface abandons generic frameworks (like Bootstrap) in favor of a highly optimized, raw CSS layout. It uses:
- The sleek **Aptos** and **Aptos Display** fonts for a premium, editorial aesthetic.
- Glassmorphic overlays and blur filters on floating action buttons.
- Fluid `fr` unit CSS Grid transitions to ensure animations remain smooth at 60fps without causing layout reflow bottlenecks.

---

## 📝 License
This project is for educational and portfolio demonstration purposes. All map data and AI responses are subject to the terms of service of Google and Groq respectively.

# ☕️ Brew — Reddit + Gemini Powered Startup Idea Hub

**Brew** is a high-craft web application designed for builders, creators, and side-hustlers who want to start something but don't know what. It monitors 14 startup and business spaces on Reddit, collects live discussions, and utilizes Gemini to decode them into actionable, structured **Idea Cards** detailing what the product is, the community debates ("the tea"), market timing, active builders, and checkable execution steps. 

This is an **idea hub, not a pain hub** — it focuses strictly on opportunities and momentum rather than complaints.

---

## 🌟 Core Features

- **Dynamic Category Explorer**: An animated grid of 14 categories (Freelancer Economy, AI & Automation, E-commerce, Dev Tools, etc.) with live idea counter badges.
- **Micro-Interactions & 3D Tilt**: Cards and buttons feature subtle 3D tilt effects, hover sheens, and layouts optimized with Framer Motion.
- **Dynamic Search, Sort, & Filter**: Search cards in real-time, sort by momentum score or difficulty, and filter by experience level.
- **The Tea (Community Debate)**: Learn what builders and customers on the ground are arguing about, formatted as dynamic discourse posts.
- **Checkable Startup Steps**: Save your progress directly in your browser with persistent, checkable getting started checklists.
- **Shortlist Bookmarks**: Save concepts to a personal shortlist synced dynamically across views.
- **Dark/Light Mode**: Transition between a premium dark coffee theme and a clean light cream layout.

---

## 🏗️ System Architecture

Brew is built with a decoupled architecture:

```
[Reddit] ──> PRAW Fetcher (Python) ──> raw threads ──> Gemini Decoder (google-genai) 
                                                                 │
                                                                 ▼
[Next.js Site] <── Cached static JSON files <── [src/data/{category_slug}.json]
```

1. **Fetcher**: A Python crawler querying seed subreddits per category using PRAW. Features a robust public JSON fallback if developer keys are not configured.
2. **Decoder**: A Gemini API wrapper (`google-genai` SDK) that parses raw threads into fully validated, structured `IdeaCard` JSON objects using Pydantic schemas.
3. **Next.js Site**: A static App Router frontend that imports and serves the generated JSONs, creating a zero-dependency runtime with instant loading speeds.

---

## 🚀 Getting Started

### 1. Requirements

- **Node.js** (v18 or higher)
- **Python** (3.11 or higher) with the Launcher (`py`)

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
# Reddit API Credentials (Optional: Crawler falls back to public JSON feeds if blank)
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USER_AGENT=brew-idea-hub/1.0 by your_username

# Google Gemini API Key (Required for scraping/simulating data)
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Install Dependencies

Install the frontend npm packages:
```bash
npm install
```

Install the Python pipeline requirements:
```bash
py -m pip install -r pipeline/requirements.txt
```

---

## 🛠️ Local Commands

### Run the Frontend Development Server
Start the Next.js server locally (it will run on `http://localhost:3000` or `http://localhost:3001` if port 3000 is occupied):
```bash
npm run dev
```

### Re-run the Scraper & Gemini Decoder
Trigger the full PRAW and Gemini pipeline to crawl Reddit and rewrite category JSONs:
```bash
npm run refresh
```

### Run Gemini Simulation Generator (No Reddit Keys needed)
If you do not have Reddit API credentials, you can populate all categories with 6 Gemini-synthesized startup ideas based on typical subreddit topics:
```bash
npm run refresh:dry
```

---

## 📂 Project Structure

```
brew/
├── .env.example
├── package.json
├── pipeline/
│   ├── requirements.txt
│   ├── config.py           # Paths and env configurations
│   ├── fetcher.py          # Reddit crawler with public fallback
│   ├── decoder.py          # Gemini SDK structured JSON schema parser
│   ├── run.py              # Main crawler runner
│   └── populate_rich_mocks.py # Custom mock merger script
└── src/
    ├── app/                # Next.js App Router paths
    ├── components/         # Framer motion & layout elements
    ├── context/            # Light/Dark Theme providers
    ├── data/               # Generated static category JSON files
    └── utils/              # Dynamic data loading helper scripts
```

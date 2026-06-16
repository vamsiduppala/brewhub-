const fs = require("fs");
const path = require("path");

// Simple, dependency-free dotenv parser
function loadEnv() {
  const envPath = path.resolve(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    content.split(/\r?\n/).forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || "";
        // Remove quotes if present
        if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value;
      }
    });
  }
}

loadEnv();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("[Crawler Error] GEMINI_API_KEY is not defined in .env file.");
  process.exit(1);
}

const DB_PATH = path.resolve(__dirname, "../src/data/db.json");
const CATEGORIES_PATH = path.resolve(__dirname, "../src/data/categories.json");

// Helper to decode HTML entities in RSS XML
function decodeHTMLEntities(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
}

// Helper to strip HTML tags
function stripHTML(html) {
  let clean = html.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
  clean = clean.replace(/<[^>]*?>/g, " ");
  clean = clean.replace(/\s+/g, " ").trim();
  return decodeHTMLEntities(clean);
}

// Regex-based RSS entry parser
function parseRedditRSS(xmlText) {
  const entries = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;
  
  while ((match = entryRegex.exec(xmlText)) !== null) {
    const entryContent = match[1];
    const titleMatch = entryContent.match(/<title>([\s\S]*?)<\/title>/);
    const title = titleMatch ? decodeHTMLEntities(titleMatch[1]) : "";
    
    const linkMatch = entryContent.match(/<link href="([^"]*?)"/);
    const url = linkMatch ? linkMatch[1] : "";
    
    const contentMatch = entryContent.match(/<content[^>]*?>([\s\S]*?)<\/content>/);
    const rawContent = contentMatch ? contentMatch[1] : "";
    const text = stripHTML(rawContent).substring(0, 1000);
    
    entries.push({ title, url, text });
  }
  return entries;
}

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Crawl multiple RSS feeds (hot, top, search) for subreddits in a category
async function crawlCategoryRSS(cat) {
  const rawThreads = [];
  const seenUrls = new Set();
  
  if (!cat.subreddits || cat.subreddits.length === 0) {
    return rawThreads;
  }
  
  const subJoined = cat.subreddits.join("+");
  const searchQuery = "pain+OR+frustrated+OR+sucks+OR+problem+OR+annoyed+OR+alternative+OR+hate+OR+fail";
  const feeds = [
    `https://www.reddit.com/r/${subJoined}/hot.rss`,
    `https://www.reddit.com/r/${subJoined}/top.rss?t=month`,
    `https://www.reddit.com/r/${subJoined}/search.rss?q=${searchQuery}&restrict_sr=on&sort=relevance&t=month`
  ];
  
  for (let i = 0; i < feeds.length; i++) {
    const feedUrl = feeds[i];
    try {
      if (i > 0) {
        // Wait 1.5 seconds between requests to avoid rate limits
        await sleep(1500);
      }
      
      const response = await fetch(feedUrl, {
        headers: { "User-Agent": USER_AGENT }
      });
      
      if (response.ok) {
        const xmlText = await response.text();
        const parsed = parseRedditRSS(xmlText).slice(0, 20); // Capture up to 20 per feed for wider focus
        for (const t of parsed) {
          if (!seenUrls.has(t.url)) {
            seenUrls.add(t.url);
            rawThreads.push({
              title: t.title,
              text: t.text,
              subreddit: cat.subreddits[0] || "reddit",
              url: t.url,
              score: 1
            });
          }
        }
      } else {
        console.warn(`  [Warning] Failed to fetch feed (${response.status} ${response.statusText}): ${feedUrl}`);
      }
    } catch (err) {
      console.error(`  [Error] Failed to crawl RSS feed ${feedUrl}:`, err.message || err);
    }
  }
  return rawThreads;
}

// Generate up to 20 ideas using Gemini API (with direct brainstorming fallback if rawThreads is empty)
async function generateIdeas(cat, rawThreads) {
  let promptText = "";
  if (rawThreads && rawThreads.length > 0) {
    promptText =
      `You are an expert startup ideator. Generate 20 distinct, startable, high-density Idea Cards based on these raw Reddit threads for the category '${cat.name}' (Description: '${cat.description}'). ` +
      `Each card must conform strictly to the JSON schema. ` +
      `Analyze the threads to extract real pain points, frustrations, and unmet needs. Do not frame ideas as complaints; focus on actionable business/product solutions. ` +
      `Capture 'the tea' (the background stories, debates, or context behind the problem) in a fun, engaging, and encouraging tone.\n\n` +
      `Input Threads:\n${JSON.stringify(rawThreads)}`;
  } else {
    promptText =
      `You are an expert startup ideator. We were unable to fetch raw threads due to API/rate limits, so you must use your knowledge of the domain and community discussions. ` +
      `Generate 20 distinct, startable, high-density Idea Cards for the category '${cat.name}' (Description: '${cat.description}'). ` +
      `Each card must conform strictly to the JSON schema. ` +
      `Brainstorm high-momentum, premium startup ideas that solve real pain points commonly discussed in subreddits like r/${cat.subreddits.join(", r/")}. ` +
      `Generate realistic 'sources' (with realistic subreddit names, thread titles, upvotes, and comments) that reflect real-world discussions in these communities. ` +
      `Capture 'the tea' (the background stories, debates, or context behind the problem) in a fun, engaging, and encouraging tone.`;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            ideas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  category: { type: "string" },
                  title: { type: "string" },
                  tagline: { type: "string" },
                  whatItIs: { type: "string" },
                  momentum: { type: "string" },
                  momentumScore: { type: "number" },
                  momentumWhy: { type: "string" },
                  difficulty: { type: "string" },
                  whyNow: { type: "string" },
                  theTea: { type: "string" },
                  whoIsDoingIt: { type: "string" },
                  gettingStarted: { type: "array", items: { type: "string" } },
                  tags: { type: "array", items: { type: "string" } },
                  sources: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        url: { type: "string" },
                        subreddit: { type: "string" },
                        upvotes: { type: "number" },
                        numComments: { type: "number" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })
  });

  if (response.ok) {
    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      const parsed = JSON.parse(text);
      return parsed.ideas || parsed;
    }
  } else {
    const errText = await response.text();
    throw new Error(`Gemini API HTTP ${response.status}: ${errText}`);
  }
  return null;
}

// Update db.json (Accumulate, Deduplicate, and Cap at 100)
function updateDatabase(categorySlug, newIdeas) {
  let dbData = [];
  if (fs.existsSync(DB_PATH)) {
    try {
      dbData = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
    } catch (e) {
      console.warn("[Warning] db.json was malformed. Re-initializing.");
      dbData = [];
    }
  }

  if (!Array.isArray(dbData)) {
    dbData = [];
  }

  const seenTitles = new Set();
  const merged = [];

  // Normalize new ideas and add timestamps
  const processedNew = newIdeas.map((idea, idx) => {
    const title = (idea.title || "Unnamed Idea").trim();
    const id = idea.id && !idea.id.startsWith("placeholder")
      ? idea.id
      : `${categorySlug}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now() + idx}`;
    return {
      ...idea,
      id,
      category: categorySlug,
      title,
      lastUpdated: new Date().toISOString()
    };
  });

  // Prioritize new ideas first so they take precedence over old duplicates
  for (const idea of [...processedNew, ...dbData]) {
    if (idea.category !== categorySlug) {
      merged.push(idea);
    } else {
      const cleanTitle = (idea.title || "").toLowerCase().trim();
      if (cleanTitle && !seenTitles.has(cleanTitle)) {
        seenTitles.add(cleanTitle);
        merged.push(idea);
      }
    }
  }

  // Filter ideas for this category to cap them
  const categoryIdeas = merged.filter(idea => idea.category === categorySlug);
  const otherIdeas = merged.filter(idea => idea.category !== categorySlug);

  // Sort category ideas by momentumScore descending
  categoryIdeas.sort((a, b) => (b.momentumScore || 0) - (a.momentumScore || 0));

  // Cap at 100 ideas
  const cappedCategoryIdeas = categoryIdeas.slice(0, 100);

  const updated = [...otherIdeas, ...cappedCategoryIdeas];

  fs.writeFileSync(DB_PATH, JSON.stringify(updated, null, 2), "utf8");
  console.log(`  [Database] Database updated. Category '${categorySlug}' now holds ${cappedCategoryIdeas.length} cards.`);
}

// Run crawler for a single category index
async function runCrawlingCycle(index) {
  if (!fs.existsSync(CATEGORIES_PATH)) {
    console.error(`Categories config file not found at ${CATEGORIES_PATH}`);
    return;
  }
  const categories = JSON.parse(fs.readFileSync(CATEGORIES_PATH, "utf8"));
  
  if (categories.length === 0) return;
  const targetIdx = index % categories.length;
  const cat = categories[targetIdx];

  console.log(`[Crawler] Round-robin polling category (${targetIdx + 1}/${categories.length}): ${cat.name}`);
  
  try {
    const threads = await crawlCategoryRSS(cat);
    if (threads.length === 0) {
      console.log(`  No new RSS threads crawled for r/${cat.subreddits.join(", r/")}`);
      return;
    }
    
    console.log(`  Fetched ${threads.length} distinct RSS entries. Contacting Gemini...`);
    const newIdeas = await generateIdeas(cat, threads);
    if (newIdeas && newIdeas.length > 0) {
      updateDatabase(cat.slug, newIdeas);
      console.log(`  Success! Database updated with ${newIdeas.length} fresh ideas for ${cat.name}.`);
    } else {
      console.log(`  Gemini returned 0 ideas for ${cat.name}.`);
    }
  } catch (err) {
    console.error(`  [Crawler Error] Failed to refresh category ${cat.name}:`, err.message || err);
  }
}

// Expose internal trigger for manual category scrapes (used by Next.js API routes)
async function triggerCategoryRefresh(categorySlug) {
  if (!fs.existsSync(CATEGORIES_PATH)) {
    throw new Error("Categories config missing.");
  }
  const categories = JSON.parse(fs.readFileSync(CATEGORIES_PATH, "utf8"));
  const cat = categories.find(c => c.slug === categorySlug);
  if (!cat) {
    throw new Error(`Category ${categorySlug} not found.`);
  }

  console.log(`[On-Demand Scrape] Crawling category RSS: ${cat.name}`);
  const threads = await crawlCategoryRSS(cat);
  if (threads.length === 0) {
    throw new Error(`No posts could be fetched from subreddits: ${cat.subreddits.join(", ")}`);
  }

  const newIdeas = await generateIdeas(cat, threads);
  if (newIdeas && newIdeas.length > 0) {
    updateDatabase(cat.slug, newIdeas);
    return newIdeas;
  }
  throw new Error("Gemini did not return any ideas.");
}

// Daemon main loop
let currentIndex = 0;
async function startDaemon() {
  console.log("[Crawler Daemon] Starting RSS crawler service...");
  
  // Run first cycle immediately
  await runCrawlingCycle(currentIndex++);
  
  // Set interval to poll every 60 seconds
  setInterval(async () => {
    await runCrawlingCycle(currentIndex++);
  }, 60000);
}

// If run directly (not required as a module)
if (require.main === module) {
  startDaemon();
}

module.exports = {
  triggerCategoryRefresh
};

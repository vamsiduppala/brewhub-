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
        let value = match[2] || "";
        if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
          value = value.substring(1, value.length - 1);
        }
        process.env[key = match[1]] = value;
      }
    });
  }
}

loadEnv();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("[Populator Error] GEMINI_API_KEY is not defined in .env file.");
  process.exit(1);
}

const DB_PATH = path.resolve(__dirname, "../src/data/db.json");
const CATEGORIES_PATH = path.resolve(__dirname, "../src/data/categories.json");

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper fetch wrapper with timeout
async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 30000 } = options;
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

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

// Crawl RSS feeds for subreddits in a category
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
        await sleep(1500); // 1.5s delay to avoid Reddit rate limit
      }
      
      const response = await fetchWithTimeout(feedUrl, {
        headers: { "User-Agent": USER_AGENT },
        timeout: 8000 // 8s timeout for RSS feeds
      });
      
      if (response.ok) {
        const xmlText = await response.text();
        const parsed = parseRedditRSS(xmlText).slice(0, 15);
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
      }
    } catch (err) {
      // ignore silently
    }
  }
  return rawThreads;
}

// Generate ideas using Gemini API
async function generateIdeas(cat, rawThreads) {
  let promptText = "";
  if (rawThreads && rawThreads.length > 0) {
    promptText =
      `You are an expert startup ideator. Generate 10 distinct, startable, high-density Idea Cards based on these raw Reddit threads for the category '${cat.name}' (Description: '${cat.description}'). ` +
      `Each card must conform strictly to the JSON schema. Keep all text fields (whatItIs, whyNow, momentumWhy, theTea, whoIsDoingIt) very concise (exactly 1-2 sentences each). Do not write long essays or bloated paragraphs. This is crucial so that all 10 ideas can fit in a single response without hitting the output token limit. ` +
      `Analyze the threads to extract real pain points, frustrations, and unmet needs. Do not frame ideas as complaints; focus on actionable business/product solutions. ` +
      `Explicitly identify the target user environment (e.g., "Chrome Extension", "VS Code IDE Plugin", "CLI Terminal", "Shopify App Dashboard", "Next.js Server / Vercel Cloud", "Excel / Google Sheets Template", "Mobile iOS/Android App", "B2B SaaS Web App") where users typically operate or encounter this issue. ` +
      `Capture 'the tea' (the background stories, debates, or context behind the problem) in a fun, engaging, and encouraging tone.\n\n` +
      `Input Threads:\n${JSON.stringify(rawThreads)}`;
  } else {
    promptText =
      `You are an expert startup ideator. We were unable to fetch raw threads due to API/rate limits, so you must use your knowledge of the domain and community discussions. ` +
      `Generate 10 distinct, startable, high-density Idea Cards for the category '${cat.name}' (Description: '${cat.description}'). ` +
      `Each card must conform strictly to the JSON schema. Keep all text fields (whatItIs, whyNow, momentumWhy, theTea, whoIsDoingIt) very concise (exactly 1-2 sentences each). Do not write long essays or bloated paragraphs. This is crucial so that all 10 ideas can fit in a single response without hitting the output token limit. ` +
      `Brainstorm high-momentum, premium startup ideas that solve real pain points commonly discussed in subreddits like r/${cat.subreddits.join(", r/")}. ` +
      `Explicitly identify the target user environment (e.g., "Chrome Extension", "VS Code IDE Plugin", "CLI Terminal", "Shopify App Dashboard", "Next.js Server / Vercel Cloud", "Excel / Google Sheets Template", "Mobile iOS/Android App", "B2B SaaS Web App") where users typically operate or encounter this issue. ` +
      `Generate realistic 'sources' (with realistic subreddit names, thread titles, upvotes, and comments) that reflect real-world discussions in these communities. ` +
      `Capture 'the tea' (the background stories, debates, or context behind the problem) in a fun, engaging, and encouraging tone.`;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${GEMINI_API_KEY}`;
  
  const response = await fetchWithTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    timeout: 45000, // 45s timeout for Gemini API calls
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
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
                  environment: { type: "string" },
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

async function run() {
  console.log("[Populator] Starting incremental bulk database seed script with timeout protection...");
  
  if (!fs.existsSync(CATEGORIES_PATH)) {
    console.error("[Populator Error] Categories config not found.");
    process.exit(1);
  }
  
  const categories = JSON.parse(fs.readFileSync(CATEGORIES_PATH, "utf8"));
  
  // Load existing database
  let dbData = [];
  if (fs.existsSync(DB_PATH)) {
    try {
      dbData = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
    } catch (e) {
      console.warn("[Populator Warning] db.json was malformed or empty.");
      dbData = [];
    }
  }
  if (!Array.isArray(dbData)) {
    dbData = [];
  }

  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    
    // Count existing ideas for this category
    const existingCount = dbData.filter(idea => idea.category === cat.slug).length;
    console.log(`[Populator] Category (${i + 1}/${categories.length}) "${cat.name}" has ${existingCount} existing ideas.`);
    
    if (existingCount >= 10) {
      console.log(`  Skipping category "${cat.name}" since it already has ${existingCount} ideas (at least 10 required).`);
      continue;
    }
    
    console.log(`  Generating 10 ideas for category "${cat.name}"...`);
    let threads = [];
    try {
      threads = await crawlCategoryRSS(cat);
      if (threads.length === 0) {
        console.log(`    No threads crawled. Using Gemini direct brainstorming fallback.`);
      } else {
        console.log(`    Successfully crawled ${threads.length} threads.`);
      }
    } catch (e) {
      console.log(`    Failed to crawl RSS. Using Gemini direct brainstorming fallback. Error: ${e.message}`);
    }
    
    // Call Gemini API to generate ideas
    let attempts = 3;
    let success = false;
    let ideas = [];
    
    while (attempts > 0 && !success) {
      try {
        ideas = await generateIdeas(cat, threads);
        if (ideas && ideas.length > 0) {
          success = true;
        } else {
          attempts--;
          console.warn(`    [Warning] Received empty ideas, retrying... (${attempts} attempts left)`);
          await sleep(3000);
        }
      } catch (err) {
        attempts--;
        console.warn(`    [Warning] Gemini request failed: ${err.message || err}. Retrying... (${attempts} attempts left)`);
        
        // If it's a 429 rate limit error, wait longer before retrying
        if (err.message && err.message.includes("429")) {
          console.log("    Rate limit hit. Sleeping for 45 seconds before retry...");
          await sleep(45000);
        } else {
          await sleep(5000);
        }
      }
    }
    
    if (success) {
      const processed = ideas.map((idea, idx) => {
        const title = (idea.title || "Unnamed Idea").trim();
        const id = `${cat.slug}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now() + idx}`;
        return {
          ...idea,
          id,
          category: cat.slug,
          title,
          lastUpdated: new Date().toISOString()
        };
      });
      
      // Append and save immediately so that progress is not lost if the script is terminated!
      dbData = dbData.filter(idea => idea.category !== cat.slug).concat(processed);
      fs.writeFileSync(DB_PATH, JSON.stringify(dbData, null, 2), "utf8");
      console.log(`    [Success] Saved ${processed.length} new ideas for "${cat.name}".`);
    } else {
      console.error(`    [Error] Failed to generate ideas for category "${cat.name}" after all retries.`);
    }
    
    // Sleep to prevent Gemini RPM rate limits
    if (i < categories.length - 1) {
      console.log("  Waiting 8 seconds before next category...");
      await sleep(8000);
    }
  }
  
  console.log(`[Populator] Finished incremental run. Total cards in database: ${dbData.length}`);
}

run().catch(err => {
  console.error("[Populator Critical Error]:", err);
});

import express from "express";
import cors from "cors";
import fetch from "node-fetch";

// Load API Keys
const OPENAI_KEY = process.env.OPENAI_API_KEY || "";
const BING_KEY = process.env.BING_API_KEY || "";

if (!OPENAI_KEY) console.warn("⚠️ OPENAI_API_KEY not set!");
if (!BING_KEY) console.warn("⚠️ BING_API_KEY not set!");

const app = express();
app.use(cors());
app.use(express.json());

// Root Route
app.get("/", (req, res) => {
  res.send("🔥 Mays AI Backend Running with Web Search + Multi GPT!");
});

// --- Web Search (BING + Real-Time Info) ---
async function webSearch(query) {
  if (!BING_KEY) return [];

  const url =
    `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}`;

  const res = await fetch(url, {
    headers: { "Ocp-Apim-Subscription-Key": BING_KEY }
  });

  if (!res.ok) return [];
  const data = await res.json();

  return (data.webPages?.value || []).map((p) => ({
    title: p.name,
    snippet: p.snippet,
    url: p.url
  }));
}

// --- ChatGPT Call ---
async function callOpenAI(prompt) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3
    })
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "No response";
}

function buildPrompt(snippets, q) {
  const refs = snippets
    .map((s, i) => `[${i + 1}] ${s.title}\n${s.snippet}\n${s.url}`)
    .join("\n\n");

  return `
You are **Mays AI**, created and founded by **Syam Kumar Kerla**.
You must ALWAYS introduce yourself as Mays AI.
Never say you are created by OpenAI.

Use the following real-time web results:
${refs}

USER QUESTION:
${q}

Give correct, simple, updated, latest answer with sources. 
Mention source numbers like [1], [2].
`;
}

// --- API Endpoint ---
app.post("/api/query", async (req, res) => {
  try {
    const q = req.body.query || "";
    if (!q) return res.status(400).json({ error: "No question provided" });

    // Get search results
    const snippets = await webSearch(q);

    // Build final prompt using AI + Web Search
    const finalPrompt = buildPrompt(snippets, q);

    // Call OpenAI
    const answer = await callOpenAI(finalPrompt);

    res.json({
      answer,
      sources: snippets
    });

  } catch (e) {
    res.json({ error: e.message });
  }
});

// --- Start Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Mays AI backend running on port " + PORT);
});

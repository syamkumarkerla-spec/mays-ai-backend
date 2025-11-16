// server.js
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch"); // node-fetch package must be in package.json

const app = express();
app.use(cors());
app.use(express.json());

// === Environment keys (set these in Render / environment variables)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

if (!OPENAI_API_KEY) console.warn("OPENAI_API_KEY missing!");
if (!TAVILY_API_KEY) console.warn("TAVILY_API_KEY missing!");

// --- Tavily real-time web search
async function webSearchTavily(query) {
  if (!TAVILY_API_KEY) return { results: [], error: "No TAVILY_API_KEY" };
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TAVILY_API_KEY}`
      },
      body: JSON.stringify({
        query,
        max_results: 5
      })
    });
    if (!res.ok) {
      const text = await res.text().catch(()=>"<no body>");
      return { results: [], error: `Tavily responded ${res.status}: ${text}` };
    }
    const data = await res.json();
    const results = (data.results || data.items || data.webPages || []).map(r => ({
      title: r.title || r.name || "",
      snippet: r.snippet || r.description || r.text || "",
      url: r.url || r.link || r.source || ""
    })).slice(0, 5);
    return { results };
  } catch (e) {
    return { results: [], error: e.message || String(e) };
  }
}

// --- OpenAI Chat call
async function askOpenAI(prompt) {
  if (!OPENAI_API_KEY) return "OpenAI API key not set";
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // change model if needed
        messages: [
          { role: "system", content:
            "You are Mays AI. Use the web data provided below and produce a short, accurate, up-to-date answer. Cite source numbers in square brackets like [1]. If web data is unavailable, say so and provide best current knowledge." },
          { role: "user", content: prompt }
        ],
        max_tokens: 800,
        temperature: 0.2
      })
    });

    if (!res.ok) {
      const text = await res.text().catch(()=>"<no body>");
      return `OpenAI error ${res.status}: ${text}`;
    }
    const json = await res.json();
    return json?.choices?.[0]?.message?.content || "No completion from OpenAI";
  } catch (e) {
    return `OpenAI Error: ${e.message || String(e)}`;
  }
}

// --- Build a prompt for the LLM using the web results
function buildPrompt(question, sources) {
  let refs = "";
  sources.forEach((s, i) => {
    refs += `[${i+1}] ${s.title}\n${s.snippet}\n${s.url}\n\n`;
  });

  return `
WEB SEARCH RESULTS:
${refs || "No web search results found."}

QUESTION:
${question}

INSTRUCTIONS: Use the web data above to give the most up-to-date accurate answer. Cite snippet numbers in square brackets such as [1]. If web data is empty, say "No web results" and answer with best-known info.
  `;
}

// --- API route used by frontend
app.post("/api/chat", async (req, res) => {
  try {
    const q = (req.body?.question || "").toString().trim();
    if (!q) return res.status(400).json({ error: "No question provided" });

    // 1) Get web results
    const tavily = await webSearchTavily(q);
    const sources = tavily.results || [];

    // 2) Build prompt and call OpenAI
    const prompt = buildPrompt(q, sources);
    const answer = await askOpenAI(prompt);

    // 3) Return best result + sources + any errors
    res.json({
      answer,
      sources,
      errors: {
        tavily: tavily.error || null
      }
    });
  } catch (err) {
    res.json({ error: err.message || String(err) });
  }
});

// Health route
app.get("/", (req, res) => res.send("Mays AI Backend Running!"));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

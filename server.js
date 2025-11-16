// server.js

const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.json());

// ====== ENVIRONMENT KEYS ======
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SERP_API_KEY = process.env.SERP_API_KEY;

if (!OPENAI_API_KEY) console.warn("Missing OPENAI_API_KEY");
if (!SERP_API_KEY) console.warn("Missing SERP_API_KEY");

// ====== GOOGLE REAL-TIME SEARCH (SerpAPI) ======
async function googleSearch(query) {
  try {
    const url = `https://serpapi.com/search.json?q=${encodeURIComponent(
      query
    )}&engine=google&api_key=${SERP_API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.organic_results) return [];

    return data.organic_results.slice(0, 5).map((r) => ({
      title: r.title || "",
      snippet: r.snippet || "",
      url: r.link || "",
    }));
  } catch (e) {
    console.log("SerpAPI Error:", e);
    return [];
  }
}

// ====== OPENAI CALL ======
async function askOpenAI(prompt) {
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Give the latest verified answer using web search." },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
      }),
    });

    const json = await res.json();
    return json.choices?.[0]?.message?.content || "No response from OpenAI";
  } catch (e) {
    return "OpenAI Error: " + e.message;
  }
}

// ====== BUILD PROMPT ======
function buildPrompt(question, results) {
  let text = "WEB SEARCH RESULTS:\n\n";

  if (!results.length) {
    text += "No live web results found.\n\n";
  } else {
    results.forEach((r, i) => {
      text += `[${i + 1}] ${r.title}\n${r.snippet}\n${r.url}\n\n`;
    });
  }

  text += `QUESTION:\n${question}\n\nGive the latest correct answer using above results.`;

  return text;
}

// ====== MAIN API ROUTE ======
app.post("/api/chat", async (req, res) => {
  try {
    const q = req.body.question;
    if (!q) return res.json({ error: "No question provided" });

    // Live search
    const search = await googleSearch(q);

    // Build prompt for OpenAI
    const prompt = buildPrompt(q, search);

    // Get final AI answer
    const answer = await askOpenAI(prompt);

    res.json({
      answer,
      sources: search,
    });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// ====== START SERVER ======
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));

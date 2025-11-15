const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.json());

// Environment Keys
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

// === Tavily Real-Time Web Search ===
async function webSearch(query) {
  const response = await fetch("https://api.tavily.com/search", {
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

  return await response.json();
}

// === OpenAI GPT Call ===
async function askOpenAI(prompt) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "You are Mays AI, created and founded by Syam Kumar Kerla. Always use web search data. Always answer with updated information."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

// === Build Prompt ===
function buildPrompt(question, search) {
  const results = (search.results || [])
    .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\n${r.url}`)
    .join("\n\n");

  return `
WEB SEARCH RESULTS:
${results}

QUESTION:
${question}

Give latest accurate answer using sources.
`;
}

// === API ROUTE ===
app.post("/api/chat", async (req, res) => {
  try {
    const q = req.body.question;
    if (!q) return res.json({ error: "No question provided" });

    const search = await webSearch(q);
    const prompt = buildPrompt(q, search);
    const answer = await askOpenAI(prompt);

    res.json({
      answer,
      sources: search.results || []
    });

  } catch (err) {
    res.json({ error: err.message });
  }
});

// === SERVER START ===
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server running on port " + port);
});

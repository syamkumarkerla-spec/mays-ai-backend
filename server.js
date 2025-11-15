```js
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.json());

// Environment keys
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

// 🔍 Tavily Real-Time Search
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

// 🤖 OpenAI GPT Call
async function askOpenAI(prompt) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

// Build prompt
function buildPrompt(query, search) {
  const results = (search.results || [])
    .map((r, i) => `[${i+1}] ${r.title}\n${r.snippet}\n${r.url}`)
    .join("\n\n");

  return `
Use this LIVE WEB SEARCH data:

${results}

QUESTION:
${query}

Give the latest accurate answer.
`;
}

// API
app.post("/api/chat", async (req, res) => {
  try {
    const q = req.body.question;

    const search = await webSearch(q);
    const finalPrompt = buildPrompt(q, search);
    const answer = await askOpenAI(finalPrompt);

    res.json({ answer, sources: search.results });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// Test
app.get("/", (req, res) => {
  res.send("Mays AI with Live Tavily Search Running!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on " + PORT));
```

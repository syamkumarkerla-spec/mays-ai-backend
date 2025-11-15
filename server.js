```js
import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

// Load keys from Render environment
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

// 🔍 Tavily Real-Time Web Search
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

  const data = await response.json();
  return data.results || [];
}

// 🔥 OpenAI (GPT-4o-mini) Response
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

// 🧠 Create final combined prompt
function buildPrompt(query, results) {
  const snippets = results
    .map((r, i) => `[${i+1}] ${r.title}\n${r.snippet}\n${r.url}`)
    .join("\n\n");

  return `
Use the following live web search data to answer the question.

WEB SEARCH RESULTS:
${snippets}

QUESTION:
${query}

Answer using accurate **up-to-date info**.
`;
}

// 🌍 API Route
app.post("/api/chat", async (req, res) => {
  try {
    const query = req.body.question;

    // 1️⃣ Real web search
    const results = await webSearch(query);

    // 2️⃣ Build smart context for GPT
    const finalPrompt = buildPrompt(query, results);

    // 3️⃣ Ask GPT
    const answer = await askOpenAI(finalPrompt);

    res.json({ answer, sources: results });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// Root test
app.get("/", (req, res) => {
  res.send("Mays AI Backend with Tavily Search Running!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on " + PORT));
```

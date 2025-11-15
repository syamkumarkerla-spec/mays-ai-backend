const express = require("express");
const cors = require("cors");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const TAVILY_API_KEY = process.env.TAVILY_API_KEY || "";

const app = express();
app.use(cors());
app.use(express.json());

// Health
app.get("/", (req, res) => {
  res.send("Mays AI Backend Running!");
});

// Tavily Search
async function webSearch(query) {
  if (!TAVILY_API_KEY) return [];
  try {
    const r = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TAVILY_API_KEY}`
      },
      body: JSON.stringify({ query, max_results: 5 })
    });

    if (!r.ok) return [];
    const j = await r.json();
    return j.results || [];
  } catch (e) {
    console.error("Tavily error:", e.message);
    return [];
  }
}

// OpenAI Call
async function callOpenAI(prompt) {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are Mays AI, created by Syam Kumar Kerla. Always use web snippets when provided."
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 700,
      temperature: 0.2
    })
  });

  const j = await r.json();
  return j.choices?.[0]?.message?.content || "No answer";
}

// Main Ask Route
app.post("/ask", async (req, res) => {
  try {
    const q = req.body.question || "";
    if (!q.trim()) return res.status(400).json({ error: "No query" });

    // Live web search
    const snippets = await webSearch(q);

    const refs = snippets
      .map((s, i) => `[${i + 1}] ${s.title}\n${s.url}\n${s.description || ""}`)
      .join("\n\n");

    const prompt = `
Use the web data below to answer accurately. Cite numbers like [1].

WEB SNIPPETS:
${refs}

QUESTION: ${q}

Give a clear, updated answer. Cite sources at the end.
`;

    const answer = await callOpenAI(prompt);

    res.json({ answer, sources: snippets });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on", PORT));

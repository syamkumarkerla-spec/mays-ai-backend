import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

// --- Free real-time Search (DuckDuckGo) ---
async function webSearchFree(query) {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`;
  const res = await fetch(url);
  const data = await res.json();
  return data.RelatedTopics?.slice(0, 5).map((i) => ({
    title: i.Text,
    url: i.FirstURL
  })) || [];
}

// --- OpenAI GPT ---
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function askGPT(prompt) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "No answer.";
}

// --- MAIN API ---
app.post("/ask", async (req, res) => {
  try {
    const q = req.body.question;

    const search = await webSearchFree(q);

    const prompt = `
Using this web data:
${search.map((s, i) => `[${i + 1}] ${s.title}\n${s.url}`).join("\n")}

Question: ${q}
Answer with latest info.
`;

    const answer = await askGPT(prompt);

    res.json({ answer, sources: search });
  } catch (e) {
    res.json({ error: e.message });
  }
});

app.get("/", (req, res) => {
  res.send("MAYS AI real-time backend running!");
});

app.listen(3000, () => console.log("Server running on port 3000"));

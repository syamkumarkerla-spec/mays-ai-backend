// ================================
// MAYS AI BACKEND - FINAL VERSION
// DELETE EVERYTHING & PASTE THIS
// ================================

const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ================================
// API KEYS (Render Environment Variables)
// ================================
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

// ================================
// REAL-TIME WEB SEARCH (Tavily)
// ================================
async function webSearch(query) {
    try {
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
    } catch (err) {
        console.log("Tavily Error:", err);
        return { results: [] };
    }
}

// ================================
// OPENAI (GPT-4o-mini)
// ================================
async function askOpenAI(prompt) {
    try {
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
    } catch (err) {
        return "OpenAI Error: " + err.message;
    }
}

// ================================
// BUILD PROMPT
// ================================
function buildPrompt(question, search) {
    const results = (search.results || [])
        .map((r, i) => `${i + 1}) ${r.title}\n${r.snippet}\n${r.url}`)
        .join("\n\n");

    return `
WEB SEARCH RESULTS:
${results}

QUESTION:
${question}

Give the MOST UPDATED answer.
`;
}

// ================================
// MAIN API ENDPOINT
// ================================
app.post("/api/chat", async (req, res) => {
    try {
        const q = req.body.question;
        if (!q) return res.json({ error: "No question provided" });

        const searchResults = await webSearch(q);
        const prompt = buildPrompt(q, searchResults);
        const answer = await askOpenAI(prompt);

        res.json({
            answer,
            sources: searchResults.results || []
        });
    } catch (err) {
        res.json({ error: err.message });
    }
});

// ================================
// SERVER START
// ================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));

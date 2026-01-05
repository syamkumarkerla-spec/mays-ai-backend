import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;

app.post("/ask", async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.json({ answer: "Question missing" });
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${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}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [{ role: "user", content: question }]
      })
    });

    const data = await response.json();
    res.json({ answer: data.choices[0].message.content });

  } catch (err) {
    res.json({ answer: "Backend error" });
  }
});

app.get("/", (req, res) => {
  res.send("Mays AI backend running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));

import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.post("/ask", async (req, res) => {
  try {
    const question = req.body.question;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: question }]
      })
    });

    const data = await response.json();

    return res.json({
      answer: data.choices[0].message.content
    });

  } catch (err) {
    return res.json({ error: err.message });
  }
});

app.get("/", (req, res) => {
  res.json({ status: "Mays AI Backend Running" });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

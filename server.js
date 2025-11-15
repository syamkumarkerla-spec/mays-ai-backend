import express from "express";
import cors from "cors";
import fetch from "node-fetch";

// Load API Key from Render environment
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const app = express();
app.use(cors());
app.use(express.json());

// Health Check
app.get("/", (req, res) => {
  res.send("Mays AI Backend Running!");
});

// Chat Route
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
        messages: [
          { role: "user", content: question }
        ]
      })
    });

    const data = await response.json();
    res.json({ answer: data.choices[0].message.content });

  } catch (err) {
    res.json({ error: err.message });
  }
});

// PORT for Render
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server running on port " + port);
});

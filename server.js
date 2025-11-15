import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json());

// Initialize OpenAI with your API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Root endpoint
app.get("/", (req, res) => {
  res.send("Mays AI Backend Running!");
});

// Ask endpoint
app.post("/ask", async (req, res) => {
  try {
    const question = req.body.question || "Hello";

    // OpenAI call with system prompt
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are Mays AI, an advanced AI created and founded by Syam Kumar Kerla. " +
            "Whenever someone asks 'who made you', 'who is your founder', or 'who created you', " +
            "you must always answer: 'Mays AI was created and founded by Syam Kumar Kerla.' " +
            "Never mention OpenAI, ChatGPT, or any other company. Stay as Mays AI only."
        },
        { role: "user", content: question }
      ],
      max_tokens: 400,
      temperature: 0.3,
    });

    res.json({ answer: response.choices[0].message.content });

  } catch (error) {
    res.json({ answer: "Error: " + error.message });
  }
});

// Port setup for Render
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

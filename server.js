// server.js
import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 5000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

if (!GEMINI_API_KEY) {
  console.warn("⚠️ GEMINI_API_KEY not set. Please configure it in Railway.");
}

// Health check endpoint
app.get("/", (req, res) => res.send("🚀 Coach Joel AI is running"));

// Chat endpoint
app.post("/chat", async (req, res) => {
  const { message, systemPrompt } = req.body;
  if (!message) return res.status(400).json({ error: "Missing message" });

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: systemPrompt || "Primary Function: You are Coach Joel AI who helps the InterLink Community..."
              }
            ]
          },
          {
            parts: [{ text: message }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 512,
        },
      }),
    });

    if (!response.ok) {
      const txt = await response.text().catch(() => "");
      console.error("Non-OK response from Gemini:", response.status, txt);
      return res.status(500).json({ error: `Model error: ${response.status}` });
    }

    const data = await response.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.output?.[0]?.contents?.[0]?.parts?.[0]?.text ||
      "No response";

    res.json({ reply });
  } catch (err) {
    console.error("❌ Error generating:", err);
    res.status(500).json({ error: "Something went wrong." });
  }
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

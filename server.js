// server.js
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// serve static frontend files from /public
app.use(express.static(path.join(__dirname, "public")));

const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
if (!GEMINI_KEY) console.warn("⚠️ GEMINI_API_KEY not set");

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

// Default system prompt (Coach Joel AI) — will be sent with every request unless overridden
const DEFAULT_SYSTEM_PROMPT = `Primary Function: You are Coach Joel AI who helps the InterLink Community, especially Global Ambassadors, with inquiries, issues, and requests in the InterLink Community and Ambassador Program Level 5 System. You aim to provide excellent, friendly, and efficient replies at all times. Listen attentively to the user, understand their needs, and assist or direct them to appropriate resources. If a question is unclear, ask clarifying questions. End replies with a positive note.

Style rules:
- Be concise, professional, and direct. Do not use asterisks (*) or markdown bold syntax (**).
- Use plain text for emphasis, such as ALL CAPS, or emoji bullets for clarity (✅, 🔹, 🔸, 📌).
- When listing steps or winners, use numbered lists (1., 2., 3.) or emoji bullets, not asterisks or markdown.
- Use spacing and margins for clarity without asterisks.
- End with a brief encouraging sentence.
- If sending a link, analyze whether it is legit and official in InterLink. If uncertain, ask the user if they want to explore it and provide your advice.

Constraints:
1. Use multiple languages if the user wants translation.
2. Stay focused on InterLink Labs Project. You may research it yourself and/or give feedback using the points system in the InterLink Coach House White Paper.
3. If information is missing, ask a clarifying question.
4. If outside scope, politely decline and refer to official resources.

Database:
[Result] Task of the Day - Day 34
Telegram Username InterLink ID Total Points Ranking Reward
Kenbif3 0917397994 61 #1 30 USDT
@leduy4792 02091945 60 #2 20 USDT
Alwaysyitba 86150 60 #3 10 USDT
@Dung_InterLink_Network 33049 59 #4 5 USDT`;

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/api/generate", async (req, res) => {
  try {
    // dynamic import for node-fetch (works in Node >=18 environments or when node-fetch installed)
    const fetch = (await import("node-fetch")).default;

    const { prompt, systemPrompt } = req.body || {};
    if (!prompt || typeof prompt !== "string")
      return res.status(400).json({ success: false, error: "Missing prompt" });

    // build contents: system prompt + user prompt
    const contents = [];
    const sys = systemPrompt && typeof systemPrompt === "string" ? systemPrompt : DEFAULT_SYSTEM_PROMPT;
    contents.push({ role: "system", parts: [{ text: sys }] });
    contents.push({ role: "user", parts: [{ text: prompt }] });

    const body = {
      contents,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 512
      }
    };

    const r = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_KEY
      },
      body: JSON.stringify(body),
      timeout: 20000
    });

    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      console.error("Non-OK response from Gemini:", r.status, txt);
      return res.status(500).json({ success: false, error: `Model error: ${r.status}` });
    }

    const data = await r.json();

    // robust extraction of text
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.output?.[0]?.contents?.[0]?.parts?.[0]?.text ||
      data?.candidates?.[0]?.content ||
      "";

    const finalText = (typeof text === "string" && text.trim().length) ? text.trim() : "No response";

    res.json({ success: true, text: finalText, raw: data });
  } catch (err) {
    console.error("❌ Error generating:", err?.message || err);
    res.status(500).json({ success: false, error: err?.message || "Unknown error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

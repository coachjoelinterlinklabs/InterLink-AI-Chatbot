// server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors()); // You can lock this down to only your frontend origin in production
app.use(express.json({ limit: "500kb" }));

// Load API key from env var
const GEMINI_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_KEY) {
  console.warn("WARNING: GEMINI_API_KEY environment variable is not set.");
}

// Simple health route
app.get("/", (req, res) => res.send("InterLink Coach Proxy is running."));

/**
 * POST /api/generate
 * body: { prompt: string, systemPrompt?: string, interlinkID?: string }
 * Returns: { success: true, text: "..." } or { success: false, error: "..." }
 */
app.post("/api/generate", async (req, res) => {
  try {
    const { prompt, systemPrompt } = req.body || {};
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ success: false, error: "Missing 'prompt' string in request body." });
    }

    // Build contents array. Include system prompt if present.
    const contents = [];
    if (systemPrompt) {
      contents.push({
        role: "system",
        parts: [{ text: systemPrompt }]
      });
    }
    contents.push({
      role: "user",
      parts: [{ text: prompt }]
    });

    // Gemini REST endpoint
    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_KEY || "" // header-based API key (recommended)
      },
      body: JSON.stringify({
        contents,
        // optional generationConfig: adjust per your needs
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 512
        }
      })
    });

    if (!resp.ok) {
      const txt = await resp.text();
      return res.status(502).json({ success: false, error: "Upstream error", details: txt });
    }

    const data = await resp.json();

    // Response format: data.candidates or data. ... check and extract the text
    // The docs show generated text in data.output[0].contents or candidates — be permissive:
    let text = "";

    // try a few possible shapes (safe parsing)
    try {
      if (Array.isArray(data?.candidates) && data.candidates[0]?.content) {
        // older style
        text = data.candidates.map(c => c.content).join("\n\n");
      } else if (Array.isArray(data?.output) && data.output[0]?.contents) {
        // newer style: output -> [ { contents: [ { text } ] } ]
        const out = data.output[0].contents;
        text = out.map(p => p.text || p).join("");
      } else if (Array.isArray(data?.candidates) && data.candidates[0]?.output) {
        text = data.candidates.map(c => c.output?.[0]?.contents?.map(p=>p.text).join("") || "").join("\n\n");
      } else if (typeof data?.text === "string") {
        text = data.text;
      } else {
        // fallback: stringify the whole object for debugging
        text = JSON.stringify(data);
      }
    } catch (e) {
      text = JSON.stringify(data);
    }

    return res.json({ success: true, text });
  } catch (err) {
    console.error("Generate error:", err);
    return res.status(500).json({ success: false, error: "Server error", details: err?.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy server listening on port ${PORT}`);
});

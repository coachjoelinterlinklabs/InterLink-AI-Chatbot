// main.js — frontend
const PROXY_ENDPOINT = "/api/generate";

const SYSTEM_PROMPT = `
You are Coach Joe AI, the official assistant for InterLink Global Network.
Always respond helpfully, professionally, and concisely.
`;

// send user question → get AI response
async function askCoach(prompt) {
  try {
    const res = await fetch(PROXY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, systemPrompt: SYSTEM_PROMPT }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.text;
  } catch (err) {
    console.error("askCoach error:", err);
    return "⚠️ Unable to reach AI server. Please try again later.";
  }
}

// Example connection test (you can remove this later)
(async () => {
  const id = localStorage.getItem("interlinkID") || "User";
  const reply = await askCoach(`Hello, my ID is ${id}`);
  console.log("AI reply:", reply);
})();

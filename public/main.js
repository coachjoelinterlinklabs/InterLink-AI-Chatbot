// main.js — Chat Frontend Logic

const PROXY_ENDPOINT = "https://interlink-ai-chatbot-production.up.railway.app/api/generate";

const SYSTEM_PROMPT = `Role:
You are Coach Joe AI, a friendly assistant for InterLink Global. 
Always greet users personally using their Telegram username or ID if provided.`;

// Selectors
const input = document.querySelector('input[placeholder="Ask Anything"]');
const sendBtn = document.querySelector("#btn-send-recording");
const chatArea = document.querySelector(".chat-area");

// Store user info
let userName = "Linker";
let hasIntroduced = false;

// Add message bubbles
function addMessage(text, from = "user") {
  const msg = document.createElement("div");
  msg.className =
    "flex items-center gap-2 w-full " +
    (from === "user" ? "flex-row-reverse" : "");
  msg.innerHTML = `
    <img
      src="${
        from === "user"
          ? "https://public.interlinklabs.ai/1761665406060_Logo.png"
          : "https://public.interlinklabs.ai/1761722972563_avt.png"
      }"
      class="w-10 h-10 rounded-full"
    />
    <div class="px-4 py-[10px] max-w-[70%] ${
      from === "user"
        ? "bg-[#1A1A1A] text-white rounded-[16px] rounded-br-[8px]"
        : "bg-[#F5F7FA] text-[#0E121B] rounded-[16px] rounded-bl-[8px]"
    }">
      <p class="text-[14px]">${text}</p>
    </div>
  `;
  chatArea.appendChild(msg);
  chatArea.scrollTop = chatArea.scrollHeight;
}

// Call backend
async function askCoach(prompt) {
  try {
    const body = { prompt, systemPrompt: SYSTEM_PROMPT };
    const res = await fetch(PROXY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Unknown error");
    return data.text;
  } catch (err) {
    console.error("askCoach error:", err);
    return "⚠️ Error connecting to server.";
  }
}

// Send message
async function sendMessage() {
  const prompt = input.value.trim();
  if (!prompt) return;

  if (!hasIntroduced && /@?\w{3,}/.test(prompt)) {
    userName = prompt.replace("@", "");
    addMessage(`Got it! Hello, ${userName} 👋`, "bot");
    hasIntroduced = true;
    input.value = "";
    return;
  }

  addMessage(prompt, "user");
  input.value = "";
  addMessage("…", "bot");

  const personalizedPrompt = hasIntroduced ? `User ${userName} says: ${prompt}` : prompt;
  const reply = await askCoach(personalizedPrompt);

  // Replace placeholder safely
  const dots = Array.from(document.querySelectorAll(".chat-area p")).find(
    (p) => p.textContent === "…"
  );
  if (dots) {
    dots.textContent = reply || "No response";
  } else {
    addMessage(reply || "No response", "bot");
  }
}

// Send on click
sendBtn?.addEventListener("click", sendMessage);
// Send on Enter
input?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

// Initial greeting
window.addEventListener("load", () => {
  addMessage(`Hello, ${userName}! 👋`, "bot");
  addMessage("You can tell me your Telegram username or ID to personalize chat.", "bot");
});

const PROXY_ENDPOINT = "/api/generate";

const SYSTEM_PROMPT = `Role:
You are Coach Joe AI, a friendly assistant for InterLink Global.
Always greet users personally using their Telegram username or ID if provided.`;

const input = document.querySelector('input[placeholder="Ask Anything"]');
const sendBtn = document.querySelector("#btn-send-recording");
const chatArea = document.querySelector(".chat-area");

let userName = "Linker";
let hasIntroduced = false;

function addMessage(text, from = "user") {
  const msg = document.createElement("div");
  msg.className =
    "flex items-center gap-2 mb-2 " +
    (from === "user" ? "flex-row-reverse" : "");
  msg.innerHTML = `
    <div class="px-3 py-2 max-w-[70%] ${
      from === "user"
        ? "bg-gray-800 text-white rounded-r-lg rounded-l-md"
        : "bg-gray-200 text-black rounded-l-lg rounded-r-md"
    }">
      <p>${text}</p>
    </div>
  `;
  chatArea.appendChild(msg);
  chatArea.scrollTop = chatArea.scrollHeight;
}

async function askCoach(prompt) {
  try {
    const res = await fetch(PROXY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, systemPrompt: SYSTEM_PROMPT }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Unknown error");
    return data.text;
  } catch (err) {
    console.error("askCoach error:", err);
    return "⚠️ Error connecting to server.";
  }
}

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

  const personalizedPrompt = hasIntroduced
    ? `User ${userName} says: ${prompt}`
    : prompt;

  const reply = await askCoach(personalizedPrompt);

  const dots = Array.from(chatArea.querySelectorAll("p")).reverse().find(p => p.textContent === "…");
  if (dots) dots.textContent = reply || "No response";
}

sendBtn?.addEventListener("click", sendMessage);
input?.addEventListener("keydown", (e) => { if (e.key === "Enter") sendMessage(); });

window.addEventListener("load", () => {
  addMessage(`Hello, ${userName}! 👋`, "bot");
  addMessage("You can tell me your Telegram username or ID to personalize chat.", "bot");
});

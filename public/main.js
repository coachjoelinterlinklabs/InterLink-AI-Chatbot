// main.js — frontend
const PROXY_ENDPOINT = "/api/generate";

const SYSTEM_PROMPT = `
You are Coach Joe AI, the official assistant for InterLink Global Network.
Always respond helpfully, professionally, and concisely.
`;

// === ELEMENTS ===
const chatArea = document.querySelector(".chat-area");
const input = document.querySelector("input[placeholder='Ask Anything']");
const sendBtn = document.getElementById("btn-send-recording");

// === UTILITIES ===
function addMessage(text, sender = "bot") {
  const msgWrap = document.createElement("div");
  msgWrap.classList.add("flex", "items-center", "gap-2", "w-full");
  if (sender === "user") msgWrap.classList.add("flex-row-reverse");

  const avatar = document.createElement("img");
  avatar.src =
    sender === "user"
      ? "https://public.interlinklabs.ai/1761721359159_Ellipse.png"
      : "https://public.interlinklabs.ai/1761722972563_avt.png";
  avatar.classList.add("w-10", "h-10", "rounded-full");

  const bubble = document.createElement("div");
  bubble.classList.add(
    "px-4",
    "py-[10px]",
    "max-w-[70%]",
    "rounded-[16px]",
    sender === "user" ? "bg-[#1A1A1A]" : "bg-[#F5F7FA]",
    sender === "user" ? "text-white" : "text-[#0E121B]",
    sender === "user" ? "rounded-br-[8px]" : "rounded-bl-[8px]"
  );

  const textEl = document.createElement("p");
  textEl.classList.add("text-[14px]");
  textEl.textContent = text;
  bubble.appendChild(textEl);

  msgWrap.appendChild(avatar);
  msgWrap.appendChild(bubble);

  chatArea.appendChild(msgWrap);
  chatArea.scrollTop = chatArea.scrollHeight;

  return textEl;
}

// === MAIN FUNCTION ===
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

// === SEND MESSAGE ===
async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;
  const userID = localStorage.getItem("interlinkID") || "User";

  // Add user message to chat
  addMessage(text, "user");
  input.value = "";

  // Show loading
  const loadingEl = addMessage("...", "bot");

  // Ask AI
  const reply = await askCoach(`Hello, ${userID}. ${text}`);

  // Replace "..." with AI reply
  loadingEl.textContent = reply;
}

// === EVENT LISTENERS ===
sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

// === INITIAL TEST ===
(async () => {
  const id = localStorage.getItem("interlinkID") || "User";
  const reply = await askCoach(`Hello, my ID is ${id}`);
  console.log("✅ AI connection test:", reply);
})();

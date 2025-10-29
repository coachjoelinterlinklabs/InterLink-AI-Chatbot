/* ==========================
   Client-side Script
========================== */
let currentUser = null;
let localMemory = [];
let ttsEnabled = true;
let currentUtterance = null;

const identityInput = document.getElementById('identity');
const signinBtn = document.getElementById('signin');
const clearBtn = document.getElementById('clear');
const ambListEl = document.getElementById('amb-list');
const greetingEl = document.getElementById('greeting');
const statusEl = document.getElementById('status');
const chatArea = document.getElementById('chat-area');
const composer = document.getElementById('composer');
const sendBtn = document.getElementById('send');
const voiceBtn = document.getElementById('voiceBtn');
const ttsToggle = document.getElementById('tts-toggle');
const micToggle = document.getElementById('mic-toggle');
const logoutBtn = document.getElementById('logout');

function status(text) { statusEl.textContent = 'Status: ' + text; }

function addMessage(role, text) {
  if (currentUser) {
    localMemory.push({ role, text });
    localStorage.setItem('coachjoel_mem_' + currentUser, JSON.stringify(localMemory));
  }
  appendMessage(role, text);
}

function appendMessage(role, text) {
  const row = document.createElement('div');
  row.className = 'msg ' + (role === 'user' ? 'user' : 'ai');
  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  avatar.textContent = role === 'user' ? 'U' : 'C';
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = text;
  row.appendChild(avatar);
  row.appendChild(bubble);
  chatArea.appendChild(row);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function renderChat() {
  chatArea.innerHTML = '';
  localMemory.forEach(m => appendMessage(m.role, m.text));
}

signinBtn.onclick = () => {
  const id = identityInput.value.trim();
  if (!id) return alert('Enter Telegram username or InterLink ID');
  currentUser = id;
  greetingEl.textContent = `Hello, ${currentUser}`;
  status('Ready');
  localMemory = JSON.parse(localStorage.getItem('coachjoel_mem_' + currentUser)) || [];
  renderChat();
};

logoutBtn.onclick = () => {
  currentUser = null;
  greetingEl.textContent = 'Sign in to begin';
  chatArea.innerHTML = '';
  status('Idle');
};

clearBtn.onclick = () => {
  if (!currentUser) return alert('Sign in first');
  if (confirm('Clear chat for ' + currentUser + '?')) {
    localStorage.removeItem('coachjoel_mem_' + currentUser);
    localMemory = [];
    renderChat();
    status('Cleared');
  }
};

composer.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

sendBtn.onclick = sendMessage;

async function sendMessage() {
  const msg = composer.value.trim();
  if (!msg || !currentUser) return;
  composer.value = '';
  addMessage('user', msg);
  status('Thinking...');
  
  const res = await fetch('/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: msg })
  });
  
  const data = await res.json();
  addMessage('ai', data.reply);
  speakText(data.reply);
  status('Ready');
}

/* ---------- Text-to-Speech ---------- */
ttsToggle.onclick = () => {
  ttsEnabled = !ttsEnabled;
  ttsToggle.textContent = ttsEnabled ? '🔊 TTS: On' : '🔇 TTS: Off';
};

function speakText(text) {
  if (!ttsEnabled || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'en-US';
  utter.rate = 1;
  utter.pitch = 1;
  window.speechSynthesis.speak(utter);
}

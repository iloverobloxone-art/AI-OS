const chat = document.getElementById('chat');
const userInput = document.getElementById('userInput');
const modelSelect = document.getElementById('model');
const apikeyInput = document.getElementById('apikey');
const sendBtn = document.getElementById('sendBtn');
const historyEl = document.getElementById('history');
const newChatBtn = document.getElementById('newChat');
const shareBtn = document.getElementById('shareBtn');
const shareMenu = document.getElementById('shareMenu');

const aiosPrompt = "You are AI-OS. You are a highly advanced operating system AI assistant. Speak in a helpful, friendly, efficient, and slightly witty tone. Always begin responses with 'AI-OS here:'.";

let conversationHistory = [];

// Share message
const shareText = encodeURIComponent(
  "🚀 Check out AI-OS – the Multi-Model AI Assistant!\n🤖 Smart answers, multiple AIs, all in one elegant platform.\n🔗 Try it now: " + window.location.href
);
const siteUrl = encodeURIComponent(window.location.href);
const socialLinks = {
  tw: `https://twitter.com/intent/tweet?text=${shareText}&url=${siteUrl}`,
  reddit: `https://www.reddit.com/submit?url=${siteUrl}&title=${shareText}`,
  linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${siteUrl}`,
  facebook: `https://www.facebook.com/sharer.php?u=${siteUrl}`
};

sendBtn.onclick = sendMessage;
userInput.addEventListener("keydown", e => { if (e.key === "Enter") sendMessage(); });
newChatBtn.onclick = () => { conversationHistory = []; updateChat(); };

function injectPersona(model, userText) {
  if (model === "aios") {
    return { system: aiosPrompt, user: userText };
  }
  return { system: null, user: userText };
}

function updateChat() {
  chat.innerHTML = '';
  for (const msg of conversationHistory) {
    appendMsg(msg.role, msg.text);
  }
  updateHistory();
}

function updateHistory() {
  historyEl.innerHTML = '';
  if (conversationHistory.length > 0) {
    const first = conversationHistory.find(msg => msg.role === "user");
    const item = document.createElement("li");
    item.textContent = first ? first.text.slice(0, 32) + "..." : "Untitled Chat";
    item.onclick = () => updateChat(); // In real UI, load conversation
    historyEl.appendChild(item);
  }
}

async function sendMessage() {
  const input = userInput.value.trim();
  if (!input) return;

  conversationHistory.push({role: "user", text: input});
  updateChat();
  userInput.value = "";

  const model = modelSelect.value;
  const apikey = apikeyInput.value.trim();
  const { system, user } = injectPersona(model, input);

  let endpoint, headers, body;
  switch(model === "aios" ? modelSelect.options[0].value : model) {
    case 'openai':
      endpoint = "https://api.openai.com/v1/chat/completions";
      headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apikey}`
      };
      body = JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          ...(system ? [{role: "system", content: system}] : []),
          ...conversationHistory.filter(msg => msg.role === "user").map(msg => ({role: "user", content: msg.text}))
        ]
      });
      break;
    case 'claude':
      endpoint = "https://api.anthropic.com/v1/messages";
      headers = {
        "Content-Type": "application/json",
        "x-api-key": apikey,
        "anthropic-version": "2023-06-01"
      };
      body = JSON.stringify({
        model: "claude-2.1",
        messages: [
          ...(system ? [{role: "system", content: system}] : []),
          ...conversationHistory.filter(msg => msg.role === "user").map(msg => ({role: "user", content: msg.text}))
        ],
        max_tokens: 400
      });
      break;
    case 'gemini':
      endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
      headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": apikey
      };
      body = JSON.stringify({
        contents: [
          ...(system ? [{parts: [{text: system}]}] : []),
          ...conversationHistory.filter(msg => msg.role === "user").map(msg => ({parts: [{text: msg.text}]}))
        ]
      });
      break;
    case 'perplexity':
      endpoint = "https://api.perplexity.ai/chat/completions";
      headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apikey}`
      };
      body = JSON.stringify({
        model: "pplx-70b-online",
        messages: [
          ...(system ? [{role: "system", content: system}] : []),
          ...conversationHistory.filter(msg => msg.role === "user").map(msg => ({role: "user", content: msg.text}))
        ],
        max_tokens: 400
      });
      break;
    default:
      conversationHistory.push({role: "bot", text: "Unknown model selected."});
      updateChat();
      return;
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body
    });
    if (!response.ok) {
      const error = await response.text();
      conversationHistory.push({role: "bot", text: "API Error: " + error});
      updateChat();
      return;
    }
    const data = await response.json();
    let botMsg;
    if (model === "openai" || (model === "aios")) {
      botMsg = data.choices[0].message.content;
    } else if (model === "claude") {
      botMsg = data?.choices?.[0]?.message?.content || data?.content || "No response";
    } else if (model === "gemini") {
      botMsg = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
    } else if (model === "perplexity") {
      botMsg = data.choices?.[0]?.message?.content || "No response";
    }
    conversationHistory.push({role: "bot", text: botMsg});
    updateChat();
  } catch (err) {
    conversationHistory.push({role: "bot", text: "Network or code error: " + err.message});
    updateChat();
  }
}

function appendMsg(role, text) {
  const div = document.createElement('div');
  div.className = role + "-msg";
  div.textContent = role === "user" ? text : text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

// Share button logic
shareBtn.onclick = () => {
  shareMenu.style.display = 'block';
};

document.querySelector('.social-btn.linkedin').onclick = () => window.open(socialLinks.linkedin, '_blank');
document.querySelector('.social-btn.reddit').onclick = () => window.open(socialLinks.reddit, '_blank');
document.querySelector('.social-btn.facebook').onclick = () => window.open(socialLinks.facebook, '_blank');
document.querySelector('.social-btn.tw').onclick = () => window.open(socialLinks.tw, '_blank');
document.querySelector('.social-btn.close').onclick = () => shareMenu.style.display = 'none';

// Web Share API fallback for supported browsers
if (navigator.share) {
  shareBtn.onclick = () => navigator.share({
    title: "AI-OS: Multi-Model AI Assistant",
    text: decodeURIComponent(shareText),
    url: window.location.href
  }).catch(() => { shareMenu.style.display = 'block'; });
}

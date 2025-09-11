const chat = document.getElementById('chat');
const userInput = document.getElementById('userInput');
const modelSelect = document.getElementById('model');
const sendBtn = document.getElementById('sendBtn');

const aiosPrompt = "You are AI-OS. Respond as a premium, liquid-glass OS assistant, helpful, modern, and to-the-point.";

let conversationHistory = [];

const YOUR_API_KEY = "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"; // <-- replace with your real key

sendBtn.onclick = sendMessage;
userInput.addEventListener("keydown", e => { if (e.key === "Enter") sendMessage(); });

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
}

async function sendMessage() {
  const input = userInput.value.trim();
  if (!input) return;
  conversationHistory.push({role: "user", text: input});
  updateChat();
  userInput.value = "";

  const model = modelSelect.value;
  const { system, user } = injectPersona(model, input);

  let endpoint, headers, body;
  switch(model) {
    case 'openai':
    case 'aios':
      endpoint = "https://api.openai.com/v1/chat/completions";
      headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${YOUR_API_KEY}`
      };
      body = JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          ...(system ? [{role: "system", content: system}] : []),
          ...conversationHistory.filter(msg => msg.role === "user").map(msg => ({role: "user", content: msg.text}))
        ]
      });
      break;
    // Add other models as needed
    default:
      conversationHistory.push({role: "bot", text: "Model not supported in this demo."});
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
    let botMsg = data.choices?.[0]?.message?.content || "No response";
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
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

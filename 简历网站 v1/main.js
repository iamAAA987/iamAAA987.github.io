document.addEventListener('DOMContentLoaded', () => {
    const chatBubble = document.getElementById('chat-bubble');
    const chatWindow = document.getElementById('chat-window');
    const closeChat = document.getElementById('close-chat');
    const sendButton = document.getElementById('send-button');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');

    // --- State ---
    let resumeData = null;

    // --- Initialization ---
    async function initialize() {
        try {
            const response = await fetch('resume.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            resumeData = await response.json();
        } catch (error) {
            console.error("Could not load resume data:", error);
            addMessage("抱歉，我无法加载简历信息，暂时无法回答您的问题。", "assistant");
        }
    }

    // --- Event Listeners ---
    chatBubble.addEventListener('click', () => toggleChatWindow());
    closeChat.addEventListener('click', () => toggleChatWindow());
    sendButton.addEventListener('click', () => sendMessage());
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // --- Functions ---
    function toggleChatWindow() {
        chatWindow.classList.toggle('hidden');
        if (!chatWindow.classList.contains('hidden')) {
            chatInput.focus();
        }
    }

    async function sendMessage() {
        const messageText = chatInput.value.trim();
        if (messageText === '' || !resumeData) {
            if (!resumeData) {
                 addMessage("数据还未准备好，请稍等片刻。", "assistant");
            }
            return;
        };

        addMessage(messageText, 'user');
        chatInput.value = '';
        showTypingIndicator();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question: messageText,
                    resumeData: resumeData 
                }),
            });

            hideTypingIndicator();

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Request failed with status ${response.status}`);
            }

            const data = await response.json();
            addMessage(data.reply, 'assistant');

        } catch (error) {
            console.error('Error calling chat API:', error);
            hideTypingIndicator(); // Ensure indicator is hidden on error
            addMessage(`抱歉，出错了: ${error.message}`, 'assistant');
        }
    }

    function addMessage(text, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender);
        messageElement.textContent = text;
        chatMessages.appendChild(messageElement);
        scrollToBottom();
    }

    function showTypingIndicator() {
        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('message', 'assistant');
        typingIndicator.id = 'typing-indicator';
        typingIndicator.innerHTML = '<span>.</span><span>.</span><span>.</span>';
        chatMessages.appendChild(typingIndicator);
        scrollToBottom();
    }

    function hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            chatMessages.removeChild(typingIndicator);
        }
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // --- Start ---
    initialize();
}); 
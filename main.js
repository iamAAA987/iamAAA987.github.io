document.addEventListener('DOMContentLoaded', () => {
    const chatWidgetContainer = document.getElementById('chat-widget-container');
    const chatBubble = document.getElementById('chat-bubble');
    const chatWindow = document.getElementById('chat-window');
    const closeChat = document.getElementById('close-chat');
    const sendButton = document.getElementById('send-button');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');

    // --- State ---
    let resumeData = null;
    let isDragging = false;
    let dragStartX, dragStartY;
    let widgetStartX, widgetStartY;
    let hasDragged = false;

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
        // Set initial position of the widget
        chatWidgetContainer.style.right = '30px';
        chatWidgetContainer.style.bottom = '30px';
        chatWidgetContainer.style.opacity = '1';
    }

    // --- Event Listeners ---
    chatBubble.addEventListener('mousedown', onDragStart);
    closeChat.addEventListener('click', () => toggleChatWindow());
    sendButton.addEventListener('click', () => sendMessage());
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // --- Drag and Drop Functions ---
    function onDragStart(e) {
        isDragging = true;
        hasDragged = false;
        // Prevent text selection while dragging
        e.preventDefault();

        dragStartX = e.clientX;
        dragStartY = e.clientY;

        // Use getBoundingClientRect for more accurate positioning
        const rect = chatWidgetContainer.getBoundingClientRect();
        widgetStartX = rect.left;
        widgetStartY = rect.top;
        
        // Listen for move and up events on the whole window
        document.addEventListener('mousemove', onDragging);
        document.addEventListener('mouseup', onDragEnd);
    }

    function onDragging(e) {
        if (!isDragging) return;
        
        const deltaX = e.clientX - dragStartX;
        const deltaY = e.clientY - dragStartY;

        // If moved more than a few pixels, consider it a drag
        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
            hasDragged = true;
        }

        let newLeft = widgetStartX + deltaX;
        let newTop = widgetStartY + deltaY;

        // Boundary checks to keep the widget on screen
        const widgetRect = chatWidgetContainer.getBoundingClientRect();
        const bodyRect = document.body.getBoundingClientRect();

        if (newLeft < 0) newLeft = 0;
        if (newTop < 0) newTop = 0;
        if (newLeft + widgetRect.width > bodyRect.width) newLeft = bodyRect.width - widgetRect.width;
        if (newTop + widgetRect.height > bodyRect.height) newTop = bodyRect.height - widgetRect.height;

        // Use transform for smoother animation if possible, but top/left is fine
        chatWidgetContainer.style.left = `${newLeft}px`;
        chatWidgetContainer.style.top = `${newTop}px`;
        // Unset right/bottom so they don't conflict with left/top
        chatWidgetContainer.style.right = 'auto';
        chatWidgetContainer.style.bottom = 'auto';
    }

    function onDragEnd() {
        isDragging = false;
        document.removeEventListener('mousemove', onDragging);
        document.removeEventListener('mouseup', onDragEnd);

        // If we haven't dragged, it's a click
        if (!hasDragged) {
            toggleChatWindow();
        }
    }

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
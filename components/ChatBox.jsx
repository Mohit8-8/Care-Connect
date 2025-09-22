import { useState, useEffect, useRef } from 'react';

const ChatBox = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();

      if (data.response) {
        const aiMessage = { sender: 'ai', text: data.response };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        const errorMessage = { sender: 'ai', text: 'Error: No response from AI' };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage = { sender: 'ai', text: 'Error: Failed to fetch AI response' };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[70vh]">
      <div className="flex-1 bg-gradient-to-b from-gray-50 to-white p-4 rounded-lg overflow-y-auto mb-4 border border-gray-200 shadow-inner">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-lg">👋 Welcome to Medicine AI Chatbot!</p>
            <p className="text-sm mt-2">Ask me about diseases or request medicine suggestions.</p>
          </div>
        )}
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex mb-4 animate-fade-in ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start max-w-xs ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg ${msg.sender === 'user' ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-green-500 to-green-600'}`}>
                {msg.sender === 'user' ? 'U' : '🤖'}
              </div>
              <div
                className={`mx-3 p-4 rounded-2xl max-w-xs break-words shadow-lg ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md'
                    : 'bg-white text-gray-800 rounded-bl-md border border-gray-200'
                }`}
              >
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex bg-white rounded-lg shadow-md border border-gray-200">
        <input
          type="text"
          placeholder="Ask about medicine or disease..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 p-4 border-0 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
        />
        <button
          onClick={sendMessage}
          className="px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-r-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 font-semibold"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatBox;

import { useState, useEffect, useRef } from 'react';

const ChatBox = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

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
        const errorMessage = { sender: 'ai', text: `Error: ${data.error || 'No response from AI'}` };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      let errorText = 'Error: Failed to fetch AI response';
      if (error.message) {
        errorText += ` - ${error.message}`;
      }
      const errorMessage = { sender: 'ai', text: errorText };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[80vh] bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-2xl">
      <div className="flex-1 bg-white/10 shadow-lg backdrop-blur-sm p-4 rounded-lg overflow-y-auto mb-4 border border-white/20 shadow-inner">
        {messages.length === 0 && (
          <div className="text-center text-white mt-8">
            <div className="mb-6">
              <span className="text-6xl">🩺</span>
            </div>
            <p className="text-xl font-semibold text-white mb-2">Welcome to Dr. MedBot!</p>
            <p className="text-sm mb-4 text-white/80">Your AI medical assistant for general health information</p>

            {/* Medical Disclaimer */}
            <div className="bg-yellow-50/90 shadow-lg backdrop-blur-sm border-l-4 border-yellow-400 p-4 rounded-r-lg mb-6">
              <p className="text-yellow-800 text-sm">
                <strong>⚠️ Important:</strong> This AI provides general health information only.
                Always consult healthcare professionals for medical concerns.
              </p>
            </div>

            {/* Quick Questions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
              {['Diarrhea medicine?', 'Cold symptoms?', 'Headache relief?', 'Fever treatment?', 'Health tips?'].map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInput(question)}
                  className="bg-white/20 hover:bg-white/30 text-white text-sm p-3 rounded-lg transition-colors duration-200 shadow-lg backdrop-blur-sm"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex mb-4 animate-fade-in ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start max-w-xs ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg ${msg.sender === 'user' ? 'bg-gradient-to-r from-blue-400 to-blue-500' : 'bg-gradient-to-r from-green-400 to-green-500'}`}>
                {msg.sender === 'user' ? '👤' : '🩺'}
              </div>
              <div
                className={`mx-3 p-4 rounded-2xl max-w-xs break-words shadow-lg ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-br-md'
                    : 'bg-white/90 shadow-lg backdrop-blur-sm text-gray-800 rounded-bl-md border border-white/30'
                }`}
              >
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="flex items-start max-w-xs">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg bg-gradient-to-r from-green-400 to-green-500">
                🩺
              </div>
              <div className="mx-3 p-4 rounded-2xl bg-white/90 shadow-lg backdrop-blur-sm text-gray-800 rounded-bl-md border border-white/30">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex bg-white/10 shadow-lg backdrop-blur-sm rounded-lg shadow-md border border-white/20">
        <input
          type="text"
          placeholder="Ask about symptoms, general health advice, or medical information..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          className="flex-1 p-4 border-0 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-white/60 disabled:opacity-50 bg-transparent"
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          className="px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg backdrop-blur-sm border-2 border-white/40 hover:border-white/60 flex items-center justify-center"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>
      </div>

      {/* Medical Categories */}
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="text-xs text-white/80">Quick categories:</span>
        {['Symptoms', 'Prevention', 'General Health'].map((category) => (
          <button
            key={category}
            onClick={() => setInput(`Tell me about ${category.toLowerCase()}`)}
            className="text-xs bg-white/20 hover:bg-white/30 text-white px-2 py-1 rounded-full transition-colors duration-200 shadow-lg backdrop-blur-sm"
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChatBox;

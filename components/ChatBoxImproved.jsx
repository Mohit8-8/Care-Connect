import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import LoadingSkeleton from './LoadingSkeleton';
import LanguageSelector from './LanguageSelector';
import { detectLanguage, translateText, getLanguageName } from '../lib/translationService';

// Debounce hook for input optimization
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Memoized message component for better performance
const MessageBubble = memo(({ msg, index }) => {
  const isUser = msg.sender === 'user';

  return (
    <div
      key={index}
      className={`flex mb-4 animate-fade-in ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex items-start max-w-xs ${isUser ? 'flex-row-reverse' : ''}`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg overflow-hidden ${isUser ? 'bg-gradient-to-r from-blue-400 to-blue-500' : 'bg-gradient-to-r from-green-400 to-green-500'}`} style={{ fontFamily: 'Apple Color Emoji, Segoe UI Emoji, NotoColorEmoji, Segoe UI Symbol, Android Emoji, EmojiSymbols', lineHeight: '1', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {isUser ? '👤' : '⚕️'}
        </div>
        <div
          className={`mx-3 p-4 rounded-2xl max-w-xs break-words shadow-lg ${
            isUser
              ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-br-md'
              : 'bg-white/90 shadow-lg backdrop-blur-sm text-gray-800 rounded-bl-md border border-white/30'
          }`}
        >
          {msg.text}
        </div>
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';

const ChatBox = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => Date.now().toString()); // Generate unique session ID
  const [currentLanguage, setCurrentLanguage] = useState('en'); // Default to English
  const [detectedLanguage, setDetectedLanguage] = useState('en');
  const messagesEndRef = useRef(null);

  // Debounce input to prevent excessive API calls
  const debouncedInput = useDebounce(input, 300);

  // Load conversation from session storage on component mount
  useEffect(() => {
    const savedConversation = sessionStorage.getItem(`chat_${sessionId}`);
    if (savedConversation) {
      try {
        setMessages(JSON.parse(savedConversation));
      } catch (error) {
        console.error('Error loading saved conversation:', error);
      }
    }
  }, [sessionId]);

  // Save conversation to session storage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem(`chat_${sessionId}`, JSON.stringify(messages));
    }
  }, [messages, sessionId]);

  // Optimized scroll function
  const scrollToBottom = useCallback(() => {
    // Use requestAnimationFrame for smooth scrolling
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Memoize conversation history to prevent unnecessary recalculations
  const conversationHistory = useMemo(() => {
    return messages.slice(-20).map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));
  }, [messages]);

  // Detect language when input changes
  useEffect(() => {
    if (debouncedInput.trim()) {
      detectLanguage(debouncedInput).then(lang => {
        setDetectedLanguage(lang);
        // Auto-switch to detected language if it's different and supported
        if (lang !== 'en' && lang !== currentLanguage) {
          setCurrentLanguage(lang);
        }
      });
    }
  }, [debouncedInput, currentLanguage]);

  // Memoize send message function
  const sendMessage = useCallback(async () => {
    if (!debouncedInput.trim() || isLoading) return;

    const userMessage = {
      sender: 'user',
      text: debouncedInput,
      timestamp: new Date().toISOString(),
      language: currentLanguage
    };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Translate user message to English for AI processing
      const englishMessage = currentLanguage === 'en'
        ? debouncedInput
        : await translateText(debouncedInput, 'en', currentLanguage);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: englishMessage,
          conversationHistory,
          sessionId,
          userLanguage: currentLanguage
        }),
      });

      const data = await response.json();

      if (data.response) {
        // Translate AI response back to user's language
        const translatedResponse = currentLanguage === 'en'
          ? data.response
          : await translateText(data.response, currentLanguage, 'en');

        const aiMessage = {
          sender: 'ai',
          text: translatedResponse,
          timestamp: new Date().toISOString(),
          language: currentLanguage
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        const errorMessage = {
          sender: 'ai',
          text: `Error: ${data.error || 'No response from AI'}`,
          timestamp: new Date().toISOString(),
          language: currentLanguage
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      let errorText = 'Error: Failed to fetch AI response';
      if (error.message) {
        errorText += ` - ${error.message}`;
      }
      const errorMessage = {
        sender: 'ai',
        text: errorText,
        timestamp: new Date().toISOString(),
        language: currentLanguage
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedInput, isLoading, messages, conversationHistory, sessionId, currentLanguage]);

  // Memoize key handler
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (debouncedInput.trim() && !isLoading) {
        sendMessage();
      }
    }
  }, [debouncedInput, isLoading, sendMessage]);

  // Language-specific content
  const getLanguageContent = (lang) => {
    const content = {
      'en': {
        welcomeTitle: 'Welcome to Dr. MedBot!',
        welcomeSubtitle: 'Your AI medical assistant for general health information',
        disclaimer: '⚠️ Important: This AI provides general health information only. Always consult healthcare professionals for medical concerns.',
        placeholder: 'Ask about symptoms, general health advice, or medical information...',
        quickCategories: 'Quick categories:',
        categories: ['Symptoms', 'Prevention', 'General Health'],
        questions: ['Diarrhea medicine?', 'Cold symptoms?', 'Headache relief?', 'Fever treatment?', 'Health tips?']
      },
      'hi': {
        welcomeTitle: 'डॉ. मेडबॉट में आपका स्वागत है!',
        welcomeSubtitle: 'सामान्य स्वास्थ्य जानकारी के लिए आपका AI मेडिकल असिस्टेंट',
        disclaimer: '⚠️ महत्वपूर्ण: यह AI केवल सामान्य स्वास्थ्य जानकारी प्रदान करता है। चिकित्सा संबंधी चिंताओं के लिए हमेशा स्वास्थ्य पेशेवरों से सलाह लें।',
        placeholder: 'लक्षण, सामान्य स्वास्थ्य सलाह, या चिकित्सा जानकारी के बारे में पूछें...',
        quickCategories: 'त्वरित श्रेणियां:',
        categories: ['लक्षण', 'निवारण', 'सामान्य स्वास्थ्य'],
        questions: ['दस्त की दवा?', 'सर्दी के लक्षण?', 'सिरदर्द राहत?', 'बुखार उपचार?', 'स्वास्थ्य युक्तियां?']
      },
      'bn': {
        welcomeTitle: 'ডাঃ মেডবটে স্বাগতম!',
        welcomeSubtitle: 'সাধারণ স্বাস্থ্য তথ্যের জন্য আপনার AI মেডিকেল সহকারী',
        disclaimer: '⚠️ গুরুত্বপূর্ণ: এই AI শুধুমাত্র সাধারণ স্বাস্থ্য তথ্য প্রদান করে। চিকিৎসা সংক্রান্ত উদ্বেগের জন্য সর্বদা স্বাস্থ্য পেশাদারদের সাথে পরামর্শ করুন।',
        placeholder: 'লক্ষণ, সাধারণ স্বাস্থ্য পরামর্শ, বা চিকিৎসা তথ্য সম্পর্কে জিজ্ঞাসা করুন...',
        quickCategories: 'দ্রুত বিভাগ:',
        categories: ['লক্ষণ', 'প্রতিরোধ', 'সাধারণ স্বাস্থ্য'],
        questions: ['ডায়রিয়ার ওষুধ?', 'সর্দির লক্ষণ?', 'মাথাব্যথা উপশম?', 'জ্বর চিকিৎসা?', 'স্বাস্থ্য টিপস?']
      },
      'pa': {
        welcomeTitle: 'ਡਾ. ਮੈਡਬੌਟ ਵਿੱਚ ਜੀ ਆਇਆਂ ਨੂੰ!',
        welcomeSubtitle: 'ਆਮ ਸਿਹਤ ਜਾਣਕਾਰੀ ਲਈ ਤੁਹਾਡਾ AI ਮੈਡੀਕਲ ਸਹਾਇਕ',
        disclaimer: '⚠️ ਮਹੱਤਵਪੂਰਨ: ਇਹ AI ਸਿਰਫ਼ ਆਮ ਸਿਹਤ ਜਾਣਕਾਰੀ ਪ੍ਰਦਾਨ ਕਰਦਾ ਹੈ। ਮੈਡੀਕਲ ਚਿੰਤਾਵਾਂ ਲਈ ਹਮੇਸ਼ਾ ਸਿਹਤ ਪੇਸ਼ੇਵਰਾਂ ਨਾਲ ਸਲਾਹ ਕਰੋ।',
        placeholder: 'ਲੱਛਣ, ਆਮ ਸਿਹਤ ਸਲਾਹ, ਜਾਂ ਮੈਡੀਕਲ ਜਾਣਕਾਰੀ ਬਾਰੇ ਪੁੱਛੋ...',
        quickCategories: 'ਤੇਜ਼ ਸ਼੍ਰੇਣੀਆਂ:',
        categories: ['ਲੱਛਣ', 'ਰੋਕਥਾਮ', 'ਆਮ ਸਿਹਤ'],
        questions: ['ਦਸਤ ਦੀ ਦਵਾਈ?', 'ਸਰਦੀ ਦੇ ਲੱਛਣ?', 'ਸਿਰਦਰਦ ਰਾਹਤ?', 'ਬੁਖਾਰ ਇਲਾਜ?', 'ਸਿਹਤ ਸੁਝਾਅ?']
      },
      'te': {
        welcomeTitle: 'డాక్టర్ మెడ్‌బాట్‌కు స్వాగతం!',
        welcomeSubtitle: 'సాధారణ ఆరోగ్య సమాచారం కోసం మీ AI మెడికల్ అసిస్టెంట్',
        disclaimer: '⚠️ ముఖ్యమైనది: ఈ AI సాధారణ ఆరోగ్య సమాచారం మాత్రమే అందిస్తుంది. వైద్య సంబంధిత ఆందోళనలకు ఎల్లప్పుడూ ఆరోగ్య నిపుణులను సంప్రదించండి.',
        placeholder: 'లక్షణాలు, సాధారణ ఆరోగ్య సలహాలు, లేదా వైద్య సమాచారం గురించి అడగండి...',
        quickCategories: 'త్వరిత వర్గాలు:',
        categories: ['లక్షణాలు', 'నివారణ', 'సాధారణ ఆరోగ్యం'],
        questions: ['విరేచనాల మందులు?', 'జలుబు లక్షణాలు?', 'తలనొప్పి ఉపశమనం?', 'జ్వర చికిత్స?', 'ఆరోగ్య చిట్కాలు?']
      }
    };
    return content[lang] || content['en'];
  };

  const langContent = getLanguageContent(currentLanguage);

  return (
    <div className="flex flex-col h-full max-h-[80vh] bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-2xl">
      {/* Language Selector */}
      <div className="flex justify-between items-center p-4 border-b border-white/20">
        <div className="flex items-center space-x-2">
          <span className="text-white text-sm font-medium">Language:</span>
          <LanguageSelector
            currentLanguage={currentLanguage}
            onLanguageChange={setCurrentLanguage}
            disabled={isLoading}
          />
        </div>
        {detectedLanguage !== currentLanguage && (
          <div className="text-white/80 text-xs">
            Detected: {getLanguageName(detectedLanguage)}
          </div>
        )}
      </div>

      <div className="flex-1 bg-white/10 shadow-lg backdrop-blur-sm p-4 rounded-lg overflow-y-auto mb-4 border border-white/20 shadow-inner">
        {messages.length === 0 && (
          <div className="text-center text-white mt-8">
            <div className="mb-6">
              <span className="text-6xl" style={{ fontFamily: 'Apple Color Emoji, Segoe UI Emoji, NotoColorEmoji, Segoe UI Symbol, Android Emoji, EmojiSymbols', lineHeight: '1', textAlign: 'center', display: 'inline-block' }}>⚕️</span>
            </div>
            <p className="text-xl font-semibold text-white mb-2">{langContent.welcomeTitle}</p>
            <p className="text-sm mb-4 text-white/80">{langContent.welcomeSubtitle}</p>

            {/* Medical Disclaimer */}
            <div className="bg-yellow-50/90 shadow-lg backdrop-blur-sm border-l-4 border-yellow-400 p-4 rounded-r-lg mb-6">
              <p className="text-yellow-800 text-sm">
                <strong>⚠️ Important:</strong> {langContent.disclaimer}
              </p>
            </div>

            {/* Quick Questions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
              {langContent.questions.map((question, index) => (
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
        {/* Memoized message list */}
        {messages.map((msg, index) => (
          <MessageBubble key={`${msg.timestamp}-${index}`} msg={msg} index={index} />
        ))}
        {isLoading && <LoadingSkeleton />}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex bg-white/10 shadow-lg backdrop-blur-sm rounded-lg shadow-md border border-white/20">
        <input
          type="text"
          placeholder={langContent.placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          className="flex-1 p-4 border-0 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-white/60 disabled:opacity-50 bg-transparent"
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !debouncedInput.trim()}
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
        <span className="text-xs text-white/80">{langContent.quickCategories}</span>
        {langContent.categories.map((category) => (
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

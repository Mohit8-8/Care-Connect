import { NextResponse } from 'next/server';

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || 'REMOVED';

// Simple in-memory cache for API responses
const responseCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Clean up expired cache entries
const cleanExpiredCache = () => {
  const now = Date.now();
  for (const [key, value] of responseCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      responseCache.delete(key);
    }
  }
};

// Clean cache every 5 minutes
setInterval(cleanExpiredCache, 5 * 60 * 1000);

export async function POST(request) {
  try {
    const { message, conversationHistory = [], sessionId, userLanguage = 'en' } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Create cache key from message, recent conversation context, and user language
    const recentContext = conversationHistory.slice(-3).map(msg => msg.content).join('|');
    const cacheKey = `${message}|${recentContext}|${userLanguage}`;

    // Check cache first
    const cachedResponse = responseCache.get(cacheKey);
    if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_TTL) {
      console.log('Returning cached response for:', message);
      return NextResponse.json({ response: cachedResponse.data });
    }

    // Store conversation in memory (in production, use a database)
    if (!global.chatSessions) {
      global.chatSessions = new Map();
    }

    // Initialize or update session
    if (!global.chatSessions.has(sessionId)) {
      global.chatSessions.set(sessionId, []);
    }

    const sessionMessages = global.chatSessions.get(sessionId);
    sessionMessages.push({ role: 'user', content: message });

    // Limit session to last 50 messages to prevent memory issues
    if (sessionMessages.length > 50) {
      sessionMessages.splice(0, sessionMessages.length - 50);
    }

    // Language-specific system prompts
    const systemPrompts = {
      'en': 'You are Dr. MedBot. Give ultra-concise health info in 1-2 short sentences. Use bullet points only when absolutely necessary. Be direct and clear. No emojis, no references, no citations, no bold text formatting. Always end with: "⚠️ General info only. See doctor for personal advice."',
      'hi': 'आप डॉ. मेडबॉट हैं। 1-2 छोटे वाक्यों में अत्यंत संक्षिप्त स्वास्थ्य जानकारी दें। केवल आवश्यक होने पर ही बुलेट पॉइंट्स का उपयोग करें। सीधे और स्पष्ट रहें। कोई इमोजी, संदर्भ, उद्धरण, या बोल्ड टेक्स्ट फॉर्मेटिंग न करें। हमेशा समाप्त करें: "⚠️ केवल सामान्य जानकारी। व्यक्तिगत सलाह के लिए डॉक्टर से मिलें।"',
      'bn': 'আপনি ডাঃ মেডবট। 1-2টি ছোট বাক্যে অত্যন্ত সংক্ষিপ্ত স্বাস্থ্য তথ্য দিন। শুধুমাত্র প্রয়োজনীয় হলেই বুলেট পয়েন্ট ব্যবহার করুন। সরাসরি এবং স্পষ্ট থাকুন। কোনো ইমোজি, রেফারেন্স, উদ্ধৃতি, বা বোল্ড টেক্সট ফর্ম্যাটিং নেই। সর্বদা শেষ করুন: "⚠️ শুধুমাত্র সাধারণ তথ্য। ব্যক্তিগত পরামর্শের জন্য ডাক্তারের সাথে দেখা করুন।"',
      'pa': 'ਤੁਸੀਂ ਡਾ. ਮੈਡਬੌਟ ਹੋ। 1-2 ਛੋਟੇ ਵਾਕਾਂ ਵਿੱਚ ਅਲਟਰਾ-ਸੰਖੇਪ ਸਿਹਤ ਜਾਣਕਾਰੀ ਦਿਓ। ਸਿਰਫ਼ ਜ਼ਰੂਰੀ ਹੋਣ ਤੇ ਹੀ ਬੁਲੇਟ ਪੁਆਇੰਟਸ ਦੀ ਵਰਤੋਂ ਕਰੋ। ਸਿੱਧੇ ਅਤੇ ਸਪਸ਼ਟ ਰਹੋ। ਕੋਈ ਇਮੋਜੀ, ਹਵਾਲੇ, ਹਵਾਲੇ, ਜਾਂ ਬੋਲਡ ਟੈਕਸਟ ਫਾਰਮੈਟਿੰਗ ਨਹੀਂ। ਹਮੇਸ਼ਾ ਅੰਤ ਕਰੋ: "⚠️ ਸਿਰਫ਼ ਆਮ ਜਾਣਕਾਰੀ। ਨਿੱਜੀ ਸਲਾਹ ਲਈ ਡਾਕਟਰ ਨਾਲ ਮਿਲੋ।"',
      'te': 'మీరు డాక్టర్ మెడ్‌బాట్. 1-2 చిన్న వాక్యాలలో అల్ట్రా-సంక్షిప్త ఆరోగ్య సమాచారం ఇవ్వండి. అవసరమైనప్పుడు మాత్రమే బుల్లెట్ పాయింట్లను ఉపయోగించండి. ప్రత్యక్షంగా మరియు స్పష్టంగా ఉండండి. ఎమోజీలు, సూచనలు, ఉద్ధరణలు, లేదా బోల్డ్ టెక్స్ట్ ఫార్మాటింగ్ లేవు. ఎల్లప్పుడూ ముగించండి: "⚠️ సాధారణ సమాచారం మాత్రమే. వ్యక్తిగత సలహా కోసం డాక్టర్‌ను సంప్రదించండి."'
    };

    // Language-specific greeting keywords
    const greetingKeywords = {
      'en': ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'greetings', 'hiya'],
      'hi': ['नमस्ते', 'नमस्कार', 'हैलो', 'हाय', 'शुभ प्रभात', 'शुभ दोपहर', 'शुभ संध्या', 'हिंदी'],
      'bn': ['নমস্কার', 'হ্যালো', 'হাই', 'শুভ সকাল', 'শুভ দুপুর', 'শুভ সন্ধ্যা', 'বাংলা'],
      'pa': ['ਸਤ ਸ੍ਰੀ ਅਕਾਲ', 'ਹੈਲੋ', 'ਹਾਈ', 'ਸ਼ੁਭ ਸਵੇਰ', 'ਸ਼ੁਭ ਦੁਪਹਿਰ', 'ਸ਼ੁਭ ਸ਼ਾਮ', 'ਪੰਜਾਬੀ'],
      'te': ['నమస్కారం', 'హలో', 'హాయ్', 'శుభోదయం', 'శుభ మధ్యాహ్నం', 'శుభ సాయంత్రం', 'తెలుగు']
    };

    // Check for greeting messages and provide special medical greeting
    const lowerMessage = message.toLowerCase().trim();
    const currentGreetings = greetingKeywords[userLanguage] || greetingKeywords['en'];

    if (currentGreetings.some(keyword => lowerMessage.includes(keyword.toLowerCase()))) {
      const greetingResponses = {
        'en': '🩺 Hi! I\'m Dr. MedBot, your AI medical assistant. What health question can I help with?',
        'hi': '🩺 नमस्ते! मैं डॉ. मेडबॉट हूं, आपका AI मेडिकल असिस्टेंट। कौन सा स्वास्थ्य प्रश्न मैं आपकी मदद कर सकता हूं?',
        'bn': '🩺 নমস্কার! আমি ডাঃ মেডবট, আপনার AI মেডিকেল সহকারী। কোন স্বাস্থ্য প্রশ্নে আমি আপনাকে সাহায্য করতে পারি?',
        'pa': '🩺 ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਡਾ. ਮੈਡਬੌਟ ਹਾਂ, ਤੁਹਾਡਾ AI ਮੈਡੀਕਲ ਸਹਾਇਕ। ਕਿਹੜੇ ਸਿਹਤ ਸਵਾਲ ਵਿੱਚ ਮੈਂ ਤੁਹਾਡੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?',
        'te': '🩺 నమస్కారం! నేను డాక్టర్ మెడ్‌బాట్, మీ AI మెడికల్ అసిస్టెంట్. ఏ ఆరోగ్య ప్రశ్నలో నేను మీకు సహాయం చేయగలను?'
      };

      const greetingResponse = greetingResponses[userLanguage] || greetingResponses['en'];
      return NextResponse.json({ response: greetingResponse });
    }

    // Optional: Query external services for additional context
    let additionalInfo = '';
    try {
      // Add your custom data sources here if needed
      // const response = await fetch(`your-custom-api-endpoint`);
      // if (response.ok) {
      //   const data = await response.json();
      //   additionalInfo = `Additional context: ${JSON.stringify(data)}`;
      // }
    } catch (error) {
      console.log('External service not available:', error.message);
    }

    // Prepare messages for Perplexity API (combine conversation history with system prompt)
    const apiMessages = [
      {
        role: 'system',
        content: systemPrompts[userLanguage] || systemPrompts['en'],
      },
    ];

    // Add conversation history (limit to last 10 exchanges to stay within token limits)
    const recentHistory = conversationHistory.slice(-10);

    // Debug logging
    console.log('Conversation history received:', recentHistory.length, 'messages');
    console.log('Recent history roles:', recentHistory.map(m => m.role));

    // Ensure proper message alternation (user/assistant/user/assistant...)
    // The API requires strict alternation, so we need to filter the history properly
    let historyLastRole = null;
    const filteredHistory = [];

    for (const msg of recentHistory) {
      // Only add message if it doesn't match the last role
      if (msg.role !== historyLastRole) {
        filteredHistory.push(msg);
        historyLastRole = msg.role;
      } else {
        // If we have consecutive same roles, we need to merge or skip
        // For now, we'll skip consecutive same-role messages
        console.log(`Skipping consecutive ${msg.role} message`);
      }
    }

    // Add the filtered history to API messages
    apiMessages.push(...filteredHistory);

    console.log('Filtered history roles:', filteredHistory.map(m => m.role));
    console.log('API messages prepared:', apiMessages.length, 'total messages');

    // Add current message
    apiMessages.push({
      role: 'user',
      content: message,
    });

    // Ensure we have at least system + user message
    if (apiMessages.length < 2) {
      console.warn('Insufficient messages for API call, using fallback');
      apiMessages.length = 0; // Reset
      apiMessages.push(
        {
          role: 'system',
          content: systemPrompts[userLanguage] || systemPrompts['en'],
        },
        {
          role: 'user',
          content: message,
        }
      );
    }

    // Final validation: ensure proper alternation
    const finalMessages = [apiMessages[0]]; // Start with system message
    let validationLastRole = 'system';

    for (let i = 1; i < apiMessages.length; i++) {
      const msg = apiMessages[i];
      if (msg.role !== validationLastRole) {
        finalMessages.push(msg);
        validationLastRole = msg.role;
      } else {
        console.warn(`Removing consecutive ${msg.role} message to ensure alternation`);
      }
    }

    console.log('Final validated messages:', finalMessages.map(m => ({ role: m.role, length: m.content.length })));

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: finalMessages,
        max_tokens: 120, // Increased to accommodate conversation context
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API error:', response.status, errorText);
      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Simplified response parsing
    let aiResponse = '';

    try {
      if (data.choices?.[0]?.message?.content) {
        aiResponse = data.choices[0].message.content;
      } else {
        aiResponse = 'I apologize, but I couldn\'t generate a response.';
      }

      // Clean up response and ensure disclaimer is present
      aiResponse = aiResponse.replace(/^🩺\s*/, ''); // Remove leading emoji if present
      aiResponse = aiResponse.replace(/\[\d+\]/g, ''); // Remove citation references like [1][2][5]
      aiResponse = aiResponse.trim();

      if (!aiResponse.includes('⚠️')) {
        aiResponse += '\n\n⚠️ General info only. See doctor for personal advice.';
      }

      // Store AI response in session
      sessionMessages.push({ role: 'assistant', content: aiResponse });

    } catch (parseError) {
      aiResponse = 'I apologize, but there was an error processing the response. Please try again.';
      // Store error response in session
      sessionMessages.push({ role: 'assistant', content: aiResponse });
    }

    // Cache the response
    responseCache.set(cacheKey, {
      data: aiResponse,
      timestamp: Date.now()
    });

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to get response from AI',
      details: error.message
    }, { status: 500 });
  }
}

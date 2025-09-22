// Translation service for multilingual chatbot support
// Using Google Translate API or fallback to simple translation

const TRANSLATION_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;
const TRANSLATION_API_URL = 'https://translation.googleapis.com/language/translate/v2';

// Language codes mapping
const LANGUAGE_CODES = {
  'en': 'en',
  'hi': 'hi',
  'bn': 'bn',
  'pa': 'pa',
  'te': 'te'
};

// Reverse mapping for detection
const LANGUAGE_NAMES = {
  'en': 'English',
  'hi': 'हिंदी',
  'bn': 'বাংলা',
  'pa': 'ਪੰਜਾਬੀ',
  'te': 'తెలుగు'
};

// Simple translation cache
const translationCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// Clean expired cache entries
const cleanExpiredCache = () => {
  const now = Date.now();
  for (const [key, value] of translationCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      translationCache.delete(key);
    }
  }
};

// Clean cache every 30 minutes
setInterval(cleanExpiredCache, 30 * 60 * 1000);

// Detect language from text
export const detectLanguage = async (text) => {
  try {
    // For now, using a simple keyword-based detection
    // In production, you might want to use Google Translate's detect API
    const lowerText = text.toLowerCase();

    // Hindi detection
    if (/[\u0900-\u097F]/.test(text) || /\b(नमस्ते|कैसे|क्या|है|हैं|हूं|कर|सकते|बता|मदद)\b/.test(lowerText)) {
      return 'hi';
    }

    // Bengali detection
    if (/[\u0980-\u09FF]/.test(text) || /\b(কি|কী|কেমন|কি|কি|করবেন|বলুন|সাহায্য)\b/.test(lowerText)) {
      return 'bn';
    }

    // Punjabi detection
    if (/[\u0A00-\u0A7F]/.test(text) || /\b(ਕੀ|ਕਿ|ਕਿਵੇਂ|ਕੀ|ਹੈ|ਹਨ|ਕਰ|ਸਕਦੇ|ਦੱਸੋ|ਮਦਦ)\b/.test(lowerText)) {
      return 'pa';
    }

    // Telugu detection
    if (/[\u0C00-\u0C7F]/.test(text) || /\b(ఏమిటి|ఎలా|ఏమి|ఉంది|చేయగలరు|చెప్పండి|సహాయం)\b/.test(lowerText)) {
      return 'te';
    }

    return 'en'; // Default to English
  } catch (error) {
    console.error('Language detection error:', error);
    return 'en';
  }
};

// Translate text using Google Translate API or fallback
export const translateText = async (text, targetLang, sourceLang = 'en') => {
  try {
    // Create cache key
    const cacheKey = `${sourceLang}-${targetLang}-${text}`;
    const cached = translationCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.translation;
    }

    // If source and target are the same, return original text
    if (sourceLang === targetLang) {
      return text;
    }

    // Try Google Translate API first
    if (TRANSLATION_API_KEY) {
      const response = await fetch(`${TRANSLATION_API_URL}?key=${TRANSLATION_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: sourceLang,
          target: targetLang,
          format: 'text'
        })
      });

      if (response.ok) {
        const data = await response.json();
        const translation = data.data.translations[0].translatedText;

        // Cache the translation
        translationCache.set(cacheKey, {
          translation,
          timestamp: Date.now()
        });

        return translation;
      }
    }

    // Fallback: Simple word replacement for basic medical terms
    const translation = await fallbackTranslate(text, targetLang);

    // Cache the fallback translation
    translationCache.set(cacheKey, {
      translation,
      timestamp: Date.now()
    });

    return translation;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original text if translation fails
  }
};

// Fallback translation for basic medical terms
const fallbackTranslate = async (text, targetLang) => {
  const medicalTerms = {
    'hi': {
      'hello': 'नमस्ते',
      'how are you': 'आप कैसे हैं',
      'help': 'मदद',
      'medicine': 'दवा',
      'doctor': 'डॉक्टर',
      'health': 'स्वास्थ्य',
      'pain': 'दर्द',
      'fever': 'बुखार',
      'cold': 'जुकाम',
      'headache': 'सिरदर्द',
      'symptoms': 'लक्षण',
      'treatment': 'इलाज',
      'consult': 'सलाह लें',
      'emergency': 'आपातकालीन'
    },
    'bn': {
      'hello': 'নমস্কার',
      'how are you': 'আপনি কেমন আছেন',
      'help': 'সাহায্য',
      'medicine': 'ওষুধ',
      'doctor': 'ডাক্তার',
      'health': 'স্বাস্থ্য',
      'pain': 'ব্যথা',
      'fever': 'জ্বর',
      'cold': 'সর্দি',
      'headache': 'মাথাব্যথা',
      'symptoms': 'লক্ষণ',
      'treatment': 'চিকিৎসা',
      'consult': 'পরামর্শ নিন',
      'emergency': 'জরুরি'
    },
    'pa': {
      'hello': 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ',
      'how are you': 'ਤੁਸੀਂ ਕਿਵੇਂ ਹੋ',
      'help': 'ਮਦਦ',
      'medicine': 'ਦਵਾਈ',
      'doctor': 'ਡਾਕਟਰ',
      'health': 'ਸਿਹਤ',
      'pain': 'ਦਰਦ',
      'fever': 'ਬੁਖਾਰ',
      'cold': 'ਸਰਦੀ',
      'headache': 'ਸਿਰਦਰਦ',
      'symptoms': 'ਲੱਛਣ',
      'treatment': 'ਇਲਾਜ',
      'consult': 'ਸਲਾਹ ਲਓ',
      'emergency': 'ਐਮਰਜੈਂਸੀ'
    },
    'te': {
      'hello': 'నమస్కారం',
      'how are you': 'మీరు ఎలా ఉన్నారు',
      'help': 'సహాయం',
      'medicine': 'మందులు',
      'doctor': 'డాక్టర్',
      'health': 'ఆరోగ్యం',
      'pain': 'నొప్పి',
      'fever': 'జ్వరం',
      'cold': 'జలుబు',
      'headache': 'తలనొప్పి',
      'symptoms': 'లక్షణాలు',
      'treatment': 'చికిత్స',
      'consult': 'సంప్రదించండి',
      'emergency': 'అత్యవసరం'
    }
  };

  let translatedText = text;

  // Replace medical terms
  if (medicalTerms[targetLang]) {
    for (const [english, translated] of Object.entries(medicalTerms[targetLang])) {
      const regex = new RegExp(english, 'gi');
      translatedText = translatedText.replace(regex, translated);
    }
  }

  return translatedText;
};

// Get language name
export const getLanguageName = (code) => {
  return LANGUAGE_NAMES[code] || 'English';
};

// Get all supported languages
export const getSupportedLanguages = () => {
  return Object.entries(LANGUAGE_NAMES).map(([code, name]) => ({
    code,
    name
  }));
};

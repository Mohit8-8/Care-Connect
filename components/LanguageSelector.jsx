import { useState } from 'react';
import { getSupportedLanguages, getLanguageName } from '../lib/translationService';

const LanguageSelector = ({ currentLanguage, onLanguageChange, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const languages = getSupportedLanguages();

  const handleLanguageSelect = (languageCode) => {
    onLanguageChange(languageCode);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all duration-200 ${
          disabled
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
            : 'bg-white/20 hover:bg-white/30 text-white border-white/30 hover:border-white/50 cursor-pointer'
        }`}
      >
        <span className="text-sm font-medium">
          {getLanguageName(currentLanguage)}
        </span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && !disabled && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="py-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Select Language
              </div>
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageSelect(language.code)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors duration-150 ${
                    currentLanguage === language.code
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{language.name}</span>
                    {currentLanguage === language.code && (
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;

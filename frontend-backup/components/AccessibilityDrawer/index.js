import React, { useState } from 'react';
import { 
  SunIcon, 
  MoonIcon, 
  LanguageIcon,
  AdjustmentsHorizontalIcon,
  CommandLineIcon,
  SparklesIcon 
} from '@heroicons/react/24/outline';

const AccessibilityDrawer = ({ theme, setTheme, language, setLanguage, onApiKeySubmit }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState(50);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiInput, setShowApiInput] = useState(false);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'French' },
    { code: 'sw', name: 'Swahili' },
    { code: 'de', name: 'German' },
    { code: 'es', name: 'Spanish' }
  ];

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleLanguageChange = (langCode) => {
    setLanguage(langCode);
    localStorage.setItem('language', langCode);
  };

  const handleApiKeySubmit = () => {
    onApiKeySubmit(apiKeyInput);
    setShowApiInput(false);
    setApiKeyInput('');
  };

  return (
    <>
      {/* Drawer Toggle Button */}
      <div className="accessibility-drawer">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="drawer-button animate-glow"
        >
          <AdjustmentsHorizontalIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Drawer Panel */}
      <div className={`fixed right-20 top-1/2 -translate-y-1/2 z-40 transition-all duration-500 ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}`}>
        <div className="glass-card w-80 p-6 space-y-6">
          <h3 className="text-gold-400 font-bold text-lg border-b border-gold-500/30 pb-2">
            Accessibility Controls
          </h3>

          {/* Theme Toggle */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Theme</label>
            <div className="flex gap-2">
              <button
                onClick={() => theme !== 'dark' && toggleTheme()}
                className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
                  theme === 'dark' 
                    ? 'bg-gold-500 text-black' 
                    : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                }`}
              >
                <MoonIcon className="w-4 h-4" />
                Dark
              </button>
              <button
                onClick={() => theme !== 'light' && toggleTheme()}
                className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
                  theme === 'light' 
                    ? 'bg-gold-500 text-black' 
                    : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                }`}
              >
                <SunIcon className="w-4 h-4" />
                Light
              </button>
            </div>
          </div>

          {/* Language Selector */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Language</label>
            <div className="relative">
              <LanguageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-400" />
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-dark-700 border border-gold-500/30 rounded-lg text-gray-200 focus:border-gold-500 focus:outline-none"
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Auto-scroll Speed */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400 flex justify-between">
              <span>Auto-scroll Speed</span>
              <span className="text-gold-400">{autoScrollSpeed}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={autoScrollSpeed}
              onChange={(e) => setAutoScrollSpeed(e.target.value)}
              className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #d97706 0%, #d97706 ${autoScrollSpeed}%, #2d2d2d ${autoScrollSpeed}%, #2d2d2d 100%)`
              }}
            />
          </div>

          {/* AI Helper Button */}
          <div className="space-y-2">
            <button
              onClick={() => setShowApiInput(!showApiInput)}
              className="w-full py-2 px-3 bg-gradient-to-r from-gold-500/20 to-gold-600/20 border border-gold-500/30 rounded-lg flex items-center justify-center gap-2 hover:from-gold-500/30 hover:to-gold-600/30 transition-all"
            >
              <CommandLineIcon className="w-4 h-4 text-gold-400" />
              <span className="text-gold-400">AI Helper</span>
              <SparklesIcon className="w-4 h-4 text-gold-400" />
            </button>

            {/* API Key Input */}
            {showApiInput && (
              <div className="mt-3 space-y-2 animate-pulse">
                <textarea
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Paste your API key here..."
                  className="w-full h-24 p-2 bg-dark-800 border border-gold-500/30 rounded-lg text-sm text-gray-300 focus:border-gold-500 focus:outline-none"
                />
                <button
                  onClick={handleApiKeySubmit}
                  className="w-full py-1 bg-gold-500 text-black rounded-lg hover:bg-gold-600 transition-all"
                >
                  Submit API Key
                </button>
              </div>
            )}
          </div>

          {/* Random Background Doodles Indicator */}
          <div className="flex justify-center gap-1 pt-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-gold-500/30 animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default AccessibilityDrawer;

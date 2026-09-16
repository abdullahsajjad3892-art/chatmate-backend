// Free translation using MyMemory API (no API key needed)
async function translateText(text, sourceLang, targetLang) {
  // Agar dono languages same hain, translation ki zaroorat nahi (bypass)
  if (!text || sourceLang === targetLang) {
    return text;
  }

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.responseData && data.responseData.translatedText) {
      return data.responseData.translatedText;
    }
    return text; // Agar translation fail ho, original text hi wapas dein
  } catch (error) {
    console.log('Translation error:', error.message);
    return text;
  }
}

module.exports = { translateText };
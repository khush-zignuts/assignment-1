const i18n = require("../config/i18n");
const languageSelect = (req, res, next) => {
  const lang = req.headers["accept-language"]; // Get the preferred language

  const availableLocales = i18n.getLocales(); // Get configured locales

  if (lang && availableLocales.includes(lang)) {
    i18n.setLocale(lang); // Set the language if it’s supported
  } else {
    i18n.setLocale("en"); // Fall back to default language
  }

  next();
};

module.exports = languageSelect;

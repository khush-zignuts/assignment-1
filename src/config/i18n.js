
const i18n = require("i18next");
const Backend = require("i18next-fs-backend");
const middleware = require("i18next-http-middleware");
const path = require("path");

i18n
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    // fallbackLng: "en",
    defaultLocale: "en",
    supportedLngs: ["en", "de"], // English,  German
    backend: {
      loadPath: path.join(__dirname , "../locales/{{lng}}.json")
    },
    detection: {
      order: ["querystring", "cookie", "header"],
      lookupQuerystring: "lng",
      lookupCookie: "i18next",
      lookupHeader: "accept-language",
      caches: ["cookie"]
    }
  });

module.exports = middleware.handle(i18n); // Fix: Export the actual middleware

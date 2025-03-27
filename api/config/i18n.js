const i18n = require("i18n");
const path = require("path");
console.log("__dirname: ", __dirname);
i18n.configure({
  locales: ["en", "de"],
  directory: path.join(__dirname, "../config/locales"),
  defaultLocale: "en",
  updateFiles: false,
  objectNotation: true,
  // register: global,
});
module.exports = i18n;

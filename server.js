require("dotenv").config();
const express = require("express");
const Routes = require("./api/routes/index");

const i18n = require("./api/config/i18n");
const sequelize = require("./api/config/db");
const languageSelect = require("./api/middlewares/i18n");
const adminBootstrap = require("./api/config/bootstrap");
//app initialization

const app = express();

//middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Load i18n
app.use(i18n.init);
app.use(languageSelect);

//Routes
app.use("api", Routes);

// at last port call :
const PORT = process.env.PORT || 5000;

// admin creation
(async () => {
  try {
    const result = await adminBootstrap();
    console.log("adminBootstrap");
  } catch (err) {
    console.log(err.message);
  }
})();

app.listen(PORT, async () => {
  // Sync Database and Start Server
  try {
    await sequelize.sync({ alter: true }); // or { force: true } to drop & recreate tables (CAUTION)
    console.log(`Server is running on port ${PORT}`);
  } catch (error) {
    console.log(error.message);
  }
});

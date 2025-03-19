require("dotenv").config();
const express = require("express");
const adminRoutes = require("./src/routes/admin/adminRoutes");
const userRoutes = require("./src/routes/User/userRoutes");
// const cookieParser = require("cookie-parser");
const i18n = require("./src/config/i18n");
const languageSelect = require("./src/middlewares/i18n");
//app initialization

const app = express();

//middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// app.use(cookieParser());
// Load i18n
app.use(i18n.init);
app.use(languageSelect);

// // Middleware to set language dynamically
// app.use((req, res, next) => {
//   // Now req.cookies is defined
//   let lang = req.query.lang || (req.cookies ? req.cookies.lang : null) || "en";
//   if (req.i18n && req.i18n.changeLanguage) {
//     req.i18n.changeLanguage(lang);
//   }
//   next();
// });

// Routes
app.get("/", (req, res) => {
  res.send("Welcome to the authentication i18n system!");
});

//Routes
app.use("/admin", adminRoutes);
app.use("/user", userRoutes);

// at last port call :
const PORT = process.env.PORT || 5000;
console.log("PORT: ", PORT);

app.listen(PORT, async () => {
  // Sync Database and Start Server
  try {
    console.log(`Server is running on port ${PORT}`);
  } catch (error) {
    console.log(error.message);
  }
});

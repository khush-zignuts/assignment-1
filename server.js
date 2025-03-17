require("dotenv").config();
const express = require("express");
const { syncDatabase } = require("./src/config/sequel");
const i18nMiddleware = require("./src/config/i18n");
const adminRoutes = require("./src/routes/admin/adminRoutes");
const userRoutes = require("./src/routes/User/userRoutes");

//app initialization

const app = express();

//middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// app.use(i18nMiddleware); // Attach i18n middleware
// Load i18n
app.use(i18nMiddleware);

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
  try{
    await syncDatabase();
    console.log(`Server is running on port ${PORT}`);
  }catch(error){
    console.log(error.message);
  }
});

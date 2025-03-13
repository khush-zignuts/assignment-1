const express = require("express");
const {signup, login  } = require("../controllers/adminController");
const router = express.Router();
const categoryRoutes = require("./categoryRoutes");

//authentication
router.post("/signup", signup);
router.post("/login", login);

//categories
router.use("/category", categoryRoutes);

module.exports = router;
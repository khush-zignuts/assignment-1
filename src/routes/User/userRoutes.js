const express = require("express");
const router = express.Router();
const userAuthRoutes = require("./userAuthRoutes")

//authentication
router.use("/auth", userAuthRoutes);

module.exports = router;



const express = require("express");
const router = express.Router();
const userAuthRoutes = require("./auth/authRoutes");
const userAccountRoutes = require("./account/accountRoutes");

//authentication
router.use("/auth", userAuthRoutes);

router.use("/Account", userAccountRoutes);

module.exports = router;

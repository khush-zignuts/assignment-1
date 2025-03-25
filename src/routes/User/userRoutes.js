const express = require("express");
const router = express.Router();
const userAuthRoutes = require("./userAuthRoutes");
const userAccountRoutes = require("../../routes/User/userAccountRoutes");

//authentication
router.use("/auth", userAuthRoutes);

router.use("/Account", userAccountRoutes);

module.exports = router;

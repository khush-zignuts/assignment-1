const express = require("express");
const router = express.Router();
const userAuthRoutes = require("./auth/authRoutes");
const userAccountRoutes = require("./account/accountRoutes");
const DropDownRoutes = require("./dropDownRoutes");
//authentication
router.use("/auth", userAuthRoutes);

router.use("/Account", userAccountRoutes);

router.use("/dropDown", DropDownRoutes);

module.exports = router;

const express = require("express");
const router = express.Router();
const adminRoutes = require("../routes/admin/index");
const userRoutes = require("../routes/user/index");

//adin
router.use("/admin", adminRoutes);

//User
router.use("/user", userRoutes);

module.exports = router;

const express = require("express");
const { login , deleteUser  } = require("../../controllers/adminController");
const router = express.Router();
const categoryRoutes = require("./categoryRoutes");
const adminAuthRoutes = require("./adminAuthRoutes")

//authentication
router.use("/auth", adminAuthRoutes);

//categories:
router.use("/category", categoryRoutes);

module.exports = router;
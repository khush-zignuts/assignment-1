const express = require("express");
const router = express.Router();
const adminAuthRoutes = require("./adminAuthRoutes")
const categoryRoutes = require("./categoryRoutes");
const countryRoutes = require("./countryRoutes")

//authentication
router.use("/auth", adminAuthRoutes);

//categories:
router.use("/category", categoryRoutes);

//countries:
// router.use("/country", countryRoutes);

module.exports = router;
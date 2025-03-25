const express = require("express");
const router = express.Router();
const adminAuthRoutes = require("./Auth/adminAuthRoutes");
const categoryRoutes = require("./Category/categoryRoutes");
const countryRoutes = require("./Country/countryRoutes");

//authentication
router.use("/auth", adminAuthRoutes);

//categories:
router.use("/category", categoryRoutes);

//countries:
router.use("/country", countryRoutes);

module.exports = router;

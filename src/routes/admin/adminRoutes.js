const express = require("express");
const router = express.Router();
const adminAuthRoutes = require("./Auth/adminAuthRoutes");
const categoryRoutes = require("../admin/Master/Category/categoryRoutes");
const countryRoutes = require("../admin/Master/Country/countryRoutes");

//authentication
router.use("/auth", adminAuthRoutes);

//categories:
router.use("/category", categoryRoutes);

//countries:
router.use("/country", countryRoutes);

module.exports = router;

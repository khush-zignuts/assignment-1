const express = require("express");
const router = express.Router();
const adminAuthRoutes = require("./auth/authRoutes");
const categoryRoutes = require("./Master/Category/categoryRoutes");
const userDeleteRoutes = require("./user/userDeleteRoutes");
const subcategoryRoutes = require("./Master/subCategory/subcategoryRoutes");
const countryRoutes = require("./Master/Country/countryRoutes");
const cityRoutes = require("./Master/city/cityRoutes");

//authentication
router.use("/auth", adminAuthRoutes);

//User delete
router.use("/deleteuser", userDeleteRoutes);

//categories:
router.use("/category", categoryRoutes);

//categories:
router.use("/subcategory", subcategoryRoutes);

//countries:
router.use("/country", countryRoutes);

//categories:
router.use("/city", cityRoutes);

module.exports = router;

const express = require("express");
const router = express.Router();
const adminAuthRoutes = require("./auth/authRoutes");
const categoryRoutes = require("./Master/Category/categoryRoutes");
const userAction = require("./user/userDeleteRoutes");
const subcategoryRoutes = require("./Master/subCategory/subcategoryRoutes");
const countryRoutes = require("./Master/Country/countryRoutes");
const cityRoutes = require("./Master/city/cityRoutes");
const dropDownRoutes = require("./master/dropDown/dropDownRoutes");

//authentication
router.use("/auth", adminAuthRoutes);

//User delete
router.use("/user", userAction);

//categories:
router.use("/category", categoryRoutes);

//categories:
router.use("/subcategory", subcategoryRoutes);

//countries:
router.use("/country", countryRoutes);

//categories:
router.use("/city", cityRoutes);

//dropDown:
router.use("/dropDown", dropDownRoutes);

module.exports = router;

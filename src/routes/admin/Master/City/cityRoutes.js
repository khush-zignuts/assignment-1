const express = require("express");
const {
  addCity,
  updateCategory,
  deleteCategory,
  listingCategory,
} = require("../../../controllers/Admin/Category/categoryController");
const router = express.Router();
const checkAdmin = require("../../../../middlewares/checkAdmin"); // Middleware to check admin access

//create City
router.post("/addCity", checkAdmin, addCity);

//update City
router.post("/updateCity", checkAdmin, updateCity);

//deletion of City
router.post("/deleteCity", checkAdmin, deleteCity);

module.exports = router;

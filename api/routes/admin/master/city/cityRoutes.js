const express = require("express");
const {
  addCity,
  updateCity,
  deleteCity,
} = require("../../../../controllers/Admin/Master/City/CityController");
const router = express.Router();
const checkAdmin = require("../../../../middlewares/checkAdmin"); // Middleware to check admin access

//create City
router.post("/add", checkAdmin, addCity);

//update City
router.post("/update", checkAdmin, updateCity);

//deletion of City
router.delete("/delete/:cityId", checkAdmin, deleteCity);

module.exports = router;

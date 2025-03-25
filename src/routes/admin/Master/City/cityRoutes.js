const express = require("express");
const {
  addCity,
  updateCity,
  deleteCity,
} = require("../../../../controllers/Admin/Master/City/CityController");
const router = express.Router();
const checkAdmin = require("../../../../middlewares/checkAdmin"); // Middleware to check admin access

//create City
router.post("/addCity", checkAdmin, addCity);

//update City
router.post("/updateCity", checkAdmin, updateCity);

//deletion of City
router.post("/deleteCity", checkAdmin, deleteCity);

module.exports = router;

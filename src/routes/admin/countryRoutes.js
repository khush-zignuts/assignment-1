const express = require("express");
const {
  addCountry,
  addCity,
} = require("../../controllers/Admin/countryController");
const router = express.Router();
const checkAdmin = require("../../middlewares/checkAdmin"); // Middleware to check admin access

router.post("/addCountry", checkAdmin, addCountry);
router.post("/addCity", checkAdmin, addCity);

module.exports = router;

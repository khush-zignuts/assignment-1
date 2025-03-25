const express = require("express");
const {
  addCountry,
  updateCountry,
  deleteCountry,
} = require("../../../../controllers/Admin/Master/Country/CountryController");
const router = express.Router();
const checkAdmin = require("../../../../middlewares/checkAdmin"); // Middleware to check admin access

//create category
router.post("/addCountry", checkAdmin, addCountry);

//update category
router.post("/updateCountry", checkAdmin, updateCountry);

//deletion of category
// DELETE /api/countries/delete/:countryId
router.delete("/deleteCountry/:countryId", checkAdmin, deleteCountry);

//search Category
router.get(
  "/listingCountriesWithCities",
  checkAdmin,
  listingCountriesWithCities
);
// GET /api/countries/list?q=Germany

module.exports = router;

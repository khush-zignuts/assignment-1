const express = require("express");
const {
  addCountry,
  updateCountry,
  deleteCountry,
  listingCountriesWithCities,
} = require("../../../../controllers/Admin/master/country/CountryController");
const router = express.Router();
const checkAdmin = require("../../../../middlewares/checkAdmin"); // Middleware to check admin access

//create category
router.post("/add", checkAdmin, addCountry);

//update category
router.post("/update", checkAdmin, updateCountry);

//deletion of category
// DELETE /api/countries/delete/:countryId
router.delete("/delete/:countryId", checkAdmin, deleteCountry);

//search Category
router.get(
  "/listingCountriesWithCities",
  checkAdmin,
  listingCountriesWithCities
);
// GET /api/countries/list?q=Germany

module.exports = router;

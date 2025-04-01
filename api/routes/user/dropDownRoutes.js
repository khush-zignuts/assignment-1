const express = require("express");
const {
  getCategory,
  getSubCategory,
  getCountry,
  getCity,
} = require("../../controllers/dropdown/DropDown");
const router = express.Router();

router.get("/getCategory", getCategory);
router.get("/getsubCategory/:categoryId", getSubCategory);
router.get("/getCountry", getCountry);
router.get("/getCity/:countryId", getCity);

module.exports = router;

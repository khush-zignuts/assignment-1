const Country = require("../model/Country");
const City = require("../model/City");
const Category = require("../model/Category");
const { t } = require("i18next");

exports.getDropdownData = async (req, res) => {
  try {
    const countries = await Country.findAll();
    const cities = await City.findAll();
    const categories = await Category.findAll();
    
    res.json({ message: t("fetch_success"), countries, cities, categories });
  } catch (error) {
    res.status(500).json({ message: "Error fetching data", error });
  }
};

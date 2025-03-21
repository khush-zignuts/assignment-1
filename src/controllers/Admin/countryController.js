const User = require("../../models/User");

const { Op } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
const i18n = require("../../config/i18n");
const { STATUS_CODES } = require("../../config/constant");
const {
  MasterCountryTrans,
  MasterCountry,
  MasterCity,
  MasterCityTrans,
} = require("../../models");
module.exports = {
  addCountry: async (req, res) => {
    // const { t } = req; // Get translation function
    try {
      //sir changes
      let countries = req.body.data;
      console.log("countries: ", countries);

      if (!Array.isArray(countries) || countries.length === 0) {
        return res
          .status(STATUS_CODES.BAD_REQUEST)
          .json({ message: i18n.__("api.countries.invalidInput") });
      }

      let countryData = [];
      for (let i = 0; i < countries.length; i++) {
        const { name, lang } = countries[i];
        if (!name || !lang) {
          return res
            .status(STATUS_CODES.BAD_REQUEST)
            .json({ message: "Both name and lang are required" });
        }
        // Push each valid translation into our categoryData array
        countryData.push({ name, lang });
      }
      console.log("countryData: ", countryData);

      //  Check for existing country
      const existingCountry = await MasterCountryTrans.findAll({
        where: {
          isDeleted: false,
          [Op.or]: countryData.map((c) => ({
            name: c.name,
            lang: c.lang,
          })),
        },
      });

      console.log("existingCountry: ", existingCountry);
      if (existingCountry && existingCountry.length > 0) {
        return res
          .status(STATUS_CODES.BAD_REQUEST)
          .json({ message: "Country already exists" });
      }

      //   // Generate UUID for MasterCategory
      const master_country_id = uuidv4();
      console.log("master_country_id: ", master_country_id);

      // Create master-category || cat_id put in master category table
      const country = await MasterCountry.create({
        id: master_country_id,
      });

      console.log("country: ", country);

      //   // // Prepare data for bulk insert
      let country_trans = [];
      for (let i = 0; i < countryData.length; i++) {
        const { name, lang } = countryData[i];
        console.log("lang: ", lang);
        console.log("name: ", name);

        country_trans.push({
          master_country_id,
          name: countryData[i].name,
          lang: countryData[i].lang,
        });
      }
      console.log("country_trans😇 :", country_trans);
      //   // Create master-category-trans
      await MasterCountryTrans.bulkCreate(country_trans);

      return res.status(STATUS_CODES.CREATED).json({
        message: i18n.__("api.countries.addSuccess"),
        // status,
        master_country_id,
        // data,
        // error,
      });
    } catch (error) {
      console.error(error);
      return res
        .status(STATUS_CODES.SERVER_ERROR)
        .json({ message: i18n.__("api.errors.serverError"), error });
    }
  },

  addCity: async (req, res) => {
    // const { t } = req; // Get translation function
    try {
      let cities = req.body.data;
      console.log("cities: ", cities);

      if (!Array.isArray(cities) || cities.length === 0) {
        return res
          .status(STATUS_CODES.BAD_REQUEST)
          .json({ message: i18n.__("api.cities.invalidInput") });
      }

      let cityData = [];

      for (let i = 0; i < cities.length; i++) {
        const { countryId, name, lang } = cities[i];

        if (!name || !lang || !countryId) {
          return res
            .status(STATUS_CODES.BAD_REQUEST)
            .json({ message: "Both name and lang are required" });
        }

        cityData.push({ countryId, name: name.toLowerCase(), lang });
      }

      //  Check for existing vity
      const existingCity = await MasterCityTrans.findAll({
        where: {
          isDeleted: false,
          [Op.or]: cityData.map((c) => ({
            name: c.name,
            lang: c.lang,
          })),
        },
      });

      console.log("existingCity: ", existingCity);
      if (existingCity && existingCity.length > 0) {
        return res
          .status(STATUS_CODES.BAD_REQUEST)
          .json({ message: "City already exists" });
      }

      // // Check for existing category
      // const existingCity = await MasterCityTrans.findOne({
      //   where: {
      //     name: {
      //       [Op.in]: cityData.map((c) => c.name),
      //     },
      //   },
      // });

      // if (existingCity) {
      //   return res
      //     .status(STATUS_CODES.BAD_REQUEST)
      //     .json({ message: "City already exists" });
      // }

      // Generate UUID for MasterCity
      const master_City_id = uuidv4();
      console.log("master_City_id: ", master_City_id);

      // // // Create master-category || cat_id put in master category table
      const City = await MasterCity.create({
        id: master_City_id,
        countryId: cityData[0].countryId,
      });

      console.log("City: ", City);

      // // Insert Translations Using `bulkCreate`
      let City_trans = [];
      for (let i = 0; i < cityData.length; i++) {
        City_trans.push({
          master_city_id: master_City_id,
          name: cityData[i].name,
          lang: cityData[i].lang,
        });
      }
      console.log("City_trans: ", City_trans);

      // // // Create master-category-trans
      await MasterCityTrans.bulkCreate(City_trans);

      return res
        .status(STATUS_CODES.CREATED)
        .json({ message: i18n.__("api.cities.addSuccess"), master_City_id });
    } catch (error) {
      console.error(error);
      return res
        .status(STATUS_CODES.SERVER_ERROR)
        .json({ message: i18n.__("api.errors.serverError"), error });
    }
  },
};

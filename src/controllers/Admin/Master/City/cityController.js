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
  addCity: async (req, res) => {
    // const { t } = req; // Get translation function
    try {
      let cities = req.body.data;
      console.log("cities: ", cities);

      if (!Array.isArray(cities) || cities.length === 0) {
        return res.json({
          status: STATUS_CODES.BAD_REQUEST,
          message: i18n.__("api.cities.invalidInput"),
          data: null,
          error: null,
        });
      }
      let cityData = [];

      for (let i = 0; i < cities.length; i++) {
        const { countryId, name, lang } = cities[i];

        if (!name || !lang || !countryId) {
          return res.json({
            status: STATUS_CODES.BAD_REQUEST,
            message: "Both name and lang are required",
            data: null,
            error: null,
          });
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
        return res.json({
          status: STATUS_CODES.BAD_REQUEST,
          message: "City already exists",
          data: null,
          error: null,
        });
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

      return res.json({
        status: STATUS_CODES.CREATED,
        message: i18n.__("api.cities.addSuccess"),
        data: { master_City_id },
        error: null,
      });
    } catch (error) {
      console.error(error);
      return res.json({
        status: STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: null,
        error: error.message,
      });
    }
  },

  updateCity: async (req, res) => {
    try {
      let cities = req.body.data;
      console.log("Cities to update:", cities);

      // Validate request payload
      if (!Array.isArray(cities) || cities.length === 0) {
        return res.json({
          status: STATUS_CODES.BAD_REQUEST,
          message: i18n.__("api.cities.invalidInput"),
          data: null,
          error: null,
        });
      }

      let updateData = [];

      for (let i = 0; i < cities.length; i++) {
        const { id, name, lang } = cities[i];

        if (!id || !name || !lang) {
          return res
            .status(STATUS_CODES.BAD_REQUEST)
            .json({ message: "ID, name, and lang are required" });
        }

        updateData.push({ id, name: name.toLowerCase(), lang });
      }

      console.log("updateData: ", updateData);

      // Check if the cities exist
      const existingCities = await MasterCityTrans.findAll({
        where: {
          isDeleted: false,
          id: { [Op.in]: updateData.map((c) => c.id) },
        },
      });

      if (!existingCities || existingCities.length === 0) {
        return res.json({
          status: STATUS_CODES.NOT_FOUND,
          message: "City not found",
          data: null,
          error: null,
        });
      }

      // Check for duplicate city names in the same language
      const duplicateCity = await MasterCityTrans.findOne({
        where: {
          isDeleted: false,
          [Op.or]: updateData.map((c) => ({
            name: c.name,
            lang: c.lang,
          })),
          id: { [Op.notIn]: updateData.map((c) => c.id) }, // Ensure it's not checking itself
        },
      });
      if (duplicateCity) {
        return res.json({
          status: STATUS_CODES.BAD_REQUEST,
          message: "A city with the same name and language already exists",
          data: null,
          error: null,
        });
      }

      // Perform the update
      for (let i = 0; i < updateData.length; i++) {
        const { id, name, lang } = updateData[i];

        await MasterCityTrans.update({ name, lang }, { where: { id } });
      }

      return res.json({
        status: STATUS_CODES.SUCCESS,
        message: i18n.__("api.cities.updateSuccess"),
        data: null,
        error: null,
      });
    } catch (error) {
      console.error("Error updating city:", error);
      return res.json({
        status: STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: null,
        error: error.message,
      });
    }
  },

  deleteCity: async (req, res) => {
    try {
      const { cityId } = req.params; // Extract cityId from request params
      console.log("Deleting city:", cityId);

      if (!cityId) {
        return res.json({
          status: STATUS_CODES.BAD_REQUEST,
          message: "City ID is required",
          data: null,
          error: null,
        });
      }

      // Find city by ID
      const city = await MasterCityTrans.findOne({
        where: { id: cityId, isDeleted: false },
      });

      console.log("City found: ", city);

      if (!city) {
        return res.json({
          status: STATUS_CODES.NOT_FOUND,
          message: i18n.__("api.cities.notFound"),
          data: null,
          error: null,
        });
      }

      // Check if the city is assigned to any account (if applicable)
      const assignedAccounts = await Account.findOne({
        where: { cityId: city.id },
      });

      if (assignedAccounts) {
        return res.json({
          status: STATUS_CODES.BAD_REQUEST,
          message: i18n.__("api.cities.assignedToAccount"),
          data: null,
          error: null,
        });
      }

      await MasterCityTrans.update(
        { isDeleted: true },
        { where: { id: cityId } }
      );

      return res.json({
        status: STATUS_CODES.SUCCESS,
        message: i18n.__("api.cities.deleted"),
        data: null,
        error: null,
      });
    } catch (error) {
      console.error("Error deleting city:", error);
      return res.json({
        status: STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: null,
        error: error.message,
      });
    }
  },
};

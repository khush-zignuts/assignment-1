const { Op } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
const i18n = require("../../../../config/i18n");
const { STATUS_CODES } = require("../../../../config/constants");
const { VALIDATION_RULES } = require("../../../../config/validationRules");

const {
  MasterCountryTrans,
  MasterCountry,
  MasterCity,
  MasterCityTrans,
} = require("../../../../models");

const Validator = require("validatorjs");
const validateRequest = (data, rules, res) => {
  const validation = new Validator(data, rules);
  if (validation.fails()) {
    res
      .status(STATUS_CODES.BAD_REQUEST)
      .json({ message: validation.errors.all() });
    return false;
  }
  return true;
};

module.exports = {
  addCity: async (req, res) => {
    try {
      if (!validateRequest(req.body, VALIDATION_RULES.CITY, res)) return;
      let cities = req.body.data;

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
        attributes: ["id", "master_city_id", "name", "lang"],
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

      // Generate UUID for MasterCity
      const master_City_id = uuidv4();

      // // // Create master-category || cat_id put in master category table
      const City = await MasterCity.create({
        id: master_City_id,
        countryId: cityData[0].countryId,
      });

      // // Insert Translations Using `bulkCreate`
      let City_trans = [];
      for (let i = 0; i < cityData.length; i++) {
        City_trans.push({
          master_city_id: master_City_id,
          name: cityData[i].name,
          lang: cityData[i].lang,
        });
      }

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
          return res.json({
            status: STATUS_CODES.BAD_REQUEST,
            message: "ID, name, and lang are required",
            data: null,
            error: null,
          });
        }

        updateData.push({ id, name: name.toLowerCase(), lang });
      }

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
          attributes: ["id", "master_city_id", "name", "lang"],
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
      const { cityId } = req.params; // Ex

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
        attributes: ["id", "master_city_id", "name", "lang"],
      });

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
        attributes: ["id"],
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

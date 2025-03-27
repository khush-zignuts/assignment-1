const { Op } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
const i18n = require("../../../../config/i18n");
const { HTTP_STATUS_CODES } = require("../../../../config/constants");
const { VALIDATION_RULES } = require("../../../../config/validationRules");
const sequelize = require("../../../../config/db");
const { MasterCity, MasterCityTrans } = require("../../../../models");
const VALIDATOR = require("validatorjs");

module.exports = {
  addCity: async (req, res) => {
    try {
      const adminId = req.admin.id;

      let { cities } = req.body;

      const validation = new VALIDATOR(req.body, {
        cities: VALIDATION_RULES.CITY.cities,
      });

      if (validation.fails()) {
        return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          message: "Validation failed.",
          data: null,
          error: validation.errors.all(),
        });
      }

      for (let i = 0; i < cities.length; i++) {
        const query = `
        SELECT 
        mct.id AS id,
        mc.country_id AS countryId

        FROM master_city AS mc
        JOIN master_city_trans AS mct

        On mc.id = mct.master_city_id
        
        WHERE mc.is_deleted = false
        AND mc.country_id = :countryId
        AND mct.lang = :lang
        AND LOWER(mct.name) = LOWER(:name);
        `;

        const existingCity = await sequelize.query(query, {
          replacements: {
            countryId: cities[i].countryId,
            name: cities[i].name,
            lang: cities[i].lang,
          },
          type: sequelize.QueryTypes.SELECT,
        });

        // If a category exists, return a conflict response
        if (existingCity.length > 0) {
          return res.status(HTTP_STATUS_CODES.CONFLICT).json({
            status: HTTP_STATUS_CODES.CONFLICT,
            message: `city '${cities[i].name}' already exists in '${cities[i].lang}'`,
            data: null,
            error: null,
          });
        }
      }

      // Generate UUID for MasterCity
      const masterCityId = uuidv4();

      // // Insert Translations Using `bulkCreate`
      let City_trans = [];
      for (let i = 0; i < cities.length; i++) {
        City_trans.push({
          masterCityId: masterCityId,
          name: cities[i].name,
          lang: cities[i].lang,
          createdAt: Math.floor(Date.now() / 1000),
          createdBy: adminId,
        });
      }
      // // // Create master-category || cat_id put in master category table
      const City = await MasterCity.create({
        id: masterCityId,
        countryId: cities[0].countryId,
        createdAt: Math.floor(Date.now() / 1000),
        createdBy: adminId,
      });

      // // // Create master-category-trans
      await MasterCityTrans.bulkCreate(City_trans);

      return res.json({
        status: HTTP_STATUS_CODES.CREATED,
        message: i18n.__("api.cities.addsuccess"),
        data: { masterCityId },
        error: null,
      });
    } catch (error) {
      console.error(error);
      return res.json({
        status: HTTP_STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: null,
        error: error.message,
      });
    }
  },

  updateCity: async (req, res) => {
    try {
      const adminId = req.admin.id;

      let cities = req.body.data;

      // Validate request payload
      if (!Array.isArray(cities) || cities.length === 0) {
        return res.json({
          status: HTTP_STATUS_CODES.BAD_REQUEST,
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
            status: HTTP_STATUS_CODES.BAD_REQUEST,
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
          status: HTTP_STATUS_CODES.NOT_FOUND,
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
          status: HTTP_STATUS_CODES.BAD_REQUEST,
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
        status: HTTP_STATUS_CODES.OK,
        message: i18n.__("api.cities.update OK"),
        data: null,
        error: null,
      });
    } catch (error) {
      console.error("Error updating city:", error);
      return res.json({
        status: HTTP_STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: null,
        error: error.message,
      });
    }
  },

  deleteCity: async (req, res) => {
    try {
      const { cityId } = req.params; // Ex
      const adminId = req.admin.id;

      if (!cityId) {
        return res.json({
          status: HTTP_STATUS_CODES.BAD_REQUEST,
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
          status: HTTP_STATUS_CODES.NOT_FOUND,
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
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          message: i18n.__("api.cities.assignedToAccount"),
          data: null,
          error: null,
        });
      }

      await MasterCityTrans.update(
        { isDeleted: true, deletedA: Math.floor(Date.now() / 1000) },
        { where: { id: cityId } }
      );

      return res.json({
        status: HTTP_STATUS_CODES.OK,
        message: i18n.__("api.cities.deleted"),
        data: null,
        error: null,
      });
    } catch (error) {
      console.error("Error deleting city:", error);
      return res.json({
        status: HTTP_STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: null,
        error: error.message,
      });
    }
  },
};

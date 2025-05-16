const { Op } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
const i18n = require("../../../../config/i18n");
const { HTTP_STATUS_CODES } = require("../../../../config/constants");
const { VALIDATION_RULES } = require("../../../../config/validationRules");
const sequelize = require("../../../../config/db");
const {
  MasterCity,
  MasterCityTrans,
  Account,
  User,
} = require("../../../../models");
const VALIDATOR = require("validatorjs");

module.exports = {
  addCity: async (req, res) => {
    try {
      const adminId = req.admin.id;

      let { countryId, translation } = req.body;

      const validation = new VALIDATOR(req.body, {
        countryId: VALIDATION_RULES.COUNTRY.masterCountryId,
        translation: VALIDATION_RULES.CITY.translation,
      });

      if (validation.fails()) {
        return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          message: "Validation failed.",
          data: "",
          error: validation.errors.all(),
        });
      }

      for (let i = 0; i < translation.length; i++) {
        const query = `
        SELECT 
        mct.id AS id,
        mc.country_id 

        FROM master_city AS mc
        LEFT JOIN master_city_trans AS mct

        On mc.id = mct.master_city_id
        
        WHERE mc.is_deleted = false
        AND mc.country_id = :countryId
        AND LOWER(mct.lang) = LOWER(:lang) 
        AND LOWER(mct.name) = LOWER(:name);
        `;

        const existingCity = await sequelize.query(query, {
          replacements: {
            countryId: countryId,
            name: translation[i].name,
            lang: translation[i].lang,
          },
          type: sequelize.QueryTypes.SELECT,
        });

        // If a category exists, return a conflict response
        if (existingCity.length > 0) {
          return res.status(HTTP_STATUS_CODES.CONFLICT).json({
            status: HTTP_STATUS_CODES.CONFLICT,
            message: `city '${[i].name}' already exists in 'city${[i].lang}'`,
            data: "",
            error: "",
          });
        }
      }

      // Generate UUID for MasterCity
      const mastercityId = uuidv4();

      // // Insert Translations Using `bulkCreate`
      let CityTrans = [];
      for (let i = 0; i < translation.length; i++) {
        CityTrans.push({
          masterCityId: mastercityId,
          name: translation[i].name,
          lang: translation[i].lang,
          createdAt: Math.floor(Date.now() / 1000),
          createdBy: adminId,
        });
      }
      console.log("CityTrans: ", CityTrans);
      // // // Create master-category || cat_id put in master category table
      const City = await MasterCity.create({
        id: mastercityId,
        countryId: countryId,
        createdAt: Math.floor(Date.now() / 1000),
        createdBy: adminId,
      });

      // // // Create master-category-trans
      await MasterCityTrans.bulkCreate(City_trans, {
        validate: true,
      });

      return res.status(HTTP_STATUS_CODES.CREATED).json({
        status: HTTP_STATUS_CODES.CREATED,
        message: i18n.__("api.cities.addsuccess"),
        data: { mastercityId },
        error: "",
      });
    } catch (error) {
      console.error(error);
      return res.status(HTTP_STATUS_CODES.SERVER_ERROR).json({
        status: HTTP_STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: "",
        error: error.message,
      });
    }
  },

  updateCity: async (req, res) => {
    try {
      const adminId = req.admin.id;

      const { mastercityId, translation } = req.body;

      const validation = new VALIDATOR(req.body, {
        mastercityId: VALIDATION_RULES.CITY.masterCityId,
        translation: VALIDATION_RULES.CITY.translation,
      });

      if (validation.fails()) {
        return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          message: "Validation failed.",
          data: "",
          error: validation.errors.all(),
        });
      }
      // Find subcategory by ID
      const city = await MasterCity.findOne({
        where: { id: mastercityId, isDeleted: false },
        attributes: ["id"],
      });

      if (!city) {
        return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({
          status: HTTP_STATUS_CODES.NOT_FOUND,
          message: i18n.__("api.subcategories.notFound"),
          data: "",
          error: "",
        });
      }
      // Check if a subcategory with the same name and lang already exists (excluding the current subcategory)
      for (let i = 0; i < translation.length; i++) {
        const duplicateCity = await MasterCityTrans.findOne({
          where: {
            isDeleted: false,
            name: translation[i].name.toLowerCase(),
            lang: translation[i].lang.toLowerCase(),
            id: { [Op.ne]: mastercityId },
          },
          attributes: ["id"],
        });

        if (duplicateCity) {
          return res.json({
            status: HTTP_STATUS_CODES.BAD_REQUEST,
            message: "A City with the same name and language already exists",
            data: "",
            error: "",
          });
        }

        const query = `
        SELECT id,
        master_city_id
        FROM master_city_trans
        WHERE master_city_id = :mastercityId
        AND is_deleted = false
   
        `;

        const existingsubCity = await sequelize.query(query, {
          replacements: {
            mastercityId: mastercityId,
          },
          type: sequelize.QueryTypes.SELECT, // Ensure SELECT query type
        });

        if (existingsubCity.length > 0) {
          // Ensure there are records to delete
          const idsToDelete = existingsubCity.map((city) => city.id);
          await MasterCityTrans.destroy({
            where: {
              id: idsToDelete,
              isDeleted: false,
            },
          });

          console.log(`Deleted city for mastercityId: ${mastercityId}`);
        } else {
          console.log(
            `No subCategory found to delete for masterSubcategoryId: ${mastercityId}`
          );
        }
      }

      let cityTrans = [];
      for (let i = 0; i < translation.length; i++) {
        const { name, lang } = translation[i];

        cityTrans.push({
          id: uuidv4(),
          masterCityId: mastercityId,
          name: translation[i].name.toLowerCase(),
          lang: translation[i].lang.toLowerCase(),
          updatedAt: Math.floor(Date.now() / 1000),
          updatedBy: adminId,
        });
      }
      // Create master-category || cat_id put in master category table

      await MasterCity.update(
        {
          updatedAt: Math.floor(Date.now() / 1000),
          updatedBy: adminId,
        },
        { where: { id: mastercityId } }
      );

      await MasterCityTrans.bulkCreate(cityTrans, {
        validate: true,
      });
      return res.status(HTTP_STATUS_CODES.OK).json({
        status: HTTP_STATUS_CODES.OK,
        message: i18n.__("api.subcategories.update OK"),
        data: mastercityId,
        error: "",
      });
    } catch (error) {
      console.error("Error updating city:", error);
      return res.json({
        status: HTTP_STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: "",
        error: error.message,
      });
    }
  },

  deleteCity: async (req, res) => {
    try {
      const { cityId } = req.params; // Ex
      console.log("cityId: ", cityId);
      const adminId = req.admin.id;

      if (!cityId) {
        return res.json({
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          message: "City ID is required",
          data: "",
          error: "",
        });
      }

      // Find city by ID
      const city = await MasterCityTrans.findOne({
        where: { masterCityId: cityId, isDeleted: false },
        attributes: ["id", "master_city_id", "name", "lang"],
      });

      if (!city) {
        return res.json({
          status: HTTP_STATUS_CODES.NOT_FOUND,
          message: i18n.__("api.cities.notFound"),
          data: "",
          error: "",
        });
      }

      // Check if the city is assigned to any account (if applicable)
      const assignedtoUser = await User.findOne({
        where: { cityId: city.id, isDeleted: false },
        attributes: ["id"],
      });

      if (assignedtoUser) {
        return res.json({
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          message: i18n.__("api.cities.assignedToAccount"),
          data: "",
          error: "",
        });
      }

      await MasterCity.update(
        { isDeleted: true, deletedAt: Math.floor(Date.now() / 1000) },
        { where: { id: cityId } }
      );

      await MasterCityTrans.update(
        { isDeleted: true, deletedAt: Math.floor(Date.now() / 1000) },
        { where: { masterCityId: cityId } }
      );

      return res.json({
        status: HTTP_STATUS_CODES.OK,
        message: i18n.__("api.cities.deleted"),
        data: "",
        error: "",
      });
    } catch (error) {
      console.error("Error deleting city:", error);
      return res.json({
        status: HTTP_STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: "",
        error: error.message,
      });
    }
  },
};

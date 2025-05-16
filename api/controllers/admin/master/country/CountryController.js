const { Op } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
const sequelize = require("../../../../config/db");
const { Sequelize } = require("sequelize");
const i18n = require("../../../../config/i18n");
const { HTTP_STATUS_CODES } = require("../../../../config/constants");
const { VALIDATION_RULES } = require("../../../../config/validationRules");
const {
  MasterCountryTrans,
  MasterCountry,
  MasterCity,
  MasterCityTrans,
  Account,
  User,
} = require("../../../../models");

const VALIDATOR = require("validatorjs");

module.exports = {
  addCountry: async (req, res) => {
    try {
      const adminId = req.admin.id;

      let { translation } = req.body;

      const validation = new VALIDATOR(req.body, {
        translation: VALIDATION_RULES.COUNTRY.translation, // Check if categories is a valid array
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
          SELECT id
          FROM master_country_trans
          WHERE is_deleted = false
          AND LOWER(lang) = LOWER(:lang)
          AND LOWER(name) = LOWER(:name)
        `;

        const existingCountry = await sequelize.query(query, {
          replacements: {
            name: translation[i].name,
            lang: translation[i].lang,
          },
          type: sequelize.QueryTypes.SELECT,
        });

        // If a country exists, return a conflict response
        if (existingCountry.length > 0) {
          return res.status(HTTP_STATUS_CODES.CONFLICT).json({
            status: HTTP_STATUS_CODES.CONFLICT,
            message: `Country '${translation[i].name}' already exists in '${translation[i].lang}'`,
            data: "",
            error: "",
          });
        }
      }

      //   // Generate UUID for Mastercountry
      const masterCountryId = uuidv4();

      // Prepare data for bulk insert
      let countryTrans = [];
      for (let i = 0; i < translation.length; i++) {
        const { name, lang } = translation[i];

        countryTrans.push({
          masterCountryId,
          name: translation[i].name,
          lang: translation[i].lang,
          createdAt: Math.floor(Date.now() / 1000),
          createdBy: adminId,
        });
      }
      // Create master- country|| cat_id put in master country table
      const country = await MasterCountry.create({
        id: masterCountryId,
        createdAt: Math.floor(Date.now() / 1000),
        createdBy: adminId,
      });

      //   // Create master-country-trans
      await MasterCountryTrans.bulkCreate(countryTrans, {
        validate: true,
      });

      return res.status(HTTP_STATUS_CODES.CREATED).json({
        status: HTTP_STATUS_CODES.CREATED,
        message: i18n.__("api.countries.addSuccess"),
        data: { masterCountryId },
        error: "",
      });
    } catch (error) {
      console.error(error);
      return res.status(HTTP_STATUS_CODES.SERVER_ERROR).json({
        status: HTTP_STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: "",
        error: error.message || "Internal server error",
      });
    }
  },
  updateCountry: async (req, res) => {
    try {
      const adminId = req.admin.id;
      const { countryId, translation } = req.body;

      const validation = new VALIDATOR(req.body, {
        countryId: VALIDATION_RULES.COUNTRY.masterCountryId,
        translation: VALIDATION_RULES.COUNTRY.translation,
      });

      if (validation.fails()) {
        return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          message: "Validation failed.",
          data: "",
          error: validation.errors.all(),
        });
      }

      // Find country by ID
      const country = await MasterCountry.findOne({
        where: { id: countryId, isDeleted: false },
        attributes: ["id"],
      });

      // console.log("country: ", country);
      if (!country) {
        return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({
          status: HTTP_STATUS_CODES.NOT_FOUND,
          message: i18n.__("api.categories.notFound"),
          data: "",
          error: "",
        });
      }

      // Check if a country with the same name and lang already exists (excluding the current country)
      for (let i = 0; i < translation.length; i++) {
        const duplicateCountry = await MasterCountryTrans.findOne({
          where: {
            isDeleted: false,
            name: translation[i].name.toLowerCase(),
            lang: translation[i].lang.toLowerCase(),
            id: { [Op.ne]: countryId },
          },
          attributes: ["id"],
        });

        if (duplicateCountry) {
          return res.json({
            status: HTTP_STATUS_CODES.BAD_REQUEST,
            message: "A country with the same name and language already exists",
            data: "",
            error: "",
          });
        }

        const query = `
        SELECT id,
        master_country_id
        FROM master_country_trans
        WHERE master_country_id = :countryId
        AND is_deleted = false
   
        `;

        const existingCountry = await sequelize.query(query, {
          replacements: {
            countryId: countryId,
          },
          type: sequelize.QueryTypes.SELECT, // Ensure SELECT query type
        });

        console.log("existingCountry: ", existingCountry);

        if (existingCountry.length > 0) {
          // Ensure there are records to delete
          const idsToDelete = existingCountry.map((cat) => cat.id);
          await MasterCountryTrans.destroy({
            where: {
              id: idsToDelete,
              isDeleted: false,
            },
          });

          console.log(`Deleted countrty for masterCountryId: ${countryId}`);
        } else {
          console.log(
            `No countrty found to delete for masterCountryId: ${countryId}`
          );
        }
      }

      let countrtyTrans = [];
      for (let i = 0; i < translation.length; i++) {
        const { name, lang } = translation[i];

        countrtyTrans.push({
          id: uuidv4(),
          masterCountryId: countryId,
          name: translation[i].name.toLowerCase(),
          lang: translation[i].lang.toLowerCase(),
          updatedAt: Math.floor(Date.now() / 1000),
          updatedBy: adminId,
        });
      }

      await MasterCountry.update(
        {
          updatedAt: Math.floor(Date.now() / 1000),
          updatedBy: adminId,
        },
        { where: { id: countryId } }
      );

      await MasterCountryTrans.bulkCreate(countrtyTrans, { validate: true });

      return res.status(HTTP_STATUS_CODES.OK).json({
        status: HTTP_STATUS_CODES.OK,
        message: i18n.__("api.countries.update OK"),
        data: countrty_trans,
        error: "",
      });
    } catch (error) {
      console.error("Error updating country:", error);
      return res.status(HTTP_STATUS_CODES.SERVER_ERROR).json({
        status: HTTP_STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: "",
        error: error.message || "Internal server error",
      });
    }
  },
  deleteCountry: async (req, res) => {
    try {
      const adminId = req.admin.id;
      const { countryId } = req.params;

      const validation = new VALIDATOR(req.params, {
        countryId: VALIDATION_RULES.COUNTRY.masterCountryId,
      });

      if (validation.fails()) {
        return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          message: "Validation failed.",
          data: "",
          error: validation.errors.all(),
        });
      }
      // Find category by ID
      const country = await MasterCountry.findOne({
        where: { id: countryId, isDeleted: false },
        attributes: ["id"],
      });

      if (!country) {
        return res.json({
          status: HTTP_STATUS_CODES.NOT_FOUND,
          message: i18n.__("api.countries.notFound"),
          data: "",
          error: "",
        });
      }
      const countryInUser = await User.findOne({
        where: { id: countryId, isDeleted: false },
        attributes: ["id"],
      });

      if (countryInAccount) {
        return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          message: "country exists in User, cannot proceed.",
          data: "",
          error: "",
        });
      }

      //find for subcategory

      const query = `
          SELECT 
          mc.id AS id
          FROM master_city AS mc
          WHERE is_deleted = false
          AND mc.country_id =:countryId
          `;

      const city = await sequelize.query(query, {
        replacements: { countryId: countryId },
        type: sequelize.QueryTypes.SELECT,
      });

      if (!city.length) {
        return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({
          status: HTTP_STATUS_CODES.NOT_FOUND,
          message: "No cities found for this countries.",
          data: "",
          error: "",
        });
      }

      // **Update MasterCategory**
      await MasterCountry.update(
        {
          isDeleted: true,
          deletedAt: Math.floor(Date.now() / 1000),
          deletedBy: adminId,
        },
        { where: { id: countryId } }
      );

      // **Update MasterCategoryTrans**
      await MasterCountryTrans.update(
        {
          isDeleted: true,
          deletedAt: Math.floor(Date.now() / 1000),
          deletedBy: adminId,
        },
        { where: { master_country_id: countryId } }
      );

      return res.status(HTTP_STATUS_CODES.OK).json({
        status: HTTP_STATUS_CODES.OK,
        message: "Country deleted  OKfully",
        data: { countryId },
        error: "",
      });
    } catch (error) {
      console.error("Error deleting country:", error);
      return res.status(HTTP_STATUS_CODES.SERVER_ERROR).json({
        status: HTTP_STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: "",
        error: error.message || "Internal server error",
      });
    }
  }, 
  //not working
  listingCountriesWithCities: async (req, res) => {
    try {
      const adminId = req.admin.id;
      const search = req.query.q; // Search query

      // Define base SQL query
      let rawQuery = `
      SELECT 
        mc.id AS country_id,
        mct.name AS country_name,
        mct.lang AS country_lang,
        mc.is_active AS country_active,
        mcity.id AS city_id,
        mcityt.name AS city_name,
        mcityt.lang AS city_lang,
        mcity.is_active AS city_active

      FROM master_country AS mc
      JOIN master_country_trans AS mct 
        ON mc.id = mct.master_country_id
      LEFT JOIN master_city AS mcity
        ON mc.id = mcity.country_id 
        AND mcity.is_deleted = false
      LEFT JOIN master_city_trans AS mcityt
       ON mcityt.master_city_id = mcityt.id
        WHERE mcityt.is_deleted = false
    `;

      // If search query is provided, filter countries by name
      if (search) {
        rawQuery += ` AND mct.name ILIKE :search `;
      }

      rawQuery += ` ORDER BY mc.created_at DESC `;

      // Execute SQL query
      const countriesData = await sequelize.query(rawQuery, {
        replacements: search ? { searchQuery: `%${search}%` } : {},
        type: Sequelize.QueryTypes.SELECT,
      });

      // If no results found
      if (!countriesData || countriesData.length === 0) {
        return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({
          status: HTTP_STATUS_CODES.NOT_FOUND,
          message: i18n.__("api.countries.notFound") || "No countries found",
          data: [],
          error: "No country data found for the given criteria.",
        });
      }
      // Format the data
      const formattedData = countriesData.reduce((acc, row) => {
        // Check if country already exists in accumulator
        let country = acc.find((c) => c.id === row.country_id);
        if (!country) {
          country = {
            id: row.country_id,
            name: [],
            isActive: row.country_active,
            cities: [],
          };
          acc.push(country);
        }

        // Add country translations
        if (row.country_name) {
          const existsCountryName = country.name.some(
            (t) => t.lang === row.country_lang && t.value === row.country_name
          );
          if (!existsCountryName) {
            country.name.push({
              value: row.country_name,
              lang: row.country_lang,
            });
          }
        }

        // Handle city data
        if (row.city_id) {
          let city = country.cities.find((c) => c.id === row.city_id);
          if (!city) {
            city = {
              id: row.city_id,
              name: [],
              isActive: row.city_active,
            };
            country.cities.push(city);
          }
          if (row.city_name) {
            const existsCityName = city.name.some(
              (t) => t.lang === row.city_lang && t.value === row.city_name
            );
            if (!existsCityName) {
              city.name.push({
                value: row.city_name,
                lang: row.city_lang,
              });
            }
          }
        }

        return acc;
      }, []);

      return res.status(HTTP_STATUS_CODES.OK).json({
        status: HTTP_STATUS_CODES.OK,
        message:
          i18n.__("api.countries.list OK") || "Countries listed  OKfully",
        data: formattedData,
        error: "",
      });
    } catch (error) {
      console.error("Error fetching countries with cities:", error);
      return res.status(HTTP_STATUS_CODES.SERVER_ERROR).json({
        status: HTTP_STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: "",
        error: error.message || "Internal server error",
      });
    }
  },
};

const { Op } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
const sequelize = require("../../../../config/db");
const i18n = require("../../../../config/i18n");
const { HTTP_STATUS_CODES } = require("../../../../config/constants");
const { VALIDATION_RULES } = require("../../../../config/validationRules");
const {
  MasterCountryTrans,
  MasterCountry,
  MasterCity,
  MasterCityTrans,
} = require("../../../../models");

const VALIDATOR = require("validatorjs");

module.exports = {
  addCountry: async (req, res) => {
    try {
      const adminId = req.admin.id;

      let { countries } = req.body;
      console.log("countries: ", countries);

      const validation = new VALIDATOR(req.body, {
        countries: VALIDATION_RULES.COUNTRY.countries, // Check if categories is a valid array
      });

      if (validation.fails()) {
        return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          message: "Validation failed.",
          data: null,
          error: validation.errors.all(),
        });
      }

      for (let i = 0; i < countries.length; i++) {
        const query = `
          SELECT id
          FROM master_country_trans
          WHERE is_deleted = false
          AND lang = :lang
          AND LOWER(name) = LOWER(:name)
        `;

        const existingCountry = await sequelize.query(query, {
          replacements: {
            name: countries[i].name,
            lang: countries[i].lang,
          },
          type: sequelize.QueryTypes.SELECT,
        });

        // If a category exists, return a conflict response
        if (existingCountry.length > 0) {
          return res.status(HTTP_STATUS_CODES.CONFLICT).json({
            status: HTTP_STATUS_CODES.CONFLICT,
            message: `Country '${countries[i].name}' already exists in '${categories[i].lang}'`,
            data: null,
            error: null,
          });
        }
      }

      //   // Generate UUID for MasterCategory
      const masterCountryId = uuidv4();

      // Prepare data for bulk insert
      let country_trans = [];
      for (let i = 0; i < countries.length; i++) {
        const { name, lang } = countries[i];

        country_trans.push({
          masterCountryId,
          name: countries[i].name,
          lang: countries[i].lang,
          createdAt: Math.floor(Date.now() / 1000),
          createdBy: adminId,
        });
      }
      // Create master-category || cat_id put in master category table
      const country = await MasterCountry.create({
        id: masterCountryId,
        createdAt: Math.floor(Date.now() / 1000),
        createdBy: adminId,
      });

      //   // Create master-category-trans
      await MasterCountryTrans.bulkCreate(country_trans);

      return res.status(HTTP_STATUS_CODES.CREATED).json({
        status: HTTP_STATUS_CODES.CREATED,
        message: i18n.__("api.countries.addSuccess"),
        data: { masterCountryId },
        error: null,
      });
    } catch (error) {
      console.error(error);
      return res.status(HTTP_STATUS_CODES.SERVER_ERROR).json({
        status: HTTP_STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: null,
        error: error.message || "Internal server error",
      });
    }
  },
  updateCountry: async (req, res) => {
    try {    const adminId = req.admin.id;
      let countries = req.body;

      // Validate request payload
      if (!Array.isArray(countries) || countries.length === 0) {
        return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          message: i18n.__("api.countries.invalidInput"),
          data: null,
          error: "Invalid input: an array of country objects is required.",
        });
      }

      let updateData = [];

      for (let i = 0; i < countries.length; i++) {
        const { id, name, lang } = countries[i];

        if (!id || !name || !lang) {
          return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
            status: HTTP_STATUS_CODES.BAD_REQUEST,
            message: "ID, name, and lang are required",
            data: null,
            error: "Missing required fields in input.",
          });
        }

        updateData.push({ id, name: name.toLowerCase(), lang });
      }

      // Check if the countries exist
      const existingCountries = await MasterCountryTrans.findAll({
        where: {
          isDeleted: false,
          id: { [Op.in]: updateData.map((c) => c.id) },
        },
        attributes: ["id", "master_country_id", "name", "lang"],
      });

      if (!existingCountries || existingCountries.length === 0) {
        return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({
          status: HTTP_STATUS_CODES.NOT_FOUND,
          message: "Country not found",
          data: null,
          error: "No matching country records found for update.",
        });
      }

      // Check for duplicate country names in the same language
      const duplicateCountry = await MasterCountryTrans.findOne({
        where: {
          isDeleted: false,
          [Op.or]: updateData.map((c) => ({
            name: c.name,
            lang: c.lang,
          })),
          id: { [Op.notIn]: updateData.map((c) => c.id) }, // Ensure it's not checking itself
        },
        attributes: ["id", "master_country_id", "name", "lang"],
      });

      if (duplicateCountry) {
        return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          message: "A country with the same name and language already exists",
          data: null,
          error: "Duplicate country detected in the same language.",
        });
      }
      // Perform the update
      for (let i = 0; i < updateData.length; i++) {
        const { id, name, lang } = updateData[i];

        await MasterCountryTrans.update({ name, lang }, { where: { id } });
      }

      return res.status(HTTP_STATUS_CODES.OK).json({
        status: HTTP_STATUS_CODES.OK,
        message: i18n.__("api.countries.update OK"),
        data: updateData,
        error: null,
      });
    } catch (error) {
      console.error("Error updating country:", error);
      return res.status(HTTP_STATUS_CODES.SERVER_ERROR).json({
        status: HTTP_STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: null,
        error: error.message || "Internal server error",
      });
    }
  },
  deleteCountry: async (req, res) => {
    try {    const adminId = req.admin.id;
      const { countryId } = req.params;

      // Validate input
      if (!countryId) {
        return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          message: "Country ID is required",
          data: null,
          error: "Missing country ID in request parameters.",
        });
      }
      // Find country by ID
      const country = await MasterCountry.findOne({
        where: { id: countryId, isDeleted: false },
        attributes: ["id"],
      });

      console.log("Country found:", country);

      if (!country) {
        return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({
          status: HTTP_STATUS_CODES.NOT_FOUND,
          message: "Country not found or already deleted",
          data: null,
          error: "No active country record found for deletion.",
        });
      }

      // Check if the country is assigned to any account
      const assignedAccounts = await Account.findOne({
        where: { countryId: countryId },
        attributes: ["id"],
      });

      if (assignedAccounts) {
        return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          message: "Cannot delete. Country is linked to an account",
          data: null,
          error: "Country is currently assigned to an account.",
        });
      }
      // Soft delete the country (recommended approach)
      await MasterCountry.update(
        { isDeleted: true, deletedAt: Math.floor(Date.now() / 1000) },
        { where: { id: countryId } }
      );

      // Soft delete translations
      await MasterCountryTrans.update(
        { isDeleted: true, deletedAt: Math.floor(Date.now() / 1000) },
        { where: { master_country_id: countryId } }
      );

      return res.status(HTTP_STATUS_CODES.OK).json({
        status: HTTP_STATUS_CODES.OK,
        message: "Country deleted  OKfully",
        data: { countryId },
        error: null,
      });
    } catch (error) {
      console.error("Error deleting country:", error);
      return res.status(HTTP_STATUS_CODES.SERVER_ERROR).json({
        status: HTTP_STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: null,
        error: error.message || "Internal server error",
      });
    }
  },
  listingCountriesWithCities: async (req, res) => {
    try {    const adminId = req.admin.id;
      const search = req.query.q; // Search query

      // Define base SQL query
      let rawQuery = `
      SELECT 
        mc.id AS country_id,
        mct.name AS country_name,
        mct.lang AS country_lang,
        mc."isActive" AS country_active,
        city.id AS city_id,
        cityt.name AS city_name,
        cityt.lang AS city_lang,
        city."isActive" AS city_active
      FROM master_country mc
      JOIN master_country_trans mct ON mc.id = mct.master_country_id
      LEFT JOIN master_city city ON mc.id = city.countryId AND city."isDeleted" = false
      LEFT JOIN master_city_trans cityt ON city.id = cityt.master_city_id
      WHERE mc."isDeleted" = false
    `;

      // If search query is provided, filter countries by name
      if (search) {
        rawQuery += ` AND mct.name ILIKE :searchQuery `;
      }

      rawQuery += ` ORDER BY mc.created_at DESC `;

      // Execute SQL query
      const countriesData = await sequelize.query(rawQuery, {
        replacements: search ? { searchQuery: `%${search}%` } : {},
        type: Sequelize.QueryTypes.SELECT,
      });

      console.log("Fetched Countries with Cities: ", countriesData);

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
        error: null,
      });
    } catch (error) {
      console.error("Error fetching countries with cities:", error);
      return res.status(HTTP_STATUS_CODES.SERVER_ERROR).json({
        status: HTTP_STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: null,
        error: error.message || "Internal server error",
      });
    }
  },
};

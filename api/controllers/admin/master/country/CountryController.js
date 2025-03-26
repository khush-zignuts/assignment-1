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
  addCountry: async (req, res) => {
    try {
      if (!validateRequest(req.body, VALIDATION_RULES.COUNTRY, res)) return;

      let countries = req.body.data;
      console.log("countries: ", countries);

      if (!Array.isArray(countries) || countries.length === 0) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
          status: STATUS_CODES.BAD_REQUEST,
          message: i18n.__("api.countries.invalidInput"),
          data: null,
          error: "Both 'name' and 'lang' are required for each country.",
        });
      }

      let countryData = [];

      for (let i = 0; i < countries.length; i++) {
        const { name, lang } = countries[i];
        if (!name || !lang) {
          return res.status(STATUS_CODES.BAD_REQUEST).json({
            status: STATUS_CODES.BAD_REQUEST,
            message: "Both name and lang are required",
            data: null,
            error: "Missing name or language field in the input.",
          });
        }
        // Push each valid translation into our categoryData array
        countryData.push({ name, lang });
      }

      //  Check for existing country
      const existingCountry = await MasterCountryTrans.findAll({
        where: {
          isDeleted: false,
          [Op.or]: countryData.map((c) => ({
            name: c.name,
            lang: c.lang,
          })),
        },
        attributes: ["id", "master_country_id", "name", "lang"],
      });

      if (existingCountry && existingCountry.length > 0) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
          status: STATUS_CODES.BAD_REQUEST,
          message: "Country already exists",
          data: null,
          error: null,
        });
      }

      //   // Generate UUID for MasterCategory
      const master_country_id = uuidv4();
      console.log("master_country_id: ", master_country_id);

      // Create master-category || cat_id put in master category table
      const country = await MasterCountry.create({
        id: master_country_id,
      });

      // Prepare data for bulk insert
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

      //   // Create master-category-trans
      await MasterCountryTrans.bulkCreate(country_trans);

      return res.status(STATUS_CODES.CREATED).json({
        status: STATUS_CODES.CREATED,
        message: i18n.__("api.countries.addSuccess"),
        data: { master_country_id },
        error: null,
      });
    } catch (error) {
      console.error(error);
      return res.status(STATUS_CODES.SERVER_ERROR).json({
        status: STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: null,
        error: error.message || "Internal server error",
      });
    }
  },
  updateCountry: async (req, res) => {
    try {
      let countries = req.body;

      // Validate request payload
      if (!Array.isArray(countries) || countries.length === 0) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
          status: STATUS_CODES.BAD_REQUEST,
          message: i18n.__("api.countries.invalidInput"),
          data: null,
          error: "Invalid input: an array of country objects is required.",
        });
      }

      let updateData = [];

      for (let i = 0; i < countries.length; i++) {
        const { id, name, lang } = countries[i];

        if (!id || !name || !lang) {
          return res.status(STATUS_CODES.BAD_REQUEST).json({
            status: STATUS_CODES.BAD_REQUEST,
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
        return res.status(STATUS_CODES.NOT_FOUND).json({
          status: STATUS_CODES.NOT_FOUND,
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
        return res.status(STATUS_CODES.BAD_REQUEST).json({
          status: STATUS_CODES.BAD_REQUEST,
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

      return res.status(STATUS_CODES.SUCCESS).json({
        status: STATUS_CODES.SUCCESS,
        message: i18n.__("api.countries.updateSuccess"),
        data: updateData,
        error: null,
      });
    } catch (error) {
      console.error("Error updating country:", error);
      return res.status(STATUS_CODES.SERVER_ERROR).json({
        status: STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: null,
        error: error.message || "Internal server error",
      });
    }
  },
  deleteCountry: async (req, res) => {
    try {
      const { countryId } = req.params;

      // Validate input
      if (!countryId) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
          status: STATUS_CODES.BAD_REQUEST,
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
        return res.status(STATUS_CODES.NOT_FOUND).json({
          status: STATUS_CODES.NOT_FOUND,
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
        return res.status(STATUS_CODES.BAD_REQUEST).json({
          status: STATUS_CODES.BAD_REQUEST,
          message: "Cannot delete. Country is linked to an account",
          data: null,
          error: "Country is currently assigned to an account.",
        });
      }
      // Soft delete the country (recommended approach)
      await MasterCountry.update(
        { isDeleted: true },
        { where: { id: countryId } }
      );

      // Soft delete translations
      await MasterCountryTrans.update(
        { isDeleted: true },
        { where: { master_country_id: countryId } }
      );

      return res.status(STATUS_CODES.SUCCESS).json({
        status: STATUS_CODES.SUCCESS,
        message: "Country deleted successfully",
        data: { countryId },
        error: null,
      });
    } catch (error) {
      console.error("Error deleting country:", error);
      return res.status(STATUS_CODES.SERVER_ERROR).json({
        status: STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: null,
        error: error.message || "Internal server error",
      });
    }
  },
  listingCountriesWithCities: async (req, res) => {
    try {
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
        return res.status(STATUS_CODES.NOT_FOUND).json({
          status: STATUS_CODES.NOT_FOUND,
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

      return res.status(STATUS_CODES.SUCCESS).json({
        status: STATUS_CODES.SUCCESS,
        message:
          i18n.__("api.countries.listSuccess") ||
          "Countries listed successfully",
        data: formattedData,
        error: null,
      });
    } catch (error) {
      console.error("Error fetching countries with cities:", error);
      return res.status(STATUS_CODES.SERVER_ERROR).json({
        status: STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: null,
        error: error.message || "Internal server error",
      });
    }
  },
};

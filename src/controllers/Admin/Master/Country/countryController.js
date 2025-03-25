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

  updateCountry: async (req, res) => {
    try {
      let countries = req.body.data;
      console.log("Countries to update:", countries);

      // Validate request payload
      if (!Array.isArray(countries) || countries.length === 0) {
        return res
          .status(STATUS_CODES.BAD_REQUEST)
          .json({ message: i18n.__("api.countries.invalidInput") });
      }

      let updateData = [];

      for (let i = 0; i < countries.length; i++) {
        const { id, name, lang } = countries[i];

        if (!id || !name || !lang) {
          return res
            .status(STATUS_CODES.BAD_REQUEST)
            .json({ message: "ID, name, and lang are required" });
        }

        updateData.push({ id, name: name.toLowerCase(), lang });
      }

      console.log("updateData: ", updateData);

      // Check if the countries exist
      const existingCountries = await MasterCountryTrans.findAll({
        where: {
          isDeleted: false,
          id: { [Op.in]: updateData.map((c) => c.id) },
        },
      });

      if (!existingCountries || existingCountries.length === 0) {
        return res
          .status(STATUS_CODES.NOT_FOUND)
          .json({ message: "Country not found" });
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
      });

      if (duplicateCountry) {
        return res
          .status(STATUS_CODES.BAD_REQUEST)
          .json({
            message: "A country with the same name and language already exists",
          });
      }

      // Perform the update
      for (let i = 0; i < updateData.length; i++) {
        const { id, name, lang } = updateData[i];

        await MasterCountryTrans.update({ name, lang }, { where: { id } });
      }

      return res.status(STATUS_CODES.SUCCESS).json({
        message: i18n.__("api.countries.updateSuccess"),
      });
    } catch (error) {
      console.error("Error updating country:", error);
      return res
        .status(STATUS_CODES.SERVER_ERROR)
        .json({ message: i18n.__("api.errors.serverError"), error });
    }
  },
  deleteCountry: async (req, res) => {
    try {
      const { countryId } = req.params;
      console.log("Deleting country with ID:", countryId);

      // Validate input
      if (!countryId) {
        return res
          .status(STATUS_CODES.BAD_REQUEST)
          .json({ message: "Country ID is required" });
      }

      // Find country by ID
      const country = await MasterCountry.findOne({
        where: { id: countryId, isDeleted: false },
      });

      console.log("Country found:", country);

      if (!country) {
        return res
          .status(STATUS_CODES.NOT_FOUND)
          .json({ message: "Country not found or already deleted" });
      }

      // Check if the country is assigned to any account
      const assignedAccounts = await Account.findOne({
        where: { countryId: countryId },
      });

      if (assignedAccounts) {
        return res
          .status(STATUS_CODES.BAD_REQUEST)
          .json({ message: "Cannot delete. Country is linked to an account" });
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

      return res
        .status(STATUS_CODES.SUCCESS)
        .json({ message: "Country deleted successfully" });
    } catch (error) {
      console.error("Error deleting country:", error);
      return res
        .status(STATUS_CODES.SERVER_ERROR)
        .json({ message: i18n.__("api.errors.serverError"), error });
    }
  },
  listingCountriesWithCities: async (req, res) => {
    try {
      const search = req.query.q; // Search query
      console.log("Search Query:", search);

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
        return res.status(404).json({
          message: i18n.__("api.countries.notFound") || "No countries found",
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

      return res.status(200).json({
        message:
          i18n.__("api.countries.listSuccess") ||
          "Countries listed successfully",
        data: formattedData,
      });
    } catch (error) {
      console.error("Error fetching countries with cities:", error);
      return res.status(500).json({
        message: i18n.__("api.errors.serverError"),
        error,
      });
    }
  },
};

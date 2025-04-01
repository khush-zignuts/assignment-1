const i18n = require("../../config/i18n");
const { HTTP_STATUS_CODES } = require("../../config/constants");
const { Sequelize, Op } = require("sequelize");
const sequelize = require("../../config/db");

module.exports = {
  getCategory: async (req, res) => {
    try {
      const lang = i18n.getLocale() || "en"; // Use the language preference

      let whereClause = "WHERE mc.is_deleted = false";
      let replacements = { lang };

      const rawQuery = `
            SELECT
              mc.id AS category_id,
              mct.name AS category_name,
              mct.lang AS category_lang,
              mc.is_active AS category_active
            FROM master_category AS mc
            JOIN master_category_trans AS mct ON mc.id = mct.master_category_id
            ${whereClause}
             AND mct.lang = :lang
            ORDER BY mc.created_at DESC
          `;

      const categoriesData = await sequelize.query(rawQuery, {
        replacements,
        type: Sequelize.QueryTypes.SELECT,
      });

      if (!categoriesData || categoriesData.length === 0) {
        return res.json({
          status: HTTP_STATUS_CODES.NOT_FOUND,
          message: i18n.__("api.categories.notFound") || "No categories found",
          data: null,
          error: null,
        });
      }

      // Format the category data
      const formattedData = categoriesData.map((row) => ({
        name: row.category_name,
      }));

      return res.json({
        status: HTTP_STATUS_CODES.OK,
        message:
          i18n.__("api.categories.list OK") || "Categories listed successfully",
        data: formattedData,
        error: null,
      });
    } catch (error) {
      console.error("Error fetching categories:", error);
      return res.json({
        status: HTTP_STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: null,
        error: error.message,
      });
    }
  },
  getSubCategory: async (req, res) => {
    try {
      const lang = i18n.getLocale() || "en"; // Use the language preference
      const categoryId = req.params.categoryId;

      // Raw SQL Query to fetch subcategories with translations in the specified language
      const rawQuery = `
        SELECT
          ms.id AS subcategory_id,
          mst.name AS subcategory_name,
          mst.lang AS subcategory_lang,
          ms.is_active AS subcategory_active,
          mc.id AS category_id,
          mct.name AS category_name,
          mct.lang AS category_lang
        FROM master_subcategory AS ms
        JOIN master_subcategory_trans AS mst ON ms.id = mst.master_subcategory_id
        JOIN master_category AS mc ON ms.category_id = mc.id
        JOIN master_category_trans AS mct ON mc.id = mct.master_category_id
         WHERE mct.master_category_id = :categoryId
         AND ms.is_deleted = false
        AND mst.lang = :lang
        AND mct.lang = :lang
        ORDER BY ms.created_at DESC
      `;

      // Execute the raw query
      const subCategoriesData = await sequelize.query(rawQuery, {
        replacements: { lang, categoryId },
        type: Sequelize.QueryTypes.SELECT,
      });

      if (!subCategoriesData || subCategoriesData.length === 0) {
        return res.json({
          status: HTTP_STATUS_CODES.NOT_FOUND,
          message:
            i18n.__("api.subcategories.notFound") || "No subcategories found",
          data: null,
          error: null,
        });
      }

      // Format the subcategory data
      const formattedData = subCategoriesData.map((row) => ({
        subcategoryName: row.subcategory_name,
      }));

      // Return the formatted subcategories with pagination info
      return res.json({
        status: HTTP_STATUS_CODES.OK,
        message:
          i18n.__("api.subcategories.list OK") ||
          "Subcategories listed successfully",
        data: formattedData,
        error: null,
      });
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      return res.json({
        status: HTTP_STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: null,
        error: error.message,
      });
    }
  },
  getCountry: async (req, res) => {
    try {
      const lang = i18n.getLocale() || "en"; // Use the language preference

      // Define base SQL query to fetch countries
      let rawQuery = `
        SELECT 
          mc.id AS country_id,
          mct.name AS country_name,
          mct.lang AS country_lang,
          mc.is_active AS country_active
        FROM master_country AS mc
        JOIN master_country_trans AS mct 
          ON mc.id = mct.master_country_id
        WHERE mc.is_deleted = false
        AND mct.lang = :lang
      `;

      rawQuery += ` ORDER BY mc.created_at DESC`;

      // Execute the query
      const countriesData = await sequelize.query(rawQuery, {
        replacements: { lang },
        type: Sequelize.QueryTypes.SELECT,
      });

      if (!countriesData || countriesData.length === 0) {
        return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({
          status: HTTP_STATUS_CODES.NOT_FOUND,
          message: i18n.__("api.countries.notFound") || "No countries found",
          data: [],
          error: "No country data found for the given criteria.",
        });
      }

      // Format the country data
      const formattedData = countriesData.map((row) => ({
        countryName: row.country_name,
      }));

      return res.status(HTTP_STATUS_CODES.OK).json({
        status: HTTP_STATUS_CODES.OK,
        message:
          i18n.__("api.countries.list OK") || "Countries listed successfully",
        data: formattedData,
        error: null,
      });
    } catch (error) {
      console.error("Error fetching countries:", error);
      return res.status(HTTP_STATUS_CODES.SERVER_ERROR).json({
        status: HTTP_STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: null,
        error: error.message || "Internal server error",
      });
    }
  },
  getCity: async (req, res) => {
    try {
      const lang = i18n.getLocale() || "en"; // Use the language preference
      const countryId = req.params.countryId; // Country ID from params

      // Define base SQL query to fetch cities for the specified country
      let rawQuery = `
        SELECT 
          mcity.id AS city_id,
          mcityt.name AS city_name,
          mcityt.lang AS city_lang,
          mcity.is_active AS city_active
        FROM master_city AS mcity
        JOIN master_city_trans AS mcityt 
          ON mcity.id = mcityt.master_city_id
        WHERE mcity.country_id = :countryId
          AND mcity.is_deleted = false
          AND mcityt.is_deleted = false
          AND mcityt.lang = :lang
           ORDER BY mcity.created_at DESC
      `;

      // Execute the query
      const citiesData = await sequelize.query(rawQuery, {
        replacements: { lang, countryId },
        type: Sequelize.QueryTypes.SELECT,
      });

      if (!citiesData || citiesData.length === 0) {
        return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({
          status: HTTP_STATUS_CODES.NOT_FOUND,
          message:
            i18n.__("api.cities.notFound") || "No cities found for the country",
          data: [],
          error: "No city data found for the given country or criteria.",
        });
      }

      // Format the city data
      const formattedData = citiesData.map((row) => ({
        cityName: row.city_name,
      }));

      return res.status(HTTP_STATUS_CODES.OK).json({
        status: HTTP_STATUS_CODES.OK,
        message: i18n.__("api.cities.list OK") || "Cities listed successfully",
        data: formattedData,
        error: null,
      });
    } catch (error) {
      console.error("Error fetching cities:", error);
      return res.status(HTTP_STATUS_CODES.SERVER_ERROR).json({
        status: HTTP_STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: null,
        error: error.message || "Internal server error",
      });
    }
  },
};

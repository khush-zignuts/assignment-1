const User = require("../../../models/User");
const i18n = require("../../../config/i18n");
const { HTTP_STATUS_CODES } = require("../../../config/constants");
const { VALIDATION_RULES } = require("../../../config/validationRules");
const VALIDATOR = require("validatorjs");
const { Sequelize, Op } = require("sequelize");
const sequelize = require("../../../../api/config/db");

const MasterCity = require("../../../models/MasterCity");
const MasterCountry = require("../../../models/MasterCountry");
const MasterCategoryTrans = require("../../../models/MasterCategoryTrans");
const MasterCountryTrans = require("../../../models/MasterCountryTrans");

module.exports = {
  deleteUser: async (req, res) => {
    try {
      const adminId = req.admin.id;
      const userId = req.params.userId; // Get user ID from request param

      const validation = new VALIDATOR(req.params.userId, {
        userId: VALIDATION_RULES.ACCOUNT.userId,
      });

      if (validation.fails()) {
        return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          message: "Validation failed.",
          data: null,
          error: validation.errors.all(),
        });
      }

      // Check if user exists and is not deleted
      const user = await User.findOne({
        where: {
          id: userId,
          isDeleted: false,
        },
        attributes: [
          "id",
          "name",
          "email",
          "password",
          "gender",
          "city",
          "country",
          "companyName",
        ],
      });

      if (!user) {
        return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({
          status: HTTP_STATUS_CODES.NOT_FOUND,
          message: i18n.__("api.auth.delete.usernotFound"),
          data: null,
          error: null,
        });
      }

      // Delete user token
      await User.update(
        {
          accessToken: null,
          isDeleted: true,
          deleted_at: Math.floor(Date.now() / 1000),
        }, // Clear token
        { where: { id: userId } }
      );

      return res.status(HTTP_STATUS_CODES.OK).json({
        status: HTTP_STATUS_CODES.OK,
        message: i18n.__("api.auth.delete.OKDelete"),
        data: { userId },
        error: null,
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      return res.status(HTTP_STATUS_CODES.SERVER_ERROR).json({
        status: HTTP_STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: null,
        error: error.message,
      });
    }
  },

  getAll: async (req, res) => {
    try {
      //  filters
      const { cityName, countryName, search } = req.query;

      //  pagination parameters
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const lang = req.headers.lang || "en";
      //initialize localization
      req.setLocale(lang);

      // Check existence
      if (cityName) {
        const cityExists = await MasterCategoryTrans.findOne(
          {
            where: {
              name: cityName,
              isDeleted: false,
              isActive: true,
            },
          },
          (attributes = ["id", "name", "lang"])
        );

        console.log("cityExists: ", cityExists);
        if (!cityExists) {
          return res.status(ResponseCodes.BAD_REQUEST).json({
            status: ResponseCodes.BAD_REQUEST,
            data: "",
            message: i18n.__("CITY_NOT_FOUND"),
            error: "",
          });
        }
      }

      //  country
      if (countryName) {
        const countryExists = await MasterCountryTrans.findOne(
          {
            where: {
              name: countryName,
              isDeleted: false,
              isActive: true,
            },
          },
          (attributes = ["id", "name", "lang"])
        );
        console.log("countryExists: ", countryExists);
        if (!countryExists) {
          return res.status(ResponseCodes.BAD_REQUEST).json({
            status: ResponseCodes.BAD_REQUEST,
            data: "",
            message: i18n.__("COUNTRY_NOT_FOUND"),
            error: "",
          });
        }
      }

      //  user existence (by name or email)
      if (search) {
        const userExists = await User.findOne({
          where: {
            isDeleted: false,
            isActive: true,
            [Op.or]: [
              { name: { [Op.iLike]: `%${search}%` } },
              { email: { [Op.iLike]: `%${search}%` } }, // Uncomment if needed
            ],
          },
          attributes: [
            "id",
            "name",
            "email",
            "countryId",
            "cityId",
            "companyName",
          ],
        });

        if (!userExists) {
          return res.status(ResponseCodes.BAD_REQUEST).json({
            status: ResponseCodes.BAD_REQUEST,
            data: "",
            message: i18n.__("USER_NOT_FOUND"),
            error: "",
          });
        }
      }

      // Base query with optional filters
      let selectQuery = `
            SELECT DISTINCT
                  u.id AS userId,
                  u.name AS userName,
                  u.email AS userEmail,
                  mc.name AS cityName,
                  mct.name AS countryName,
                  u.company_name,
                  u.created_at,
                  COUNT(ac.id) AS totalAccounts
            FROM 
                  "user" AS u
              LEFT JOIN 
                  master_city_trans AS mc 
                  ON u.city_id = mc.master_city_id
              LEFT JOIN 
                  master_country_trans AS mct 
                  ON u.country_id = mct.master_country_id
              LEFT JOIN 
                  account AS ac 
                  ON u.id = ac.user_id 
                where 1=1
            `;

      // // Query to count total users matching filters
      let countQuery = `
            SELECT
            COUNT(DISTINCT ac.id) AS totalRecords
            FROM
            "user" AS u
            LEFT JOIN
            account AS ac
            ON u.id = ac.user_id
            WHERE 1=1
            `;

      let whereConditionQuery = `
            AND u.is_deleted = false
            AND u.is_active = true
            `;

      let replacements = {};

      if (cityName) {
        selectQuery += ` 
        AND LOWER(mc.name) = LOWER(:cityName) 
        OR LOWER(mc.lang) LIKE LOWER(:lang )`;

        countQuery += ` AND LOWER(mc.name) = LOWER(:cityName) 
        OR LOWER(mc.lang) LIKE LOWER(:lang ) `;
        replacements.cityName = cityName;
        replacements.lang = lang;
      }
      // Apply country name filter
      if (countryName) {
        selectQuery += ` AND LOWER(mct.name) = LOWER(:countryName) OR LOWER(mct.lang) LIKE LOWER(:lang )`;
        countQuery += ` AND LOWER(mct.name) = LOWER(:countryName) OR LOWER(mct.lang) LIKE LOWER(:lang )`;
        replacements.countryName = countryName;
        replacements.lang = lang;
      }

      if (search) {
        selectQuery += ` AND LOWER(u.name) LIKE LOWER(:search) 
        OR LOWER(u.email) LIKE LOWER(:search)
        `;

        countQuery += ` AND LOWER(u.name) LIKE LOWER(:search)
        OR LOWER(u.email) LIKE LOWER(:search)
        `;
        replacements.search = `%${search}%`;
      }

      let orderByClause = `ORDER BY u.id DESC`;

      let groupByClause = `GROUP BY u.id, mc.name, mct.name`;
      let groupByClauseCount = `GROUP BY ac.id`;

      let limitOffsetClause = `LIMIT :limit OFFSET :offset;`;
      replacements.limit = limit;
      replacements.offset = offset;

      let query = `${selectQuery} ${whereConditionQuery}${groupByClause}  ${orderByClause} ${limitOffsetClause}`;

      let count = `${countQuery} ${whereConditionQuery}${groupByClauseCount}`;

      // // Execute queries
      const usersData = await sequelize.query(query, {
        replacements,
        type: Sequelize.QueryTypes.SELECT,
      });
      console.log("first");

      const totalCountResult = await sequelize.query(count, {
        replacements,
        type: Sequelize.QueryTypes.SELECT,
      });

      console.log("totalCountResult: ", totalCountResult);
      const totalRecords = parseInt(totalCountResult[0].totalrecords, 10);

      console.log("totalRecords: ", totalRecords);
      const totalPages = Math.ceil(totalRecords / limit);

      // Handle empty data scenario
      if (!usersData || usersData.length === 0) {
        return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({
          status: HTTP_STATUS_CODES.NOT_FOUND,
          message: "No users found.",
          data: [],
          pagination: {
            currentPage: page,
            totalPages,
            totalRecords,
          },
          error: null,
        });
      }

      return res.status(HTTP_STATUS_CODES.OK).json({
        status: HTTP_STATUS_CODES.OK,
        message: "Users retrieved successfully.",
        data: usersData,
        pagination: {
          currentPage: page,
          totalPages,
          totalRecords,
        },
        error: null,
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(HTTP_STATUS_CODES.SERVER_ERROR).json({
        status: HTTP_STATUS_CODES.SERVER_ERROR,
        message: "Internal server error.",
        data: null,
        error: error.message || "An unknown error occurred.",
      });
    }
  },
};

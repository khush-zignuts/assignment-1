const User = require("../../../models/User");
const i18n = require("../../../config/i18n");
const { HTTP_STATUS_CODES } = require("../../../config/constants");
const { VALIDATION_RULES } = require("../../../config/validationRules");
const VALIDATOR = require("validatorjs");
const { Sequelize, Op } = require("sequelize");
const sequelize = require("../../../../api/config/db");

const MasterCity = require("../../../models/MasterCity");
const MasterCountry = require("../../../models/MasterCountry");

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
      const { cityId, countryId, search } = req.query;

      //  pagination parameters
      const page = parseInt(req.query.page, 10) || 1; // Default to page 1
      const limit = parseInt(req.query.limit, 10) || 10; // Default to 10 records per page
      const offset = (page - 1) * limit;

      //VALIDATION
      const validation = new VALIDATOR(req.body, {
        cityId: VALIDATION_RULES.CITY.cityId,
        countryId: VALIDATION_RULES.COUNTRY.countryId,
        search: VALIDATION_RULES.USER.name,
      });

      if (validation.fails()) {
        return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          message: "Validation failed.",
          data: "",
          error: validation.errors.all(),
        });
      }

      // Check existence
      if (cityId) {
        const cityExists = await MasterCity.findOne(
          {
            where: { id: cityId, isDeleted: false, isActive: true },
          },
          (attributes = ["id"])
        );

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
      if (countryId) {
        const countryExists = await MasterCountry.findOne(
          {
            where: { id: countryId, isDeleted: false, isActive: true },
          },
          (attributes = ["id"])
        );
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
              // { email: { [Op.iLike]: `%${search}%` } },
            ],
          },
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
      const selectQuery = `
            SELECT 
                  u.id AS userId,
                  u.name AS userName,
                  u.email AS userEmail,
                  mc.name AS cityName,
                  mct.name AS countryName,
                  u.companyName,
                  COUNT(ac.id) AS totalAccounts
            FROM 
                user AS u
              LEFT JOIN 
                  master_city_trans AS mc 
                  ON u.city_id = mc.city_id
              LEFT JOIN 
                  master_country_trans AS mct 
                  ON u.country_id = mct.country_id
              LEFT JOIN 
                  account AS ac ON u.id = ac.user_id 
                  
            AND ac.is_deleted = false
            WHERE 1=1
            GROUP BY u.id, mc.name, mct.name
            
        `;

      let whereConditionQuery = `
      WHERE LOWER(name) = LOWER(:name)
      AND "isDeleted" = false
      AND "isActive" = true`;

      let replacements = {};

      if (cityId) {
        selectQuery += ` AND LOWER(u.city) = LOWER(:city)`;
        replacements.city = city;
      }

      if (countryId) {
        rawQuery += ` AND LOWER(u.country) = LOWER(:country)`;
        replacements.country = country;
      }

      if (search) {
        rawQuery += ` AND (LOWER(u.name) LIKE LOWER(:search))`;
        replacements.search = `%${search}%`;
      }

      const orderByClause = `ORDER BY "createdAt" DESC`;

      const limitOffsetClause = `LIMIT :limit OFFSET :offset;`;
      replacements.limit = limit;
      replacements.offset = offset;

      const query = `${selectQuery} ${whereConditionQuery} ${orderByClause} ${limitOffsetClause}`;

      // // Query to count total users matching filters
      // let countQuery = `
      //   SELECT
      //   COUNT(DISTINCT u.id) AS totalRecords
      //   FROM
      //   user AS u
      //   LEFT JOIN
      //   account AS ac
      //   ON u.id = ac.user_id
      //   AND ac.is_deleted = false
      //   WHERE 1=1
      //   `;

      // if (city) countQuery += ` AND LOWER(u.city) = LOWER(:city)`;
      // if (country) countQuery += ` AND LOWER(u.country) = LOWER(:country)`;
      // if (search)
      //   countQuery += ` AND (LOWER(u.name) LIKE LOWER(:search) OR LOWER(u.email) LIKE LOWER(:search))`;

      // console.log("first");
      // // Execute queries
      const usersData = await sequelize.query(rawQuery, {
        replacements,
        type: Sequelize.QueryTypes.SELECT,
      });

      // const totalCountResult = await sequelize.query(countQuery, {
      //   replacements,
      //   type: Sequelize.QueryTypes.SELECT,
      // });

      // const totalRecords = parseInt(totalCountResult[0].totalRecords, 10);
      // const totalPages = Math.ceil(totalRecords / limit);

      // // Handle empty data scenario
      // if (!usersData || usersData.length === 0) {
      //   return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({
      //     status: HTTP_STATUS_CODES.NOT_FOUND,
      //     message: "No users found.",
      //     data: [],
      //     pagination: {
      //       currentPage: page,
      //       totalPages,
      //       totalRecords,
      //     },
      //     error: null,
      //   });
      // }

      return res.status(HTTP_STATUS_CODES.OK).json({
        status: HTTP_STATUS_CODES.OK,
        message: "Users retrieved successfully.",
        data: usersData,
        pagination: {
          // currentPage: page,
          // totalPages,
          // totalRecords,
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

const Validator = require("validatorjs");
const i18n = require("../../../config/i18n");
const { HTTP_STATUS_CODES } = require("../../../config/constants");
const { VALIDATION_RULES } = require("../../../config/validationRules");
const { Sequelize, Op } = require("sequelize");
const sequelize = require("../../../config/db");
const { v4: uuidv4 } = require("uuid");
const {
  MasterCategory,
  MasterSubcategory,
  Account,
  AccountTrans,
} = require("../../../models");

const VALIDATOR = require("validatorjs");

module.exports = {
  addAccount: async (req, res) => {
    try {
      const userId = req.user.id;

      const { nameTranslation, categoryId, subcategoryId, description } =
        req.body;
      ``;

      const validation = new VALIDATOR(req.body, {
        userId: VALIDATION_RULES.ACCOUNT.userId,
        nameTranslation: VALIDATION_RULES.ACCOUNT.nameTranslation,
        categoryId: VALIDATION_RULES.ACCOUNT.categoryId,
        subcategoryId: VALIDATION_RULES.ACCOUNT.subcategoryId,
        description: VALIDATION_RULES.ACCOUNT.description,
      });

      if (validation.fails()) {
        return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          message: "Validation failed.",
          data: "",
          error: validation.errors.all(),
        });
      }

      //check first according to user id :
      for (let i = 0; i < nameTranslation.length; i++) {
        const query = `
      SELECT 
           ac.user_id AS userId,
           act.account_id AS accountId
          FROM account AS ac
          LEFT JOIN account_trans AS act ON ac.id = act.account_id
          WHERE ac.is_deleted = false
          AND ac.user_id = :userId
          AND LOWER(act.lang) = LOWER(:lang)
          AND LOWER(act.name) = LOWER(:name)
      `;
        const existingAccount = await sequelize.query(query, {
          replacements: {
            userId: userId,
            name: nameTranslation[i].name,
            lang: nameTranslation[i].lang,
          },
          type: sequelize.QueryTypes.SELECT,
          attributes: [
            "id",
            "userId",
            "name",
            "lang",
            "categoryId",
            "subcategoryId",
          ],
        });

        if (existingAccount.length > 0) {
          return res.status(HTTP_STATUS_CODES.CONFLICT).json({
            status: HTTP_STATUS_CODES.CONFLICT,
            message: `Account '${nameTranslation[i].name}' already exists in '${nameTranslation[i].lang}'`,
            data: "",
            error: "",
          });
        }
      }

      // Check if categoryId exists in MasterCategory
      const categoryExists = await MasterCategory.findOne({
        where: { id: categoryId, isDeleted: false },
      });

      if (!categoryExists) {
        return res.status(400).json({
          status: 400,
          message: "Invalid categoryId.",
          data: null,
          error: "Category not found.",
        });
      }

      // Check if subCategoryId exists in MasterSubcategory
      const subCategoryExists = await MasterSubcategory.findOne({
        where: { id: subcategoryId, isDeleted: false },
      });
      // console.log("subCategoryExists: ", subCategoryExists);

      if (!subCategoryExists) {
        return res.status(400).json({
          status: 400,
          message: "Invalid subCategoryId.",
          data: null,
          error: "Subcategory not found.",
        });
      }
      // // Generate UUID for MasterCategory
      const accountId = uuidv4();

      let accountTransData = [];
      for (let i = 0; i < nameTranslation.length; i++) {
        const { name, lang } = nameTranslation[i];

        accountTransData.push({
          accountId: accountId,
          name: nameTranslation[i].name,
          lang: nameTranslation[i].lang,
          createdAt: Math.floor(Date.now() / 1000),
          createdBy: userId,
        });
      }

      // // Create new account
      await Account.create({
        id: accountId,
        userId: userId,
        categoryId: categoryId,
        subCategoryId: subcategoryId,
        description,
        createdAt: Math.floor(Date.now() / 1000),
        createdBy: userId,
      });

      await AccountTrans.bulkCreate(accountTransData);

      return res.status(201).json({
        status: 201,
        message: "Account created  successfully.",
        data: { accountId },
        error: null,
      });
    } catch (error) {
      console.error("Error adding account:", error);
      return res.status(500).json({
        status: 500,
        message: "Internal server error.",
        data: null,
        error: error.message || "An unknown error occurred.",
      });
    }
  },

  updateAccount: async (req, res) => {
    try {
      const userId = req.user.id;
      const {
        accountId,
        nameTranslation,
        categoryId,
        subcategoryId,
        description,
      } = req.body;

      const validation = new VALIDATOR(req.body, {
        accountId: VALIDATION_RULES.ACCOUNT.accountId,
        nameTranslation: VALIDATION_RULES.ACCOUNT.nameTranslation,
        categoryId: VALIDATION_RULES.ACCOUNT.categoryId,
        subcategoryId: VALIDATION_RULES.ACCOUNT.subcategoryId,
        description: VALIDATION_RULES.ACCOUNT.description,
      });

      if (validation.fails()) {
        return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          message: "Validation failed.",
          data: "",
          error: validation.errors.all(),
        });
      }
      // Check if the account exists
      const existingAccount = await Account.findOne({
        where: { id: accountId, userId: userId, isDeleted: false },
        attributes: ["id"],
      });

      if (!existingAccount) {
        return res.status(404).json({
          status: 404,
          message: "Account not found or unauthorized.",
          data: null,
          error: "Account does not exist.",
        });
      }

      //check zccount by name and lang
      for (let i = 0; i < nameTranslation.length; i++) {
        const query = `
        SELECT 
        ac.user_id AS userId,
        act.account_id AS accountId
        FROM account AS ac
        LEFT JOIN account_trans AS act ON ac.id = act.account_id
        WHERE ac.is_deleted = false 
        AND ac.user_id = :userId
        AND LOWER(act.lang) = LOWER(:lang)
        AND LOWER(act.name) = LOWER(:name)
        `;
        const existingAccount = await sequelize.query(query, {
          replacements: {
            userId: userId,
            name: nameTranslation[i].name,
            lang: nameTranslation[i].lang,
          },
          type: sequelize.QueryTypes.SELECT,
          attributes: ["userId", "name", "lang", "categoryId", "subcategoryId"],
        });
        console.log("first");

        if (existingAccount.length > 0) {
          return res.status(HTTP_STATUS_CODES.CONFLICT).json({
            status: HTTP_STATUS_CODES.CONFLICT,
            message: `Account '${nameTranslation[i].name}' already exists in '${nameTranslation[i].lang}'`,
            data: "",
            error: "",
          });
        }
      }

      // Check if categoryId exists in MasterCategory
      const categoryExists = await MasterCategory.findOne({
        where: { id: categoryId, isDeleted: false },
      });

      if (!categoryExists) {
        return res.status(400).json({
          status: 400,
          message: "Invalid categoryId.",
          data: null,
          error: "Category not found.",
        });
      }

      // Check if subCategoryId exists in MasterSubcategory
      const subCategoryExists = await MasterSubcategory.findOne({
        where: { id: subcategoryId, isDeleted: false },
      });

      if (!subCategoryExists) {
        return res.status(400).json({
          status: 400,
          message: "Invalid subCategoryId.",
          data: null,
          error: "Subcategory not found.",
        });
      }

      //create bulkdata

      let accountTrans = [];
      for (let i = 0; i < nameTranslation.length; i++) {
        const { name, lang } = nameTranslation[i];

        accountTrans.push({
          id: uuidv4(),
          accountId: accountId,
          name: nameTranslation[i].name.toLowerCase(),
          lang: nameTranslation[i].lang.toLowerCase(),
          description,
          updatedAt: Math.floor(Date.now() / 1000),
          updatedBy: userId,
        });
      }

      // Update account details
      await Account.update(
        {
          updatedAt: Math.floor(Date.now() / 1000),
          updated_by: userId,
        },
        { where: { id: accountId, isDeleted: false } }
      );

      // delete data in account trans
      await AccountTrans.destroy({ where: { accountId: accountId } });

      await AccountTrans.bulkCreate(accountTrans);

      return res.status(200).json({
        status: 200,
        message: "Account updated  OKfully.",
        data: { accountId },
        error: null,
      });
    } catch (error) {
      console.error("Error updating account:", error);
      return res.status(500).json({
        status: 500,
        message: "Internal server error.",
        data: null,
        error: error.message || "An unknown error occurred.",
      });
    }
  },

  deleteAccount: async (req, res) => {
    try {
      const usersId = req.user.id;

      const { accountId } = req.params;

      const validation = new VALIDATOR(req.params, {
        accountId: VALIDATION_RULES.ACCOUNT.accountId,
      });

      if (validation.fails()) {
        return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          message: "Validation failed.",
          data: "",
          error: validation.errors.all(),
        });
      }
      // Check if the account exists and belongs to the user
      const account = await Account.findOne({
        where: { id: accountId, isDeleted: false },
        attributes: ["id"],
      });

      if (!account) {
        return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({
          status: HTTP_STATUS_CODES.NOT_FOUND,
          message: i18n.__("api.accounts.delete.notFound"),
          data: null,
          error: "Account not found or user not authorized.",
        });
      }

      // Perform soft delete
      await Account.update(
        {
          isDeleted: true,
          deletedAt: Math.floor(Date.now() / 1000),
          deletedBy: usersId,
        },
        { where: { id: accountId } }
      );

      await AccountTrans.update(
        {
          isDeleted: true,
          deletedAt: Math.floor(Date.now() / 1000),
          deletedBy: usersId,
        },
        { where: { accountId: accountId } }
      );

      return res.status(HTTP_STATUS_CODES.OK).json({
        status: HTTP_STATUS_CODES.OK,
        message: i18n.__("api.accounts.delete.OK"),
        data: { accountId },
        error: null,
      });
    } catch (error) {
      console.error("Error deleting account:", error);
      return res.status(HTTP_STATUS_CODES.SERVER_ERROR).json({
        status: HTTP_STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: null,
        error: error.message || "Internal server error.",
      });
    }
  },

  getAllAccounts: async (req, res) => {
    try {
      // Extract pagination parameters from the request
      const page = parseInt(req.query.page, 10) || 1; // Default to page 1
      const limit = parseInt(req.query.limit, 10) || 10; // Default to 10 records per page
      const offset = (page - 1) * limit;

      const rawQuery = `
        SELECT
          ac.id AS id ,
          ac.user_id AS userId,
          act.name AS accountName ,
          act.lang AS accountLang ,
          ac.category_id AS categoryId,
          ac.subcategory_id AS subcategoryId

            FROM  account AS ac
                    LEFT JOIN
                  account_trans AS act
                    ON
                  ac.id = act.account_id

            where ac.is_deleted = false
             ORDER BY ac.created_at
            LIMIT :limit OFFSET :offset;
        `;

      // SQL query to count total records
      const countQuery = `
      SELECT COUNT(id) AS totalRecords
      FROM account AS ac
      WHERE ac.is_deleted = false;
    `;

      /// Execute the raw queries
      const accountsData = await sequelize.query(rawQuery, {
        replacements: { limit, offset },
        type: Sequelize.QueryTypes.SELECT,
      });
      const totalCountResult = await sequelize.query(countQuery, {
        type: Sequelize.QueryTypes.SELECT,
      });

      const totalRecords = parseInt(totalCountResult[0].totalRecords, 10);
      const totalPages = Math.ceil(totalRecords / limit);

      //account data show

      // Handle empty data scenario
      if (!accountsData || accountsData.length === 0) {
        return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({
          status: HTTP_STATUS_CODES.NOT_FOUND,
          message: i18n.__("api.accounts.notFound") || "No accounts found",
          data: "",
          error: "",
        });
      }

      console.log("accountsData: ", accountsData);

      return res.status(HTTP_STATUS_CODES.OK).json({
        status: HTTP_STATUS_CODES.OK,
        message: i18n.__("api.accounts.found") || "Accounts retrieved  OKfully",
        data: accountsData,
        pagination: {
          currentPage: page,
          totalPages,
          totalRecords,
        },
        error: null,
      });
    } catch (error) {
      console.error("Error fetching accounts:", error);
      return res.status(HTTP_STATUS_CODES.SERVER_ERROR).json({
        status: HTTP_STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: null,
        error: error.message || "Internal server error.",
      });
    }
  },
};

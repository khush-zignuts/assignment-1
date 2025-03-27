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
} = require("../../../models");
const AccountTrans = require("../../../models/AccountTrans");

const validateRequest = (data, rules, res) => {
  const validation = new Validator(data, rules);
  if (validation.fails()) {
    res
      .status(HTTP_STATUS_CODES.BAD_REQUEST)
      .json({ message: validation.errors.all() });
    return false;
  }
  return true;
};
module.exports = {
  addAccount: async (req, res) => {
    try {
      if (!validateRequest(req.body, VALIDATION_RULES.ACCOUNT, res)) return;
      const { usersId, name, categoryId, subCategoryId, description } =
        req.body;

      // Validate presence of userId
      if (!usersId) {
        return res.json({
          status: 400,
          message: "User ID is required.",
          data: null,
          error: "Missing userId in request body.",
        });
      }

      // Validate name array
      if (!Array.isArray(name) || name.length === 0) {
        return res.json({
          status: 400,
          message: "Name array is required and cannot be empty.",
          data: null,
          error: "Invalid name format.",
        });
      }

      // // Validate each name entry
      for (const i of name) {
        if (!i.value || !i.lang) {
          return res.json({
            status: 400,
            message:
              "Each name entry must have both value and lang properties.",
            data: null,
            error: "Invalid name object format.",
          });
        }
      }

      // //   // Check if categoryId exists in MasterCategory
      const categoryExists = await MasterCategory.findByPk(categoryId);
      if (!categoryExists) {
        return res.status(400).json({
          status: 400,
          message: "Invalid categoryId.",
          data: null,
          error: "Category not found.",
        });
      }

      // // Check if subCategoryId exists in MasterSubcategory
      const subCategoryExists = await MasterSubcategory.findByPk(subCategoryId);
      if (!subCategoryExists) {
        return res.json({
          status: 400,
          message: "Invalid subCategoryId.",
          data: null,
          error: "Subcategory not found.",
        });
      }

      //check first according to user id :
      const existingAccount = await Account.findAll({
        where: { userId: usersId },
      });

      // Check if an account already exists for this user
      if (existingAccount.length > 0) {
        // Define `existingAccountTrans` before using it
        const existingAccountTrans = await AccountTrans.findAll({
          where: {
            id: existingAccount[0]?.id, // Use the first found account's userId
            name: {
              [Op.or]: name.map((s) => s.value),
            },
          },
          attributes: [
            "id",
            "userId",
            "name",
            "lang",
            "categoryId",
            "subcategoryId",
          ],
        });

        // If an account with the same name already exists, return an error
        if (existingAccountTrans.length > 0) {
          return res.status(409).json({
            message:
              "An account with the same name already exists for this user.",
          });
        }
      }

      // // Generate UUID for MasterCategory
      const account_id = uuidv4();
      console.log("Account_id: ", account_id);

      // // Create new account
      const newAccount = await Account.create({
        id: account_id,
        userId: usersId,
        categoryId: categoryId,
        subcategoryId: subCategoryId,
        description,
      });

      let accountTransData = [];
      for (let i = 0; i < name.length; i++) {
        const { value, lang } = name[i];

        accountTransData.push({
          Account_id: account_id,
          name: name[i].value,
          lang: name[i].lang,
        });
      }

      await AccountTrans.bulkCreate(accountTransData);

      return res.status(201).json({
        status: 201,
        message: "Account created  OKfully.",
        data: { account_id },
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
      const {
        accountId,
        usersId,
        name,
        categoryId,
        subCategoryId,
        description,
      } = req.body;

      // Validate presence of accountId
      if (!accountId) {
        return res.status(400).json({
          status: 400,
          message: "Account ID is required.",
          data: null,
          error: "Missing accountId in request.",
        });
      }

      // Validate presence of userId
      if (!usersId) {
        return res.status(400).json({
          status: 400,
          message: "User ID is required.",
          data: null,
          error: "Missing userId in request body.",
        });
      }

      // Validate name array
      if (!Array.isArray(name) || name.length === 0) {
        return res.status(400).json({
          status: 400,
          message: "Name array is required and cannot be empty.",
          data: null,
          error: "Invalid name format.",
        });
      }

      // Validate each name entry
      for (const i of name) {
        if (!i.value || !i.lang) {
          return res.status(400).json({
            message:
              "Each name entry must have both value and lang properties.",
          });
        }
      }

      // Check if the account exists
      const existingAccount = await Account.findOne({
        where: { id: accountId, userId: usersId, isDeleted: false },
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

      // Check if categoryId exists in MasterCategory
      const categoryExists = await MasterCategory.findByPk(categoryId);
      if (!categoryExists) {
        return res.status(400).json({
          status: 400,
          message: "Invalid categoryId.",
          data: null,
          error: "Category not found.",
        });
      }

      // Check if subCategoryId exists in MasterSubcategory
      const subCategoryExists = await MasterSubcategory.findByPk(subCategoryId);
      if (!subCategoryExists) {
        return res.status(400).json({
          status: 400,
          message: "Invalid subCategoryId.",
          data: null,
          error: "Subcategory not found.",
        });
      }

      // Update account details
      await Account.update(
        {
          categoryId,
          subcategoryId: subCategoryId,
          description,
          updatedAt: Math.floor(Date.now() / 1000),
          updated_by: req.body ? req.body.name : "System",
        },
        { where: { id: accountId } }
      );

      // Update account translations (delete existing and add new)
      await AccountTrans.destroy({ where: { Account_id: accountId } });

      const accountTransData = name.map((entry) => ({
        Account_id: accountId,
        name: entry.value,
        lang: entry.lang,
      }));

      await AccountTrans.bulkCreate(accountTransData);

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
      if (!validateRequest(req.body, VALIDATION_RULES.ACCOUNT, res)) return;
      const { accountId } = req.params;

      // Validate input
      if (!accountId) {
        return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          message: i18n.__("api.accounts.delete.missingFields"),
          data: null,
          error: "Missing accountId or usersId in request.",
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
        { isDeleted: true, deletedAt: Math.floor(Date.now() / 1000) },
        { where: { id: accountId } }
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
      if (!validateRequest(req.body, VALIDATION_RULES.ACCOUNT, res)) return;

      // Extract pagination parameters from the request
      const page = parseInt(req.query.page, 10) || 1; // Default to page 1
      const limit = parseInt(req.query.limit, 10) || 10; // Default to 10 records per page
      const offset = (page - 1) * pageSize;

      const rawQuery = `
      SELECT
        ac.id AS id ,
        ac."userId" AS "userId" ,
        act.name AS "accountName" ,
        act.lang AS "accountLang" ,
        ac."categoryId" AS "categoryId",
        ac."subcategoryId" AS "subcategoryId"

          FROM  accounts AS ac
                  JOIN
                account_trans AS act
                  ON
                ac.id = act."Account_id"

          where ac."isDeleted" = false
           ORDER BY ac.created_at

      `;

      // SQL query to count total records
      const countQuery = `
    SELECT COUNT(*) AS totalRecords
    FROM accounts AS ac
    WHERE ac."isDeleted" = false;
  `;

      // Execute the raw queries
      const [accountsData, totalCountResult] = await Promise.all([
        sequelize.query(rawQuery, {
          replacements: { limit: pageSize, offset },
          type: Sequelize.QueryTypes.SELECT,
        }),
        sequelize.query(countQuery, {
          type: Sequelize.QueryTypes.SELECT,
        }),
      ]);

      const totalRecords = parseInt(totalCountResult[0].totalRecords, 10);
      const totalPages = Math.ceil(totalRecords / pageSize);

      // Handle empty data scenario
      if (!accountsData || accountsData.length === 0) {
        return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({
          status: HTTP_STATUS_CODES.NOT_FOUND,
          message: i18n.__("api.accounts.notFound") || "No accounts found",
          data: [],
          pagination: {
            currentPage: page,
            totalPages,
            totalRecords,
          },
          error: null,
        });
      }

      console.log("accountsData: ", accountsData);

      const formattedData = accountsData.reduce((acc, row) => {
        let account = acc.find((c) => c.id === row.account_id);
        console.log("account: ", account);

        if (!account) {
          account = {
            id: row.account_id,
            userId: row.userId,
            name: [],
            category: row.categoryId,
            subcategories: row.subcategoryId,
          };
          console.log("account: ", account);
          acc.push(account);
        }

        if (row.accountName) {
          const existsAccName = account.name.some(
            (t) => t.lang === row.accountLang && t.value === row.accountName
          );
          if (!existsAccName) {
            account.name.push({
              value: row.accountName,
              lang: row.accountLang,
            });
          }
        }

        return acc;
      }, []);
      console.log("formattedData", formattedData);

      // Return all accounts
      // Return formatted accounts
      return res.status(HTTP_STATUS_CODES.OK).json({
        status: HTTP_STATUS_CODES.OK,
        message: i18n.__("api.accounts.found") || "Accounts retrieved  OKfully",
        data: formattedData,
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

const Validator = require("validatorjs");
const i18n = require("../../config/i18n");
const { STATUS_CODES, VALIDATION_RULES } = require("../../config/constant");
const { Sequelize, Op } = require("sequelize");
const sequelize = require("../../config/db");
const { v4: uuidv4 } = require("uuid");
const { MasterCategory, MasterSubcategory, Account } = require("../../models");
const AccountTrans = require("../../models/AccountTrans");

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
  addAccount: async (req, res) => {
    try {
      const { usersId, name, categoryId, subCategoryId, description } =
        req.body;
      // console.log("first:", {
      //   userId,
      //   name,
      //   categoryId,
      //   subCategoryId,
      //   description,
      // });
      // const user_id = userId;

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
      // console.log("categoryExists: ", categoryExists);

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
      // console.log("subCategoryExists: ", subCategoryExists);

      //check first according to user id :
      const existingAccount = await Account.findAll({
        where: { userId: usersId },
      });
      // console.log("userId: ", usersId);
      // console.log("existingAccount: ", existingAccount);
      // console.log("existingAccount User ID: ", existingAccount[0]?.userId);

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
        });

        // If an account with the same name already exists, return an error
        if (existingAccountTrans.length > 0) {
          return res.status(409).json({
            message:
              "An account with the same name already exists for this user.",
          });
        }
        console.log("existingAccount: ", existingAccountTrans);
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

      // console.log("newAccount:", newAccount);

      console.log("done code");

      // // Prepare data for bulk insert into AccountTrans

      // const accountTransData = name.map((entry) => ({
      //   account_id,
      //   value: entry.value,
      //   lang: entry.lang,
      // }));
      // // Prepare data for bulk insert

      console.log("name: ", name);
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
        message: "Account created successfully.",
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
      const { accountId } = req.params;
      const { usersId, name, categoryId, subCategoryId, description } =
        req.body;

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
        { categoryId, subcategoryId: subCategoryId, description },
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
        message: "Account updated successfully.",
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
      const { accountId } = req.params;
      const { usersId } = req.body; // Assuming user ID comes from authenticated request

      // Validate input
      // Validate input
      if (!accountId || !usersId) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
          status: STATUS_CODES.BAD_REQUEST,
          message: i18n.__("api.accounts.delete.missingFields"),
          data: null,
          error: "Missing accountId or usersId in request.",
        });
      }

      // Check if the account exists and belongs to the user
      const account = await Account.findOne({
        where: { id: accountId, userId: usersId, isDeleted: false },
      });

      if (!account) {
        return res.status(STATUS_CODES.NOT_FOUND).json({
          status: STATUS_CODES.NOT_FOUND,
          message: i18n.__("api.accounts.delete.notFound"),
          data: null,
          error: "Account not found or user not authorized.",
        });
      }

      // Perform soft delete
      await Account.update({ isDeleted: true }, { where: { id: accountId } });

      return res.status(STATUS_CODES.SUCCESS).json({
        status: STATUS_CODES.SUCCESS,
        message: i18n.__("api.accounts.delete.success"),
        data: { accountId },
        error: null,
      });
    } catch (error) {
      console.error("Error deleting account:", error);
      return res.status(STATUS_CODES.SERVER_ERROR).json({
        status: STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: null,
        error: error.message || "Internal server error.",
      });
    }
  },
  // getAccountById: async (req, res) => {
  //   try {
  //     const { accountId } = req.params;

  //     // Validate input
  //     if (!accountId) {
  //       return res.status(400).json({ message: "Account ID is required." });
  //     }

  //     // Fetch account details
  //     const account = await Account.findOne({
  //       where: { id: accountId },
  //       include: [
  //         {
  //           model: AccountTrans,
  //           as: "translations", // If you've defined an alias in associations
  //           attributes: ["id", "Account_id", "name", "lang"],
  //         },
  //       ],
  //     });

  //     // If no account found
  //     if (!account) {
  //       return res.status(404).json({ message: "Account not found." });
  //     }

  //     // Return account details
  //     return res.status(200).json({ account });
  //   } catch (error) {
  //     console.error("Error fetching account:", error);
  //     return res.status(500).json({ message: "Internal server error." });
  //   }
  // },

  getAllAccounts: async (req, res) => {
    try {
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

      // // Execute the raw query
      const accountsData = await sequelize.query(rawQuery, {
        type: Sequelize.QueryTypes.SELECT,
      });

      // Handle empty data scenario
      if (!accountsData || accountsData.length === 0) {
        return res.status(STATUS_CODES.NOT_FOUND).json({
          status: STATUS_CODES.NOT_FOUND,
          message: i18n.__("api.accounts.notFound") || "No accounts found",
          data: [],
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
        // if (row.categoryId) {
        //   const existscatid = account.name.some(
        //     (t) => t.lang === row.category_lang && t.value === row.category_name
        //   );
        //   if (!existsCatName) {
        //     category.name.push({
        //       value: row.category_name,
        //       lang: row.category_lang,
        //     });
        //   }
        // }

        return acc;
      }, []);
      console.log("formattedData", formattedData);

      // Return all accounts
      // Return formatted accounts
      return res.status(STATUS_CODES.SUCCESS).json({
        status: STATUS_CODES.SUCCESS,
        message:
          i18n.__("api.accounts.found") || "Accounts retrieved successfully",
        data: formattedData,
        error: null,
      });
    } catch (error) {
      console.error("Error fetching accounts:", error);
      return res.status(STATUS_CODES.SERVER_ERROR).json({
        status: STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: null,
        error: error.message || "Internal server error.",
      });
    }
  },
};

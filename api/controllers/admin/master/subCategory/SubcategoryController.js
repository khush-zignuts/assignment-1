const { Op } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
const i18n = require("../../../../config/i18n");
const sequelize = require("../../../../config/db");
const { HTTP_STATUS_CODES } = require("../../../../config/constants");
const { VALIDATION_RULES } = require("../../../../config/validationRules");
const {
  MasterSubcategoryTrans,
  MasterSubcategory,
} = require("../../../../models");
const VALIDATOR = require("validatorjs");

module.exports = {
  addSubcategory: async (req, res) => {
    try {
      const adminId = req.admin.id;
      console.log("adminId: ", adminId);

      let { subCategories } = req.body;
      console.log("subCategories: ", subCategories);

      const validation = new VALIDATOR(req.body, {
        subCategories: VALIDATION_RULES.SUBCATEGORY.subcategories,
      });

      if (validation.fails()) {
        return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          message: "Validation failed.",
          data: null,
          error: validation.errors.all(),
        });
      }

      for (let i = 0; i < subCategories.length; i++) {
        const query = `
        SELECT 
        mst.id AS id,
        ms.category_id AS categoryId

        FROM master_subcategory AS ms
        LEFT JOIN master_subcategory_trans AS mst

        On ms.id = mst.master_subcategory_id
        
        WHERE ms.is_deleted = false
        AND ms.category_id = :categoryId
        AND mst.lang = :lang
        AND LOWER(mst.name) = LOWER(:name);
        `;

        const existingsubCategory = await sequelize.query(query, {
          replacements: {
            categoryId: subCategories[i].categoryId,
            name: subCategories[i].name,
            lang: subCategories[i].lang,
          },
          type: sequelize.QueryTypes.SELECT,
        });

        // If a category exists, return a conflict response
        if (existingsubCategory.length > 0) {
          return res.status(HTTP_STATUS_CODES.CONFLICT).json({
            status: HTTP_STATUS_CODES.CONFLICT,
            message: `SubCategory '${subCategories[i].name}' already exists in '${subCategories[i].lang}'`,
            data: null,
            error: null,
          });
        }
      }

      // Generate UUID for Subcategory
      const masterSubcategoryId = uuidv4();

      // // Insert Translations Using `bulkCreate`
      let subCategory_trans = [];
      for (let i = 0; i < subCategories.length; i++) {
        subCategory_trans.push({
          masterSubcategoryId: masterSubcategoryId,
          name: subCategories[i].name,
          lang: subCategories[i].lang,
          createdAt: Math.floor(Date.now() / 1000),
          createdBy: adminId,
        });
      }
      // // Create master-Subcategory || cat_id put in master category table
      const subCategory = await MasterSubcategory.create({
        id: masterSubcategoryId,
        categoryId: subCategories[0].categoryId,
        createdAt: Math.floor(Date.now() / 1000),
        createdBy: adminId,
      });

      // Create master-category-trans
      await MasterSubcategoryTrans.bulkCreate(subCategory_trans);

      return res.status(HTTP_STATUS_CODES.CREATED).json({
        status: HTTP_STATUS_CODES.CREATED,
        message: i18n.__("api.subcategories.addsuccess"),
        data: { masterSubcategoryId },
        error: null,
      });
    } catch (error) {
      console.error("Error adding subcategory:", error);
      return res.status(HTTP_STATUS_CODES.SERVER_ERROR).json({
        status: HTTP_STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: null,
        error: error.message || "Internal server error",
      });
    }
  },

  updateSubcategory: async (req, res) => {
    try {
      const adminId = req.admin.id;
      let subcategories = req.body.data;

      // Validate request payload
      if (!Array.isArray(subcategories) || subcategories.length === 0) {
        return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          message: i18n.__("api.subcategories.invalidInput"),
          data: null,
          error: "Invalid input format or empty data",
        });
      }
      let updateData = [];

      for (let i = 0; i < subcategories.length; i++) {
        const { id, name, lang } = subcategories[i];

        if (!id || !name || !lang) {
          return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
            status: HTTP_STATUS_CODES.BAD_REQUEST,
            message: "ID, name, and language are required",
            data: null,
            error: "Missing required fields",
          });
        }
        updateData.push({ id, name: name.toLowerCase(), lang });
      }

      console.log("updateData: ", updateData);

      // Check if the subcategories exist
      const existingSubcategories = await MasterSubcategoryTrans.findAll({
        where: {
          isDeleted: false,
          id: { [Op.in]: updateData.map((c) => c.id) },
        },
        attributes: ["id", "master_subcategory_id", "name", "lang"],
      });

      if (!existingSubcategories || existingSubcategories.length === 0) {
        return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({
          status: HTTP_STATUS_CODES.NOT_FOUND,
          message: "Subcategory not found",
          data: null,
          error: "No matching subcategory found for the given IDs",
        });
      }

      // Check for duplicate subcategory names in the same language
      const duplicateSubcategory = await MasterSubcategoryTrans.findOne({
        where: {
          isDeleted: false,
          [Op.or]: updateData.map((c) => ({
            name: c.name,
            lang: c.lang,
          })),
          id: { [Op.notIn]: updateData.map((c) => c.id) }, // Ensure it's not checking itself
        },
        attributes: ["id"],
      });

      if (duplicateSubcategory) {
        return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          message:
            "A subcategory with the same name and language already exists",
          data: null,
          error: "Duplicate subcategory detected",
        });
      }

      // Perform the update
      for (let i = 0; i < updateData.length; i++) {
        const { id, name, lang } = updateData[i];

        await MasterSubcategoryTrans.update({ name, lang }, { where: { id } });
      }

      return res.status(HTTP_STATUS_CODES.OK).json({
        status: HTTP_STATUS_CODES.OK,
        message: i18n.__("api.subcategories.update OK"),
        data: updateData,
        error: null,
      });
    } catch (error) {
      console.error("Error updating subcategory:", error);
      return res.status(HTTP_STATUS_CODES.SERVER_ERROR).json({
        status: HTTP_STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: null,
        error: error.message || "Internal server error",
      });
    }
  },
  deleteSubcategory: async (req, res) => {
    try {
      const adminId = req.admin.id;
      const { subCategoryId } = req.params; // Extract subCategoryId from request params

      // Validate input
      if (!subCategoryId) {
        return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          message: "Subcategory ID is required",
          data: null,
          error: "Missing subcategory ID in request",
        });
      }

      // Find subcategory by ID
      const subcategory = await MasterSubcategoryTrans.findOne({
        where: { id: subCategoryId, isDeleted: false },
        attributes: ["id", "master_subcategory_id", "name", "lang"],
      });

      console.log("subcategory found: ", subcategory);

      if (!subcategory) {
        return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({
          status: HTTP_STATUS_CODES.NOT_FOUND,
          message: i18n.__("api.subcategories.notFound"),
          data: null,
          error: "Subcategory not found or already deleted",
        });
      }

      //   Check if the subcategory is assigned to any account
      const assignedAccount = await Account.findOne({
        where: { subcategoryId: subcategory.id },
        attributes: ["id"],
      });

      if (assignedAccount) {
        return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          message: i18n.__("api.subcategories.assignedToAccount"),
          data: null,
          error: "Cannot delete subcategory assigned to an account",
        });
      }

      // Soft delete the subcategory (recommended approach)
      await MasterSubcategoryTrans.update(
        { isDeleted: true, deletedAt: Math.floor(Date.now() / 1000) },
        { where: { id: subCategoryId } }
      );

      return res.status(HTTP_STATUS_CODES.OK).json({
        status: HTTP_STATUS_CODES.OK,
        message: i18n.__("api.subcategories.deleted"),
        data: { subCategoryId },
        error: null,
      });
    } catch (error) {
      console.error("Error deleting subcategory:", error);
      return res.status(HTTP_STATUS_CODES.SERVER_ERROR).json({
        status: HTTP_STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: null,
        error: error.message || "Internal server error",
      });
    }
  },
};

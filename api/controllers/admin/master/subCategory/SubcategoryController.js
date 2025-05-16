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
      let { categoryId, translation } = req.body;

      const validation = new VALIDATOR(req.body, {
        categoryId: VALIDATION_RULES.CATEGORY.masterCategoryId,
        translation: VALIDATION_RULES.SUBCATEGORY.translation,
      });

      if (validation.fails()) {
        return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          message: "Validation failed.",
          data: "",
          error: validation.errors.all(),
        });
      }

      console.log("categoryId: ", categoryId);
      for (let i = 0; i < translation.length; i++) {
        const query = `
        SELECT 
        mst.id AS id,
        ms.category_id

        FROM master_subcategory AS ms
        LEFT JOIN master_subcategory_trans AS mst

        On ms.id = mst.master_subcategory_id
        
        WHERE ms.is_deleted = false
        AND ms.category_id = :categoryId
        AND LOWER(mst.lang) = LOWER(:lang)
        AND LOWER(mst.name) = LOWER(:name);
        `;

        const existingsubCategory = await sequelize.query(query, {
          replacements: {
            categoryId: categoryId,
            name: translation[i].name,
            lang: translation[i].lang,
          },
          type: sequelize.QueryTypes.SELECT,
        });

        // If a category exists, return a conflict response
        if (existingsubCategory.length > 0) {
          return res.status(HTTP_STATUS_CODES.CONFLICT).json({
            status: HTTP_STATUS_CODES.CONFLICT,
            message: `SubCategory '${translation[i].name}' already exists in '${translation[i].lang}'`,
            data: "",
            error: "",
          });
        }
      }

      // Generate UUID for Subcategory
      const mastersubcategoryId = uuidv4();

      // // Insert Translations Using `bulkCreate`
      let subCategoryTrans = [];
      for (let i = 0; i < translation.length; i++) {
        subCategoryTrans.push({
          masterSubcategoryId: mastersubcategoryId,
          name: translation[i].name,
          lang: translation[i].lang,
          createdAt: Math.floor(Date.now() / 1000),
          createdBy: adminId,
        });
      }
      // // Create master-Subcategory || cat_id put in master category table
      const subCategory = await MasterSubcategory.create({
        id: mastersubcategoryId,
        categoryId: categoryId,
        createdAt: Math.floor(Date.now() / 1000),
        createdBy: adminId,
      });

      // Create master-category-trans
      await MasterSubcategoryTrans.bulkCreate(subCategoryTrans, {
        validate: true,
      });

      return res.status(HTTP_STATUS_CODES.CREATED).json({
        status: HTTP_STATUS_CODES.CREATED,
        message: i18n.__("api.subcategories.addsuccess"),
        data: { mastersubcategoryId },
        error: "",
      });
    } catch (error) {
      console.error("Error adding subcategory:", error);
      return res.status(HTTP_STATUS_CODES.SERVER_ERROR).json({
        status: HTTP_STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: "",
        error: error.message || "Internal server error",
      });
    }
  },

  updateSubcategory: async (req, res) => {
    try {
      const adminId = req.admin.id;
      const { masterSubcategoryId, translation } = req.body;

      const validation = new VALIDATOR(req.body, {
        masterSubcategoryId: VALIDATION_RULES.SUBCATEGORY.masterSubcategoryId,
        translation: VALIDATION_RULES.CATEGORY.translation,
      });

      if (validation.fails()) {
        return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          message: "Validation failed.",
          data: "",
          error: validation.errors.all(),
        });
      }

      // Find subcategory by ID
      const subcategory = await MasterSubcategory.findOne({
        where: { id: masterSubcategoryId, isDeleted: false },
        attributes: ["id"],
      });
      console.log("subcategory: ", subcategory);

      if (!subcategory) {
        return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({
          status: HTTP_STATUS_CODES.NOT_FOUND,
          message: i18n.__("api.subcategories.notFound"),
          data: "",
          error: "",
        });
      }

      // Check if a subcategory with the same name and lang already exists (excluding the current subcategory)
      for (let i = 0; i < translation.length; i++) {
        const duplicateSubcategory = await MasterSubcategoryTrans.findOne({
          where: {
            isDeleted: false,
            name: translation[i].name.toLowerCase(),
            lang: translation[i].lang.toLowerCase(),
            id: { [Op.ne]: masterSubcategoryId },
          },
          attributes: ["id"],
        });

        if (duplicateSubcategory) {
          return res.json({
            status: HTTP_STATUS_CODES.BAD_REQUEST,
            message:
              "A category with the same name and language already exists",
            data: "",
            error: "",
          });
        }

        const query = `
        SELECT id,
        master_subcategory_id
        FROM master_subcategory_trans
        WHERE master_subcategory_id = :masterSubcategoryId
        AND is_deleted = false
   
        `;

        const existingsubCategory = await sequelize.query(query, {
          replacements: {
            masterSubcategoryId: masterSubcategoryId,
          },
          type: sequelize.QueryTypes.SELECT, // Ensure SELECT query type
        });

        console.log("existingsubCategory: ", existingsubCategory);

        if (existingsubCategory.length > 0) {
          // Ensure there are records to delete
          const idsToDelete = existingsubCategory.map((subcat) => subcat.id);
          await MasterSubcategoryTrans.destroy({
            where: {
              id: idsToDelete,
              isDeleted: false,
            },
          });

          console.log(
            `Deleted subCategory for masterSubcategoryId: ${masterSubcategoryId}`
          );
        } 
      }
      let subcategoryTrans = [];
      for (let i = 0; i < translation.length; i++) {
        const { name, lang } = translation[i];

        subcategoryTrans.push({
          id: uuidv4(),
          masterSubcategoryId: masterSubcategoryId,
          name: translation[i].name.toLowerCase(),
          lang: translation[i].lang.toLowerCase(),
          updatedAt: Math.floor(Date.now() / 1000),
          updatedBy: adminId,
        });
      }
      // Create master-category || cat_id put in master category table

      await MasterSubcategory.update(
        {
          updatedAt: Math.floor(Date.now() / 1000),
          updatedBy: adminId,
        },
        { where: { id: masterSubcategoryId } }
      );

      await MasterSubcategoryTrans.bulkCreate(subcategoryTrans, {
        validate: true,
      });

      return res.status(HTTP_STATUS_CODES.OK).json({
        status: HTTP_STATUS_CODES.OK,
        message: i18n.__("api.subcategories.update OK"),
        data: masterSubcategoryId,
        error: "",
      });
    } catch (error) {
      console.error("Error updating subcategory:", error);
      return res.status(HTTP_STATUS_CODES.SERVER_ERROR).json({
        status: HTTP_STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: "",
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
          data: "",
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
          data: "",
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
          data: "",
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
        error: "",
      });
    } catch (error) {
      console.error("Error deleting subcategory:", error);
      return res.status(HTTP_STATUS_CODES.SERVER_ERROR).json({
        status: HTTP_STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: "",
        error: error.message || "Internal server error",
      });
    }
  },
};

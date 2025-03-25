const User = require("../../../../models/User");

const { Op } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
const i18n = require("../../../../config/i18n");
const { STATUS_CODES } = require("../../config/constant");
const {
  MasterCountryTrans,
  MasterCountry,
  MasterCity,
  MasterCityTrans,
} = require("../../../../models");

module.exports = {
  addSubcategory: async (req, res) => {
    // const { t } = req; // Get translation function
    try {
      let subCategories = req.body.data;
      console.log("subCategories: ", subCategories);

      if (!Array.isArray(subCategories) || subCategories.length === 0) {
        return res
          .status(STATUS_CODES.BAD_REQUEST)
          .json({ message: i18n.__("api.categories.invalidInput") });
      }

      let subCategoryData = [];

      for (let i = 0; i < subCategories.length; i++) {
        const { categoryId, name, lang } = subCategories[i];

        if (!name || !lang || !categoryId) {
          return res
            .status(STATUS_CODES.BAD_REQUEST)
            .json({ message: "Both name and lang are required" });
        }

        subCategoryData.push({ categoryId, name: name.toLowerCase(), lang });
      }

      // // Check for existing category
      const existingSubCategory = await MasterSubcategoryTrans.findOne({
        where: {
          name: {
            [Op.in]: subCategoryData.map((c) => c.name),
          },
        },
      });

      if (existingSubCategory) {
        return res.status(400).json({ message: "Category already exists" });
      }

      // Generate UUID for Subcategory
      const master_Subcategory_id = uuidv4();
      console.log("master_Subcategory_id: ", master_Subcategory_id);

      // // Create master-Subcategory || cat_id put in master category table
      const subCategory = await MasterSubcategory.create({
        id: master_Subcategory_id,
        categoryId: subCategoryData[0].categoryId,
      });

      console.log("subCategory: ", subCategory);

      // // Insert Translations Using `bulkCreate`
      let subCategory_trans = [];
      for (let i = 0; i < subCategoryData.length; i++) {
        subCategory_trans.push({
          master_subcategory_id: master_Subcategory_id,
          name: subCategoryData[i].name,
          lang: subCategoryData[i].lang,
        });
      }
      console.log("subCategory_trans: ", subCategory_trans);

      // // Create master-category-trans
      await MasterSubcategoryTrans.bulkCreate(subCategory_trans);

      return res.status(STATUS_CODES.CREATED).json({
        message: i18n.__("api.subcategories.addSuccess"),
        master_Subcategory_id,
      });
    } catch (error) {
      console.error(error);
      return res
        .status(STATUS_CODES.SERVER_ERROR)
        .json({ message: i18n.__("api.errors.serverError"), error });
    }
  },

  updateSubcategory: async (req, res) => {
    try {
      let subcategories = req.body.data;
      console.log("Subcategories to update:", subcategories);

      // Validate request payload
      if (!Array.isArray(subcategories) || subcategories.length === 0) {
        return res
          .status(STATUS_CODES.BAD_REQUEST)
          .json({ message: i18n.__("api.subcategories.invalidInput") });
      }

      let updateData = [];

      for (let i = 0; i < subcategories.length; i++) {
        const { id, name, lang } = subcategories[i];

        if (!id || !name || !lang) {
          return res
            .status(STATUS_CODES.BAD_REQUEST)
            .json({ message: "ID, name, and lang are required" });
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
      });

      if (!existingSubcategories || existingSubcategories.length === 0) {
        return res
          .status(STATUS_CODES.NOT_FOUND)
          .json({ message: "Subcategory not found" });
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
      });

      if (duplicateSubcategory) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
          message:
            "A subcategory with the same name and language already exists",
        });
      }

      // Perform the update
      for (let i = 0; i < updateData.length; i++) {
        const { id, name, lang } = updateData[i];

        await MasterSubcategoryTrans.update({ name, lang }, { where: { id } });
      }

      return res.status(STATUS_CODES.SUCCESS).json({
        message: i18n.__("api.subcategories.updateSuccess"),
      });
    } catch (error) {
      console.error("Error updating subcategory:", error);
      return res
        .status(STATUS_CODES.SERVER_ERROR)
        .json({ message: i18n.__("api.errors.serverError"), error });
    }
  },
  deleteSubcategory: async (req, res) => {
    try {
      const { subCategoryId } = req.params; // Extract subCategoryId from request params
      console.log("Deleting subcategory:", subCategoryId);

      // Validate input
      if (!subCategoryId) {
        return res
          .status(STATUS_CODES.BAD_REQUEST)
          .json({ message: "Subcategory ID is required" });
      }

      // Find subcategory by ID
      const subcategory = await MasterSubcategoryTrans.findOne({
        where: { id: subCategoryId, isDeleted: false },
      });

      console.log("subcategory found: ", subcategory);

      if (!subcategory) {
        return res
          .status(STATUS_CODES.NOT_FOUND)
          .json({ message: i18n.__("api.subcategories.notFound") });
      }

      //   Check if the subcategory is assigned to any account
      const assignedAccounts = await Account.findOne({
        where: { subcategoryId: subcategory.id },
      });

      if (assignedAccounts) {
        return res
          .status(STATUS_CODES.BAD_REQUEST)
          .json({ message: i18n.__("api.subcategories.assignedToAccount") });
      }

      // Soft delete the subcategory (recommended approach)
      await MasterSubcategoryTrans.update(
        { isDeleted: true },
        { where: { id: subCategoryId } }
      );

      return res
        .status(STATUS_CODES.SUCCESS)
        .json({ message: i18n.__("api.subcategories.deleted") });
    } catch (error) {
      console.error("Error deleting subcategory:", error);
      return res
        .status(STATUS_CODES.SERVER_ERROR)
        .json({ message: i18n.__("api.errors.serverError"), error });
    }
  },
};

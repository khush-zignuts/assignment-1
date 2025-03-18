const User = require("../../models/User");

const {
  MasterCategoryTrans,
  MasterCategory,
  MasterSubcategoryTrans,
  MasterSubcategory,
} = require("../../models");
const { Op } = require("sequelize");
const { v4: uuidv4 } = require("uuid");

module.exports = {
  addCategory: async (req, res) => {
    const { t } = req; // Get translation function
    try {
      let categories = req.body;
      console.log("categories: ", categories);

      if (!Array.isArray(categories) || categories.length === 0) {
        return res
          .status(400)
          .json({ message: t("api.categories.invalidInput") });
      }

      // // Prepare data for bulk insert
      let categoryData = [];

      for (let i = 0; i < categories.length; i++) {
        const { name, lang } = categories[i];

        if (!name || !lang) {
          return res
            .status(400)
            .json({ message: "Both name and lang are required" });
        }

        categoryData.push({ name: name.toLowerCase(), lang });
      }

      // Check for existing category
      const existingCategory = await MasterCategoryTrans.findOne({
        where: {
          name: {
            [Op.in]: categoryData.map((c) => c.name),
          },
        },
      });

      if (existingCategory) {
        return res.status(400).json({ message: "Category already exists" });
      }

      // Generate UUID for MasterCategory
      const master_category_id = uuidv4();
      console.log("master_category_id: ", master_category_id);

      // Create master-category || cat_id put in master category table
      const category = await MasterCategory.create({
        id: master_category_id,
      });

      // Insert Translations Using `bulkCreate`
      let category_trans = [];
      for (let i = 0; i < categoryData.length; i++) {
        category_trans.push({
          master_category_id,
          name: categoryData[i].name,
          lang: categoryData[i].lang,
        });
      }

      // Create master-category-trans
      await MasterCategoryTrans.bulkCreate(category_trans);

      return res.status(201).json({
        message: t("api.categories.addSuccess"),
        // status,
        master_category_id,
        // data,
        // error,
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: t("api.errors.serverError"), error });
    }
  },
  addSubcategory: async (req, res) => {
    const { t } = req; // Get translation function
    try {
      let subCategories = req.body;
      console.log("subCategories: ", subCategories);

      if (!Array.isArray(subCategories) || subCategories.length === 0) {
        return res
          .status(400)
          .json({ message: t("api.categories.invalidInput") });
      }

      let subCategoryData = [];

      for (let i = 0; i < subCategories.length; i++) {
        const { categoryId, name, lang } = subCategories[i];

        if (!name || !lang || !categoryId) {
          return res
            .status(400)
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

      return res.status(201).json({
        message: t("api.subcategories.addSuccess"),
        master_Subcategory_id,
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: t("api.errors.serverError"), error });
    }
  },
  deleteCategory: async (req, res) => {
    const { t } = req; // Get translation function from middleware
    try {
      const { categoryName } = req.body;
      console.log("req.body: ", req.body);

      // // Find category by name (case-insensitive)
      const category = await MasterCategoryTrans.findOne({
        where: { name: categoryName },
      });
      console.log("category: ", category);

      if (!category) {
        return res.status(404).json({ message: t("api.categories.notFound") });
      }

      // // Check if category is assigned to any account
      // const assignedAccounts = await Account.findOne({
      //   where: { categoryId: category.id },
      // });

      // if (assignedAccounts) {
      //   return res
      //     .status(400)
      //     .json({ message: t("api.categories.assignedToAccount") });
      // }

      // //  Check if subcategories are assigned to any account
      // const subcategories = await Subcategory.findAll({
      //   where: { categoryId: category.id },
      // });

      // const subcategoryIds = subcategories.map((sub) => sub.id);

      // const assignedSubcategoryAccounts = await Account.findOne({
      //   where: { subcategoryId: { [Op.in]: subcategoryIds } },
      // });

      // if (assignedSubcategoryAccounts) {
      //   return res
      //     .status(400)
      //     .json({ message: t("api.subcategories.assignedToAccount") });
      // }

      // // Delete all subcategories linked to this category
      // await Subcategory.destroy({ where: { categoryId: category.id } });

      // // Delete the category
      // await Category.destroy({ where: { id: category.id } });

      return res.status(200).json({ message: t("api.categories.deleted") });
    } catch (error) {
      console.error("Error deleting category:", error);
      return res
        .status(500)
        .json({ message: t("api.errors.serverError"), error });
    }
  },

  searchCategory: async (req, res) => {
    const { t } = req; // Get translation function from middleware
    try {
      const { categoryname } = req.body;
      console.log("categoryName: ", categoryname);

      if (!categoryname) {
        return res
          .status(400)
          .json({ message: t("api.categories.invalidInput") });
      }

      const category = await MasterCategoryTrans.findOne({
        where: { name: categoryname },
      });

      if (!category) {
        return res.status(404).json({ message: t("api.categories.notFound") });
      }
      console.log("category: ", category);

      const subCategories = await MasterSubcategory.findAll({
        where: { categoryId: category.master_category_id },
      });

      return res
        .status(200)
        .json({
          message: t("api.auth.search.success"),
          category,
          subCategories,
        });
    } catch (error) {
      console.error("Error searching category:", error);
      return res
        .status(500)
        .json({ message: t("api.errors.serverError"), error });
    }
  },
};

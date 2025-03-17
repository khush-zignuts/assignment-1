const User = require("../../models/User");

const {
  Category,
  Subcategory,
  MasterCategoryTrans,
  MasterCategory,
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
      let categoryData = [] ;

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
        // category_trans,
        master_category_id,
        // category_trans.id ,
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
      let { categoryId, name_en, name_de } = req.body;
      console.log("req.body: ", req.body);

      if (!categoryId || !name_en || !name_de) {
        return res
          .status(400)
          .json({ message: t("api.subcategories.allFieldsRequired") });
      }

      // Check if category exists
      const category = await Category.findOne({ where: { id: categoryId } });
      if (!category) {
        return res.status(404).json({ message: t("api.categories.notFound") });
      }

      // Check for uniqueness
      const existingSubcategory = await Subcategory.findOne({
        where: { name_en: name_en.toLowerCase(), categoryId },
      });
      if (existingSubcategory) {
        return res
          .status(400)
          .json({ message: t("api.subcategories.alreadyExists") });
      }

      // // Create Subcategory
      const subcategory = await Subcategory.create({
        categoryId,
        name_en: name_en.toLowerCase(),
        name_de: name_de.toLowerCase(),
      });
      return res
        .status(201)
        .json({ message: t("api.subcategories.addSuccess"), Subcategory });
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

      // Find category by name (case-insensitive)
      const category = await Category.findOne({
        // where: { name: categoryName },
        where: {
          [Op.or]: [{ name_en: categoryName }, { name_de: categoryName }],
        },
      });

      if (!category) {
        return res.status(404).json({ message: t("api.categories.notFound") });
      }
      // else{
      //   return res.status(200).json({ message: "category che"});
      // }

      // // Delete all subcategories linked to this category
      await Subcategory.destroy({ where: { categoryId: category.id } });
      // .then(
      //   res.status(200).json({ message: "category dlt"})
      // );

      // // Delete the category
      await Category.destroy({ where: { id: category.id } });

      return res.status(200).json({ message: t("api.categories.deleted") });
    } catch (error) {
      console.error("Error deleting category:", error);
      return res
        .status(500)
        .json({ message: t("api.errors.serverError"), error });
    }
  },
};

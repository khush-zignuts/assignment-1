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
      //sir changes
      let categories = req.body.data;
      console.log("categories: ", categories);

      if (!Array.isArray(categories) || categories.length === 0) {
        return res
          .status(400)
          .json({ message: t("api.categories.invalidInput") });
      }

      let categoryData = [];
      for (let i = 0; i < categories.length; i++) {
        const { name, lang } = categories[i];
        if (!name || !lang) {
          return res
            .status(400)
            .json({ message: "Both name and lang are required" });
        }
        // Push each valid translation into our categoryData array
        categoryData.push({ name, lang });
      }
      console.log("categoryData: ", categoryData);
      /* 
      //database stored
      // [{lang:'en', name: 'xyz'}, {lang: 'ar', name: 'abc'}]
      // [{lang:'en', name: 'abc', isDeleted: true}, {lang: 'ar', name: 'arabaic',  isDeleted: true}]
      
      
      categoryData= [
        { name : abc , lang : en}
        { name : arabaic  ,lang : ar}]
        
        name: {
          [Op.in]: [abc, arabic],
          },
          
          //body paylod
          [{lang:'en', name: 'abc'}, {lang: 'ar', name: 'arabaic'}]
          */

      //  Check for existing category
      const existingCategory = await MasterCategoryTrans.findAll({
        where: {
          isDeleted: false,
          [Op.or]: categoryData.map((c) => ({
            name: c.name,
            lang: c.lang,
          })),
        },
      });

      if (existingCategory && existingCategory.length > 0) {
        return res.status(400).json({ message: "Category already exists" });
      }

      // Generate UUID for MasterCategory
      const master_category_id = uuidv4();
      console.log("master_category_id: ", master_category_id);

      // Create master-category || cat_id put in master category table
      const category = await MasterCategory.create({
        id: master_category_id,
      });

      console.log("category: ", category);

      // // Prepare data for bulk insert
      let category_trans = [];
      for (let i = 0; i < categoryData.length; i++) {
        const { name, lang } = categoryData[i];

        category_trans.push({
          master_category_id,
          name: categoryData[i].name,
          lang: categoryData[i].lang,
        });
      }
      console.log("category_trans😇 :", category_trans);
      //   // Create master-category-trans
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

  listingCategory: async (req, res) => {
    const { t } = req; // Get translation function from middleware
    try {
      // const { categoryname } = req.query;
      // console.log("categoryName: ", categoryname);

      // Get search parameter (if provided) and language from headers
      const search = req.query.q || "";
      console.log('search: ', search);

      // const categoryname = req.query.categoryname || "";
      // console.log("categoryname: ", categoryname);

      const lang = req.headers.lang ? req.headers.lang : "en";
      console.log("lang: ", lang);

      // //initialize localization
      // req.setLocale(lang);
      // if (req.i18n && req.i18n.changeLanguage) {
      //   req.i18n.changeLanguage(lang);
      // }

      // let { page, size } = req.query;

      // // // Convert query params to numbers and set defaults
      // page = Number(page) || 1; // Default to page 1
      // size = Number(size) || 10; // Default page size 10

      // // // Calculate offset
      // const offset = (page - 1) * size;
      // const limit = size;

      // // // Query MasterCategoryTrans using search on name and filtering by language and isDeleted flag
      const categoriesData = await MasterCategoryTrans.findAndCountAll({
        where: {
          isDeleted: false,
          lang,
          // Use iLike for case-insensitive search on category name
          name: {
            [Op.iLike]: `%${search}%`,
          },
        },
        include: [
          {
            model: MasterSubcategoryTrans,
            as: "subcategories", // Make sure your association alias is "subcategories"
            where: {
              isDeleted: false,
              lang,
            },
            required: false, // This allows categories with no subcategories to be included
            attributes: ["id", "name", "isActive"],
          },
        ],
        attributes: ["id", "name", "isActive"],
        // limit,
        // offset,
        order: [["created_at", "DESC"]],
      });

      console.log("categoriesData: ", categoriesData);
      if (!categoriesData || categoriesData.count === 0) {
        return res.status(404).json({
          message: t("api.categories.notFound") || "No categories found",
        });
      }

      // // Format the result as desired
      // const data = categoriesData.rows.map(category => ({
      //   id: category.id,
      //   name: category.name,
      //   isActive: category.isActive,
      //   subcategory: category.subcategories.map(sub => ({
      //     id: sub.id,
      //     name: sub.name,
      //     isActive: sub.isActive,
      //   })),
      // }));
      // return res.status(200).json({
      //   message: t("api.categories.listSuccess") || "Categories listed successfully",
      //   data,
      //   totalCategories: categoriesData.count,
      //   totalPages: Math.ceil(categoriesData.count / size),
      //   currentPage: page,
      // });

      // if (!categoryname) {
      //   return res
      //     .status(400)
      //     .json({ message: t("api.categories.invalidInput") });
      // }

      // const category = await MasterCategoryTrans.findOne({
      //   where: { name: categoryname , lang},
      // });

      // if (!category) {
      //   return res.status(404).json({ message: t("api.categories.notFound") });
      // }
      // console.log("category: ", category);

      // const subCategories = await MasterSubcategoryTrans.findAll({
      //   where: { categoryId: category.id ,lang },
      // });

      // // Fetching details of all the players participated in the auction
      // const categoriesData = await MasterCategoryTrans.findAndCountAll({
      //   include: {
      //     model: MasterSubcategoryTrans,
      //     where: { id: category.master_category_id, isDeleted: false },
      //     attributes: ["id", "name", "description"],
      //   },
      //   attributes: ["id", "name", "description"],
      //   limit,
      //   offset,
      // });

      // // If no categories are found, return a not-found response
      // if (!categoriesData || categoriesData.count === 0) {
      //   return res.status(404).json({ message: "No categories found" });
      // }
      // const data = {
      //   totalCategories: categoriesData.count,
      //   totalPages: Math.ceil(categoriesData.count / size),
      //   currentPage: page,
      //   categories: categoriesData.rows,
      // };
      // return res.status(200).json({
      //   message: t("api.auth.search.success"),
      //   // category,
      //   // subCategories,
      //   categoriesData,
      // });
    } catch (error) {
      console.error("Error searching category:", error);
      return res
        .status(500)
        .json({ message: t("api.errors.serverError"), error });
    }
  },

  listingCategorys: async (req, res) => {
    const { t } = req; // Get translation function from middleware
    try {
         const { categoryname } = req.query;
        console.log("categoryName: ", categoryname);

        const lang = req.headers.lang ? req.headers.lang : "en";
        console.log("lang: ", lang);

        const category = await MasterCategoryTrans.findOne({
            where: { name: categoryname },
          });
    
          if (!category) {
            return res.status(404).json({ message: t("api.categories.notFound") });
          }
          console.log("category: ", category);
    
      //     const subCategories = await MasterSubcategoryTrans.findAll({
      //   where: { categoryId: category.id ,lang },
      // });

      // console.log("subCategories: ", subCategories);



    } catch (error) {
      console.error("Error searching category:", error);
      return res
        .status(500)
        .json({ message: t("api.errors.serverError"), error });
    }
  },
};

/*
data: [{
  id: '1',
  "name": "first",
  "isActive": ,
  subcategory: [{
    id: 'sub1',
    name: '',
    isActive: ,
  }, {}]
}, {
  id: '2',
  "name": "second",
  "isActive": ,
  suncategory: []
}]
*/

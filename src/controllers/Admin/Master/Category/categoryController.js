const User = require("../../models/User");
const i18n = require("../../config/i18n");

const {
  MasterCategoryTrans,
  MasterCategory,
  MasterSubcategoryTrans,
  MasterSubcategory,
} = require("../../models");
const { Sequelize, Op } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
const sequelize = require("../../config/db");
const { STATUS_CODES } = require("../../config/constants");

module.exports = {
  addCategory: async (req, res) => {
    // const { t } = req; // Get translation function
    try {
      //sir changes
      let categories = req.body.data;
      console.log("categories: ", categories);

      if (!Array.isArray(categories) || categories.length === 0) {
        return res
          .status(STATUS_CODES.BAD_REQUEST)
          .json({ message: i18n.__("api.categories.invalidInput") });
      }

      let categoryData = [];
      for (let i = 0; i < categories.length; i++) {
        const { name, lang } = categories[i];
        if (!name || !lang) {
          return res
            .status(STATUS_CODES.BAD_REQUEST)
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
        return res
          .status(STATUS_CODES.BAD_REQUEST)
          .json({ message: "Category already exists" });
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

      return res.status(STATUS_CODES.CREATED).json({
        message: i18n.__("api.categories.addSuccess"),
        // status,
        master_category_id,
        // data,
        // error,
      });
    } catch (error) {
      console.error(error);
      return res
        .status(STATUS_CODES.SERVER_ERROR)
        .json({ message: i18n.__("api.errors.serverError"), error });
    }
  },

  // updateCategory: async (req, res) => {
  //   try {
  //     let categories = req.body.data;
  //     console.log("categories to update:", categories);

  //     // Validate request payload
  //     if (!Array.isArray(categories) || categories.length === 0) {
  //       return res
  //         .status(STATUS_CODES.BAD_REQUEST)
  //         .json({ message: i18n.__("api.categories.invalidInput") });
  //     }

  //     let updateData = [];
  //     for (let i = 0; i < categories.length; i++) {
  //       const { id, name, lang } = categories[i];

  //       if (!id || !name || !lang) {
  //         return res
  //           .status(STATUS_CODES.BAD_REQUEST)
  //           .json({ message: "ID, name, and lang are required" });
  //       }

  //       updateData.push({ id, name, lang });
  //     }

  //     console.log("updateData: ", updateData);

  //     // Check if the category exists
  //     const existingCategories = await MasterCategoryTrans.findAll({
  //       where: {
  //         isDeleted: false,
  //         id: { [Op.in]: updateData.map((c) => c.id) },
  //       },
  //     });

  //     if (!existingCategories || existingCategories.length === 0) {
  //       return res
  //         .status(STATUS_CODES.NOT_FOUND)
  //         .json({ message: "Category not found" });
  //     }

  //     // Check if any of the new names already exist in other categories
  //     const duplicateCategory = await MasterCategoryTrans.findOne({
  //       where: {
  //         isDeleted: false,
  //         [Op.or]: updateData.map((c) => ({
  //           name: c.name,
  //           lang: c.lang,
  //         })),
  //         id: { [Op.notIn]: updateData.map((c) => c.id) }, // Ensure we're not checking against itself
  //       },
  //     });

  //     if (duplicateCategory) {
  //       return res
  //         .status(STATUS_CODES.BAD_REQUEST)
  //         .json({ message: "A category with the same name and language already exists" });
  //     }

  //     // Perform the update
  //     for (let i = 0; i < updateData.length; i++) {
  //       const { id, name, lang } = updateData[i];

  //       await MasterCategoryTrans.update(
  //         { name, lang },
  //         { where: { id } }
  //       );
  //     }

  //     return res.status(STATUS_CODES.SUCCESS).json({
  //       message: i18n.__("api.categories.updateSuccess"),
  //     });

  //   } catch (error) {
  //     console.error("Error updating category:", error);
  //     return res
  //       .status(STATUS_CODES.SERVER_ERROR)
  //       .json({ message: i18n.__("api.errors.serverError"), error });
  //   }
  // }
  // ,
  updateCategory: async (req, res) => {
    try {
      const { categoryId } = req.params; // Extract categoryId from request params
      const { name, lang } = req.body;
      console.log("Updating category:", { categoryId, name, lang });

      // Validate input
      if (!categoryId || !name || !lang) {
        return res
          .status(STATUS_CODES.BAD_REQUEST)
          .json({ message: "Category ID, name, and language are required" });
      }

      // Find category by ID
      const category = await MasterCategoryTrans.findOne({
        where: { id: categoryId, isDeleted: false },
      });

      console.log("category found: ", category);

      if (!category) {
        return res
          .status(STATUS_CODES.NOT_FOUND)
          .json({ message: i18n.__("api.categories.notFound") });
      }

      // Check if a category with the same name and lang already exists (excluding the current category)
      const duplicateCategory = await MasterCategoryTrans.findOne({
        where: {
          isDeleted: false,
          name: name.toLowerCase(),
          lang,
          id: { [Op.ne]: categoryId }, // Exclude the current category from check
        },
      });

      if (duplicateCategory) {
        return res
          .status(STATUS_CODES.BAD_REQUEST)
          .json({
            message:
              "A category with the same name and language already exists",
          });
      }

      // Update the category
      await MasterCategoryTrans.update(
        { name: name.toLowerCase(), lang },
        { where: { id: categoryId } }
      );

      return res.status(STATUS_CODES.SUCCESS).json({
        message: i18n.__("api.categories.updateSuccess"),
      });
    } catch (error) {
      console.error("Error updating category:", error);
      return res
        .status(STATUS_CODES.SERVER_ERROR)
        .json({ message: i18n.__("api.errors.serverError"), error });
    }
  },
  deleteCategory: async (req, res) => {
    try {
      const { categoryId } = req.params; // Extract categoryId from request params
      console.log("Deleting category:", categoryId);

      // Validate input
      if (!categoryId) {
        return res
          .status(STATUS_CODES.BAD_REQUEST)
          .json({ message: "Category ID is required" });
      }

      // Find category by ID
      const category = await MasterCategory.findOne({
        where: { id: categoryId, isDeleted: false },
      });

      console.log("category found: ", category);

      if (!category) {
        return res
          .status(STATUS_CODES.NOT_FOUND)
          .json({ message: i18n.__("api.categories.notFound") });
      }

      // Check if subcategories exist under this category
      const subcategories = await MasterSubcategory.findAll({
        where: { categoryId, isDeleted: false },
      });

      if (subcategories.length > 0) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
          message:
            "Cannot delete category because subcategories exist under it.",
        });
      }

      // Soft delete the category (recommended approach)
      await MasterCategory.update(
        { isDeleted: true },
        { where: { id: categoryId } }
      );

      return res
        .status(STATUS_CODES.SUCCESS)
        .json({ message: i18n.__("api.categories.deleted") });
    } catch (error) {
      console.error("Error deleting category:", error);
      return res
        .status(STATUS_CODES.SERVER_ERROR)
        .json({ message: i18n.__("api.errors.serverError"), error });
    }
  },
  //   // const { t } = req; // Get translation function from middleware
  //   try {
  //     const lang = i18n.getLocale() || "en";
  //     console.log("lang: ", lang);

  //     // Get search parameter (if provided) and language from headers
  //     const search = req.query.q || "";
  //     console.log("search: ", search);

  //     console.log("Search Query:", `%${search}%`);

  //     // Get language from headers, but do not force filtering if not specified
  //     // If lang is provided, use it as a filter; otherwise, return all translations.
  //     // const lang = req.headers.lang;
  //     // console.log("lang: ", lang);

  //     // Change language using i18next (if available)
  //     // if (req.i18n && req.i18n.changeLanguage) {
  //     //   req.i18n.changeLanguage(lang || "en");
  //     // }

  //     // Build language filter object only if lang is specified
  //     // const langFilter = lang ? { lang } : {};

  //     //pagination
  //     // let { page, size } = req.query;

  //     // // // Convert query params to numbers and set defaults
  //     // page = Number(page) || 1; // Default to page 1
  //     // size = Number(size) || 10; // Default page size 10

  //     // // // Calculate offset
  //     // const offset = (page - 1) * size;
  //     // const limit = size;

  //     // const categoriesData = await MasterCategory.findAll({
  //     //   where: { isDeleted: false }, // Only active categories
  //     //   include: [
  //     //     {
  //     //       model: MasterCategoryTrans,
  //     //       // as: "translations", // Ensure this alias matches your association
  //     //       where: {

  //     //         name: { [Op.iLike]: `%${search}%` }, // Case-insensitive search
  //     //       },
  //     //       attributes: ["id", "name","lang"],
  //     //     },
  //     //     {
  //     //       model: MasterSubcategory,
  //     //       as: "subcategories",
  //     //       where: { isDeleted: false },
  //     //       required: false, // Include categories even if they don't have subcategories
  //     //       attributes: ["id", "categoryId"],

  //     //       include: [
  //     //         {
  //     //           model: MasterSubcategoryTrans,
  //     //           // as: "translations",
  //     //           // where: { lang },
  //     //           required: false, // Include even if no translation found
  //     //           attributes: ["id", "name", "isActive"],
  //     //         },
  //     //       ],
  //     //     },
  //     //   ],
  //     //   attributes: ["id","name", "isActive"], // Include necessary category fields
  //     //   order: [["createdAt", "DESC"]],
  //     // });

  //     // 🟢 **Raw SQL Query to Fetch Categories, Their Translations, and Subcategories**

  //     if(lang)
  //     {

  //     }

  //     const rawQuery = `

  //           SELECT

  //             mc.id AS category_id,
  //             mct.name AS category_name,
  //             mct.lang AS category_lang,
  //             mc."isActive" AS category_active,
  //             ms.id AS subcategory_id,
  //             mst.name AS subcategory_name,
  //             mst.lang AS subcategory_lang,
  //             mst."isActive" AS subcategory_active

  //               FROM master_categories as mc

  //               JOIN master_category_trans as mct ON mc.id = mct.master_category_id
  //               LEFT JOIN master_subcategories as ms ON mc.id = ms."categoryId" AND ms."isDeleted" = false
  //               LEFT JOIN master_subcategory_trans as mst ON ms.id = mst.master_subcategory_id

  //               WHERE mc."isDeleted" = false
  //                   AND mct.name ILIKE :searchQuery
  //                   AND mct.lang = :lang
  //                   AND mst.lang = :lang
  //                   ORDER BY mc.created_at DESC

  //                   `;

  //     // LIMIT :limit OFFSET :offset;

  //     //? with all translation

  //     // const rawQuery = `
  //     //   SELECT
  //     //     mc.id AS category_id,
  //     //     mct.name AS category_name,
  //     //     mct.lang AS category_lang,
  //     //     mc."isActive" AS category_active,
  //     //     ms.id AS subcategory_id,
  //     //     mst.name AS subcategory_name,
  //     //     mst.lang AS subcategory_lang,
  //     //     mst."isActive" AS subcategory_active
  //     //   FROM master_categories AS mc
  //     //   JOIN master_category_trans AS mct ON mc.id = mct.master_category_id
  //     //   LEFT JOIN master_subcategories AS ms ON mc.id = ms."categoryId" AND ms."isDeleted" = false
  //     //   LEFT JOIN master_subcategory_trans AS mst ON ms.id = mst.master_subcategory_id
  //     //   WHERE mc."isDeleted" = false
  //     //     AND mct.name ILIKE :searchQuery
  //     //   ORDER BY mc.created_at DESC
  //     //   -- You can add LIMIT and OFFSET here if needed.
  //     // `;

  //     // // Execute the raw query
  //     const categoriesData = await sequelize.query(rawQuery, {
  //       replacements: {
  //         searchQuery: `%${search}%`,
  //         lang,

  //         // , limit, offset
  //       },
  //       type: Sequelize.QueryTypes.SELECT,
  //     });

  //     console.log("Fetched Categories: ", categoriesData);

  //     if (!categoriesData || categoriesData.count === 0) {
  //       return res.status(404).json({
  //         message: i18n.__("api.categories.notFound") || "No categories found",
  //       });
  //     }

  //     // //simple language wise
  //     const formattedData = categoriesData.reduce((acc, row) => {
  //       // It checks if this category already exists in acc (accumulator).
  //       let category = acc.find((c) => c.id === row.category_id);

  //       if (!category) {
  //         category = {
  //           id: row.category_id,
  //           name: row.category_name,
  //           isActive: row.category_active,
  //           lang: row.category_lang,
  //           subcategories: [],
  //         };
  //         acc.push(category);
  //       }
  //       if (row.subcategory_id) {
  //         category.subcategories.push({
  //           id: row.subcategory_id,
  //           name: row.subcategory_name,
  //           lang: row.subcategory_lang,
  //           isActive: row.subcategory_active,
  //         });
  //       }
  //       return acc;
  //     }, []);

  //     // //all transition
  //     // // Group results by category_id.
  //     // // We'll create a map to aggregate category translations and subcategories.
  //     // const categoryMap = new Map();

  //     // categoriesData.forEach((row) => {
  //     //   // Get the master category id.
  //     //   const catId = row.category_id;
  //     //   // Get or initialize the category entry.
  //     //   let category = categoryMap.get(catId);
  //     //   if (!category) {
  //     //     category = {
  //     //       id: catId,
  //     //       isActive: categoriesData.category_active,
  //     //       // Collect translations as an array of objects: { lang, value }
  //     //       name: [],
  //     //       subcategoriesMap: new Map(), // temporary map for grouping subcategories
  //     //     };
  //     //     categoryMap.set(catId, category);
  //     //   }

  //     //   // Add the category translation (if not already added).
  //     //   if (categoriesData.category_lang && categoriesData.category_name) {
  //     //     if (
  //     //       !category.name.some(
  //     //         (t) =>
  //     //           t.lang === categoriesData.category_lang &&
  //     //           t.value === categoriesData.category_name
  //     //       )
  //     //     ) {
  //     //       category.name.push({
  //     //         lang: categoriesData.category_lang,
  //     //         value: categoriesData.category_name,
  //     //       });
  //     //     }
  //     //   }

  //     //   // Process subcategory if present.
  //     //   if (categoriesData.subcategory_id) {
  //     //     let subcat = category.subcategoriesMap.get(
  //     //       categoriesData.subcategory_id
  //     //     );
  //     //     if (!subcat) {
  //     //       subcat = {
  //     //         id: categoriesData.subcategory_id,
  //     //         isActive: categoriesData.subcategory_active,
  //     //         name: [], // array for subcategory translations
  //     //       };
  //     //       category.subcategoriesMap.set(
  //     //         categoriesData.subcategory_id,
  //     //         subcat
  //     //       );
  //     //     }
  //     //     if (
  //     //       categoriesData.subcategory_lang &&
  //     //       categoriesData.subcategory_name
  //     //     ) {
  //     //       if (
  //     //         !subcat.name.some(
  //     //           (t) =>
  //     //             t.lang === categoriesData.subcategory_lang &&
  //     //             t.value === categoriesData.subcategory_name
  //     //         )
  //     //       ) {
  //     //         subcat.name.push({
  //     //           lang: categoriesData.subcategory_lang,
  //     //           value: categoriesData.subcategory_name,
  //     //         });
  //     //       }
  //     //     }
  //     //   }
  //     // });

  //     // // Convert the category map into an array and also convert the subcategoriesMap into an array.
  //     // const formattedData = Array.from(categoryMap.values()).map((category) => {
  //     //   const subcategories = Array.from(category.subcategoriesMap.values());
  //     //   delete category.subcategoriesMap; // remove temporary property
  //     //   return {
  //     //     ...category,
  //     //     subcategory: subcategories,
  //     //   };
  //     // });

  //     return res.status(200).json({
  //       message:
  //         i18n.__("api.categories.listSuccess") ||
  //         "Categories listed successfully",
  //       data: formattedData,
  //       // totalCategories: categoriesData.count,
  //       // totalPages: Math.ceil(categoriesData.count / size),
  //       // currentPage: page,
  //     });

  //     // if (!categoryname) {
  //     //   return res
  //     //     .status(400)
  //     //     .json({ message: i18n.__"api.categories.invalidInput") });
  //     // }

  //     // const category = await MasterCategoryTrans.findOne({
  //     //   where: { name: categoryname , lang},
  //     // });

  //     // if (!category) {
  //     //   return res.status(404).json({ message: i18n.__("api.categories.notFound") });
  //     // }
  //     // console.log("category: ", category);

  //     // const subCategories = await MasterSubcategoryTrans.findAll({
  //     //   where: { categoryId: category.id ,lang },
  //     // });

  //     // // Fetching details of all the players participated in the auction
  //     // const categoriesData = await MasterCategoryTrans.findAndCountAll({
  //     //   include: {
  //     //     model: MasterSubcategoryTrans,
  //     //     where: { id: category.master_category_id, isDeleted: false },
  //     //     attributes: ["id", "name", "description"],
  //     //   },
  //     //   attributes: ["id", "name", "description"],
  //     //   limit,
  //     //   offset,
  //     // });

  //     // // If no categories are found, return a not-found response
  //     // if (!categoriesData || categoriesData.count === 0) {
  //     //   return res.status(404).json({ message: "No categories found" });
  //     // }
  //     // const data = {
  //     //   totalCategories: categoriesData.count,
  //     //   totalPages: Math.ceil(categoriesData.count / size),
  //     //   currentPage: page,
  //     //   categories: categoriesData.rows,
  //     // };
  //     // return res.status(200).json({
  //     //   message: i18n.__("api.auth.search.success"),
  //     //   // category,
  //     //   // subCategories,
  //     //   categoriesData,
  //     // });
  //   } catch (error) {
  //     console.error("Error searching category:", error);
  //     return res
  //       .status(500)
  //       .json({ message: i18n.__("api.errors.serverError"), error });
  //   }
  // },
  // listingCategory: async (req, res) => {
  //   // const { t } = req; // Get translation function from middleware
  //   try {
  //     // 🟢 **Raw SQL Query to Fetch Categories, Their Translations, and Subcategories**
  //     const rawQuery = `

  //           SELECT

  //             mc.id AS category_id,
  //             mct.name AS category_name,
  //             mct.lang AS category_lang,
  //             mc."isActive" AS category_active,
  //             ms.id AS subcategory_id,
  //             mst.name AS subcategory_name,
  //             mst.lang AS subcategory_lang,
  //             mst."isActive" AS subcategory_active

  //               FROM master_categories as mc

  //               JOIN master_category_trans as mct ON mc.id = mct.master_category_id
  //               LEFT JOIN master_subcategories as ms ON mc.id = ms."categoryId" AND ms."isDeleted" = false
  //               LEFT JOIN master_subcategory_trans as mst ON ms.id = mst.master_subcategory_id

  //               WHERE mc."isDeleted" = false
  //               ORDER BY mc.created_at DESC

  //               `;

  //     // AND mct.lang = :lang
  //     // AND mst.lang = :lang
  //     // AND mct.name ILIKE :searchQuery
  //     // LIMIT :limit OFFSET :offset;

  //     //? with all translation

  //     // const rawQuery = `
  //     //   SELECT
  //     //     mc.id AS category_id,
  //     //     mct.name AS category_name,
  //     //     mct.lang AS category_lang,
  //     //     mc."isActive" AS category_active,
  //     //     ms.id AS subcategory_id,
  //     //     mst.name AS subcategory_name,
  //     //     mst.lang AS subcategory_lang,
  //     //     mst."isActive" AS subcategory_active
  //     //   FROM master_categories AS mc
  //     //   JOIN master_category_trans AS mct ON mc.id = mct.master_category_id
  //     //   LEFT JOIN master_subcategories AS ms ON mc.id = ms."categoryId" AND ms."isDeleted" = false
  //     //   LEFT JOIN master_subcategory_trans AS mst ON ms.id = mst.master_subcategory_id
  //     //   WHERE mc."isDeleted" = false
  //     //     AND mct.name ILIKE :searchQuery
  //     //   ORDER BY mc.created_at DESC
  //     //   -- You can add LIMIT and OFFSET here if needed.
  //     // `;

  //     // // Execute the raw query
  //     const categoriesData = await sequelize.query(rawQuery, {
  //       type: Sequelize.QueryTypes.SELECT,
  //     });

  //     console.log("Fetched Categories: ", categoriesData);

  //     if (!categoriesData || categoriesData.count === 0) {
  //       return res.status(404).json({
  //         message: i18n.__("api.categories.notFound") || "No categories found",
  //       });
  //     }

  //     const formattedData = categoriesData.reduce((acc, row) => {
  //       // Find if the category already exists in the accumulator
  //       let category = acc.find((c) => c.id === row.category_id);

  //       if (!category) {
  //         category = {
  //           id: row.category_id,
  //           name: [],
  //           isActive: row.category_active,
  //           subcategories: [],
  //         };
  //         acc.push(category);
  //       }
  //       // Add translation only if it's not already included
  //       if (row.category_name) {
  //         const existsCatName = category.name.some(
  //           (t) => t.lang === row.category_lang && t.value === row.category_name
  //         );
  //         if (!existsCatName) {
  //           category.name.push({
  //             value: row.category_name,
  //             lang: row.category_lang,
  //           });
  //         }
  //       }
  //       if (row.subcategory_id) {
  //         // Find or create the subcategory object within category.subcategories
  //         let subcat = category.subcategories.find(
  //           (s) => s.id === row.subcategory_id
  //         );
  //         if (!subcat) {
  //           subcat = {
  //             id: row.subcategory_id,
  //             name: [], // Array of subcategory translations
  //             isActive: row.subcategory_active,
  //           };
  //           category.subcategories.push(subcat);
  //         }
  //         if (row.subcategory_name) {
  //           const existssubcatName = subcat.name.some(
  //             (t) =>
  //               t.lang === row.subcategory_lang &&
  //               t.value === row.subcategory_name
  //           );
  //           if (!existssubcatName) {
  //             subcat.name.push({
  //               value: row.subcategory_name,
  //               lang: row.subcategory_lang,
  //             });
  //           }
  //         }
  //       }

  //       // Add subcategory translation if available and not duplicated

  //       return acc;
  //     }, []);

  //     // //simple language wise
  //     // const formattedData = categoriesData.reduce((acc, row) => {
  //     //   // It checks if this category already exists in acc (accumulator).
  //     //   let category = acc.find((c) => c.id === row.category_id);

  //     //   if (!category) {
  //     //     category = {
  //     //       id: row.category_id,
  //     //       name: [],
  //     //       isActive: row.category_active,
  //     //       subcategories: [],
  //     //     };
  //     //     acc.push(category);
  //     //   }
  //     //   if (row.category_name) {
  //     //     category.name.push({
  //     //       value: row.category_name,
  //     //       lang: row.category_lang,
  //     //     });
  //     //   }
  //     //   if (row.subcategory_id) {
  //     //     category.subcategories.push({
  //     //       id: row.subcategory_id,
  //     //       subcategory_name: [],
  //     //       isActive: row.subcategory_active,
  //     //     });
  //     //     if (row.subcategory_name) {
  //     //       category.subCategories.subcategory_name.push({
  //     //         value: row.subcategory_name,
  //     //         lang: row.subcategory_lang,
  //     //       });
  //     //     }
  //     //   }
  //     //   return acc;
  //     // }, []);

  //     return res.status(200).json({
  //       message:
  //         i18n.__("api.categories.listSuccess") ||
  //         "Categories listed successfully",
  //       data: formattedData,
  //     });
  //   } catch (error) {
  //     console.error("Error searching category:", error);
  //     return res
  //       .status(500)
  //       .json({ message: i18n.__("api.errors.serverError"), error });
  //   }
  // },

  // listingCategory: async (req, res) => {
  //   try {
  //     // Raw SQL Query to Fetch Categories, Their Translations, and Subcategories

  //     // mc.id AS category_id,
  //     //             mct.name AS category_name,
  //     //             mct.lang AS category_lang,
  //     //             mc."isActive" AS category_active,
  //     //             ms.id AS subcategory_id,
  //     //             mst.name AS subcategory_name,
  //     //             mst.lang AS subcategory_lang,
  //     //             mst."isActive" AS subcategory_active

  //     //               FROM master_categories as mc

  //     //               JOIN master_category_trans as mct ON mc.id = mct.master_category_id
  //     //               LEFT JOIN master_subcategories as ms ON mc.id = ms."categoryId" AND ms."isDeleted" = false
  //     //               LEFT JOIN master_subcategory_trans as mst ON ms.id = mst.master_subcategory_id

  //     //               WHERE mc."isDeleted" = false
  //     //                   AND mct.name ILIKE :searchQuery
  //     //                   AND mct.lang = :lang
  //     //                   AND mst.lang = :lang
  //     //                   ORDER BY mc.created_at DESC

  //     //                   `;

  //     const rawQuery = `
  //           SELECT
  //               mc.id AS "categoryID",
  //               mct.name AS "categoryName",
  //               mct.lang AS "categoryLang",
  //               mc."isActive" AS "categoryActive",
  //               ms.id AS "subcategoryId",
  //               mst.name AS "subcategoryName",
  //               mst.lang AS "subcategoryLang",
  //               mst."isActive" AS "subcategoryActive"
  //           FROM master_categories as mc
  //           JOIN master_category_trans as mct ON mc.id = mct.master_category_id
  //           LEFT JOIN master_subcategories as ms ON mc.id = ms."categoryId" AND ms."isDeleted" = false
  //           LEFT JOIN master_subcategory_trans as mst ON ms.id = mst.master_subcategory_id
  //           WHERE mc."isDeleted" = false
  //           ORDER BY mc.created_at DESC
  //       `;
  //     // Assuming you have a method to execute the query
  //     const categoriesData = await sequelize.query(rawQuery);
  //     if (!categoriesData || categoriesData.length === 0) {
  //       return res.status(404).json({
  //         message: i18n.__("api.categories.notFound") || "No categories found",
  //       });
  //     }
  //     const formattedData = categoriesData.reduce((acc, row) => {
  //       // Find if the category already exists in the accumulator
  //       let category = acc.find((c) => c.id === row.categoryId);
  //       if (!category) {
  //         category = {
  //           id: row.categoryId,
  //           name: [],
  //           isActive: row.categoryActive,
  //           subcategories: [],
  //         };
  //         acc.push(category);
  //       }
  //       // Add category translation if it’s not already included
  //       if (row.categoryName) {
  //         const existsCatName = category.name.some(
  //           (t) => t.lang === row.categoryLang && t.value === row.categoryName
  //         );
  //         if (!existsCatName) {
  //           category.name.push({
  //             value: row.categoryName,
  //             lang: row.categoryLang,
  //           });
  //         }
  //       }
  //       if (row.subcategoryId) {
  //         // Find or create the subcategory object within category.subcategories
  //         let subcat = category.subcategories.find(
  //           (s) => s.id === row.subcategoryId
  //         );
  //         if (!subcat) {
  //           subcat = {
  //             id: row.subcategoryId,
  //             name: [], // Array of subcategory translations
  //             isActive: row.subcategoryActive,
  //           };
  //           category.subcategories.push(subcat);
  //         }
  //         if (row.subcategoryName) {
  //           const existsSubcatName = subcat.name.some(
  //             (t) =>
  //               t.lang === row.subcategoryLang &&
  //               t.value === row.subcategoryName
  //           );
  //           if (!existsSubcatName) {
  //             subcat.name.push({
  //               value: row.subcategoryName,
  //               lang: row.subcategoryLang,
  //             });
  //           }
  //         }
  //       }
  //       // Return accumulator with formatted data
  //       return acc;
  //     }, []);
  //     return res.status(200).json({
  //       message:
  //         i18n.__("api.categories.listSuccess") ||
  //         "Categories listed successfully",
  //       data: formattedData,
  //     });
  //   } catch (error) {
  //     console.error("Error searching category:", error);
  //     return res.status(500).json({
  //       message: i18n.__("api.errors.serverError"),
  //       error,
  //     });
  //   }
  // },

  listingCategory: async (req, res) => {
    // const { t } = req; // Get translation function from middleware
    try {
      const search = req.query.q;
      console.log("search: ", search);

      if (search === undefined || search === null || search === "") {
        try {
          //if not search then return all categories with subcategories and translations
          // :large_green_circle: **Raw SQL Query to Fetch Categories, Their Translations, and Subcategories**
          const rawQuery = `
      SELECT
        mc.id AS category_id,
        mct.name AS category_name,
        mct.lang AS category_lang,
        mc."isActive" AS category_active,
        ms.id AS subcategory_id,
        mst.name AS subcategory_name,
        mst.lang AS subcategory_lang,
        mst."isActive" AS subcategory_active
          FROM master_categories as mc
          JOIN master_category_trans as mct ON mc.id = mct.master_category_id
          LEFT JOIN master_subcategories as ms ON mc.id = ms."categoryId" AND ms."isDeleted" = false
          LEFT JOIN master_subcategory_trans as mst ON ms.id = mst.master_subcategory_id
          WHERE mc."isDeleted" = false
          ORDER BY mc.created_at DESC
          `;
          // // Execute the raw query
          const categoriesData = await sequelize.query(rawQuery, {
            type: Sequelize.QueryTypes.SELECT,
          });
          console.log("Fetched Categories: ", categoriesData);
          if (!categoriesData || categoriesData.count === 0) {
            return res.status(404).json({
              message:
                i18n.__("api.categories.notFound") || "No categories found",
            });
          }
          const formattedData = categoriesData.reduce((acc, row) => {
            // Find if the category already exists in the accumulator
            let category = acc.find((c) => c.id === row.category_id);
            if (!category) {
              category = {
                id: row.category_id,
                name: [],
                isActive: row.category_active,
                subcategories: [],
              };
              acc.push(category);
            }
            // Add translation only if it's not already included
            if (row.category_name) {
              const existsCatName = category.name.some(
                (t) =>
                  t.lang === row.category_lang && t.value === row.category_name
              );
              if (!existsCatName) {
                category.name.push({
                  value: row.category_name,
                  lang: row.category_lang,
                });
              }
            }
            // Check if the subcategory already exists in the category's subcategories
            if (row.subcategory_id) {
              // Find or create the subcategory object within category.subcategories
              let subcat = category.subcategories.find(
                (s) => s.id === row.subcategory_id
              );
              if (!subcat) {
                subcat = {
                  id: row.subcategory_id,
                  name: [], // Array of subcategory translations
                  isActive: row.subcategory_active,
                };
                category.subcategories.push(subcat);
              }
              if (row.subcategory_name) {
                const existssubcatName = subcat.name.some(
                  (t) =>
                    t.lang === row.subcategory_lang &&
                    t.value === row.subcategory_name
                );
                if (!existssubcatName) {
                  subcat.name.push({
                    value: row.subcategory_name,
                    lang: row.subcategory_lang,
                  });
                }
              }
            }
            return acc;
          }, []);
          return res.status(200).json({
            message:
              i18n.__("api.categories.listSuccess") ||
              "Categories listed successfully",
            data: formattedData,
          });
        } catch (error) {
          console.error("Error searching category:", error);
          return res.status(500).json({
            message: i18n.__("api.errors.serverError"),
            error,
          });
        }
      } else {
        try {
          const lang = i18n.getLocale() || "en";
          console.log("lang: ", lang);
          console.log("Search Query:", `%${search}%`);
          // :large_green_circle: **Raw SQL Query to Fetch Categories, Their Translations, and Subcategories**
          const rawQuery = `
      SELECT
        mc.id AS category_id,
        mct.name AS category_name,
        mct.lang AS category_lang,
        mc."isActive" AS category_active,
        ms.id AS subcategory_id,
        mst.name AS subcategory_name,
        mst.lang AS subcategory_lang,
        mst."isActive" AS subcategory_active
          FROM master_categories as mc
          JOIN master_category_trans as mct ON mc.id = mct.master_category_id
          LEFT JOIN master_subcategories as ms ON mc.id = ms."categoryId" AND ms."isDeleted" = false
          LEFT JOIN master_subcategory_trans as mst ON ms.id = mst.master_subcategory_id
          WHERE mc."isDeleted" = false
              AND mct.name ILIKE :searchQuery
              AND mct.lang = :lang
              AND mst.lang = :lang
              ORDER BY mc.created_at DESC
              `;
          // LIMIT :limit OFFSET :offset;
          // // Execute the raw query
          const categoriesData = await sequelize.query(rawQuery, {
            replacements: {
              searchQuery: `%${search}%`,
              lang,
              // , limit, offset
            },
            type: Sequelize.QueryTypes.SELECT,
          });
          console.log("Fetched Categories: ", categoriesData);
          if (!categoriesData || categoriesData.count === 0) {
            return res.status(404).json({
              message:
                i18n.__("api.categories.notFound") || "No categories found",
            });
          }
          // //simple language wise
          const formattedData = categoriesData.reduce((acc, row) => {
            // It checks if this category already exists in acc (accumulator).
            let category = acc.find((c) => c.id === row.category_id);
            if (!category) {
              category = {
                id: row.category_id,
                name: row.category_name,
                isActive: row.category_active,
                lang: row.category_lang,
                subcategories: [],
              };
              acc.push(category);
            }
            if (row.subcategory_id) {
              category.subcategories.push({
                id: row.subcategory_id,
                name: row.subcategory_name,
                lang: row.subcategory_lang,
                isActive: row.subcategory_active,
              });
            }
            return acc;
          }, []);
          return res.status(200).json({
            message:
              i18n.__("api.categories.listSuccess") ||
              "Categories listed successfully",
            data: formattedData,
            // totalCategories: categoriesData.count,
            // totalPages: Math.ceil(categoriesData.count / size),
            // currentPage: page,
          });
        } catch (error) {
          console.error("Error searching category:", error);
          return res
            .status(500)
            .json({ message: i18n.__("api.errors.serverError"), error });
        }
      }
    } catch (error) {
      console.error("Error searching category:", error);
      return res
        .status(500)
        .json({ message: i18n.__("api.errors.serverError"), error });
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

// listingCategory: async (req, res) => {

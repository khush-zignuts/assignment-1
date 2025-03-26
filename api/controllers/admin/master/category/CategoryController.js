const i18n = require("../../../../config/i18n");

const {
  MasterCategoryTrans,
  MasterCategory,
  MasterSubcategoryTrans,
  MasterSubcategory,
} = require("../../../../models");
const { Sequelize, Op } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
const sequelize = require("../../../../config/db");
const { STATUS_CODES } = require("../../../../config/constants");
const { VALIDATION_RULES } = require("../../../../config/validationRules");

const Validator = require("validatorjs");
const validateRequest = (data, rules, res) => {
  const validation = new Validator(data, rules);

  if (validation.fails()) {
    return res.status(STATUS_CODES.BAD_REQUEST).json({
      status: STATUS_CODES.BAD_REQUEST,
      message: "Validation failed.",
      data: null,
      error: validation.errors.all(),
    });
  }

  return true;
};

module.exports = {
  addCategory: async (req, res) => {
    try {
      if (!validateRequest(req.body, VALIDATION_RULES.CATEGORY, res)) return;
      //sir changes
      let categories = req.body.data;
      console.log("categories: ", categories);

      if (!Array.isArray(categories) || categories.length === 0) {
        return res.json({
          status: STATUS_CODES.BAD_REQUEST,
          message: "Category already exists",
          data: null,
          error: null,
        });
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
        return res.json({
          status: "error",
          message: "Category already exists",
          data: null,
          error: null,
        });
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

      // Create master-category-trans
      await MasterCategoryTrans.bulkCreate(category_trans);

      return res.json({
        status: STATUS_CODES.CREATED,
        message: i18n.__("api.categories.addSuccess"),
        data: { master_category_id },
        error: null,
      });
    } catch (error) {
      console.error("Error adding category:", error);
      return res.json({
        status: STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: null,
        error: error.message,
      });
    }
  },

  updateCategory: async (req, res) => {
    try {
      const { categoryId, name, lang } = req.body;

      // Validate input
      if (!categoryId || !name || !lang) {
        return res.json({
          status: STATUS_CODES.BAD_REQUEST,
          message: "Category ID, name, and language are required",
          data: null,
          error: null,
        });
      }

      // Find category by ID
      const category = await MasterCategoryTrans.findOne({
        where: { id: categoryId, isDeleted: false },
        attributes: ["id", "master_category_id", "name", "lang"],
      });

      console.log("category found: ", category);

      if (!category) {
        return res.json({
          status: STATUS_CODES.NOT_FOUND,
          message: i18n.__("api.categories.notFound"),
          data: null,
          error: null,
        });
      }

      // Check if a category with the same name and lang already exists (excluding the current category)
      const duplicateCategory = await MasterCategoryTrans.findOne({
        where: {
          isDeleted: false,
          name: name.toLowerCase(),
          lang,
          id: { [Op.ne]: categoryId }, // Exclude the current category from check
        },
        attributes: ["id", "master_category_id", "name", "lang"],
      });
      if (duplicateCategory) {
        return res.json({
          status: STATUS_CODES.BAD_REQUEST,
          message: "A category with the same name and language already exists",
          data: null,
          error: null,
        });
      }

      // Update the category
      await MasterCategoryTrans.update(
        { name: name.toLowerCase(), lang },
        { where: { id: categoryId } }
      );

      return res.json({
        status: STATUS_CODES.SUCCESS,
        message: i18n.__("api.categories.updateSuccess"),
        data: { categoryId },
        error: null,
      });
    } catch (error) {
      console.error("Error updating category:", error);
      return res.json({
        status: STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: null,
        error: error.message,
      });
    }
  },
  deleteCategory: async (req, res) => {
    try {
      const { categoryId } = req.params; // Extract categoryId from request params
      console.log("Deleting category:", categoryId);

      // Validate input
      if (!categoryId) {
        return res.json({
          status: STATUS_CODES.BAD_REQUEST,
          message: "Category ID is required",
          data: null,
          error: null,
        });
      }
      // Find category by ID
      const category = await MasterCategory.findOne({
        where: { id: categoryId, isDeleted: false },
        attributes: ["id", "master_category_id", "name", "lang"],
      });

      if (!category) {
        return res.json({
          status: STATUS_CODES.NOT_FOUND,
          message: i18n.__("api.categories.notFound"),
          data: null,
          error: null,
        });
      }

      // Check if subcategories exist under this category
      const subcategories = await MasterSubcategory.findAll({
        where: { categoryId, isDeleted: false },
        attributes: ["id", "master_subcategory_id", "name", "lang"],
      });

      if (subcategories.length > 0) {
        return res.json({
          status: STATUS_CODES.BAD_REQUEST,
          message:
            "Cannot delete category because subcategories exist under it.",
          data: null,
          error: null,
        });
      }

      // Soft delete the category (recommended approach)
      await MasterCategory.update(
        { isDeleted: true },
        { where: { id: categoryId } }
      );

      return res.json({
        status: STATUS_CODES.SUCCESS,
        message: i18n.__("api.categories.deleted"),
        data: { categoryId },
        error: null,
      });
    } catch (error) {
      console.error("Error deleting category:", error);
      return res.json({
        status: STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: null,
        error: error.message,
      });
    }
  },
  listingCategory: async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

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
                LIMIT :limit OFFSET :offset;
                `;

          // // Execute the raw query
          const categoriesData = await sequelize.query(rawQuery, {
            replacements: { limit, offset },
            type: Sequelize.QueryTypes.SELECT,
          });

          if (!categoriesData || categoriesData.length === 0) {
            return res.json({
              status: STATUS_CODES.NOT_FOUND,
              message:
                i18n.__("api.categories.notFound") || "No categories found",
              data: null,
              error: null,
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

          // Calculate total records for pagination
          const countQuery = `
              SELECT COUNT(*) AS total
              FROM master_categories AS mc
              WHERE mc."isDeleted" = false;
            `;

          const countResult = await sequelize.query(countQuery, {
            type: Sequelize.QueryTypes.SELECT,
          });

          const totalRecords = countResult[0].total;
          const totalPages = Math.ceil(totalRecords / limit);

          return res.json({
            status: STATUS_CODES.SUCCESS,
            message:
              i18n.__("api.categories.listSuccess") ||
              "Categories listed successfully",
            data: formattedData,
            pagination: {
              currentPage: page,
              totalPages,
              totalRecords,
            },
            error: null,
          });
        } catch (error) {
          console.error("Error listing categories:", error);
          return res.json({
            status: STATUS_CODES.SERVER_ERROR,
            message: i18n.__("api.errors.serverError"),
            data: null,
            error: error.message,
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
                    LIMIT :limit OFFSET :offset;
                    `;

          // // Execute the raw query
          const categoriesData = await sequelize.query(rawQuery, {
            replacements: {
              limit,
              offset,
              searchQuery: `%${search}%`,
              lang,
              // , limit, offset
            },
            type: Sequelize.QueryTypes.SELECT,
          });

          if (!categoriesData || categoriesData.length === 0) {
            return res.json({
              status: STATUS_CODES.NOT_FOUND,
              message:
                i18n.__("api.categories.notFound") || "No categories found",
              data: null,
              error: null,
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
          return res.json({
            status: STATUS_CODES.SUCCESS,
            message:
              i18n.__("api.categories.listSuccess") ||
              "Categories listed successfully",
            data: formattedData,
            pagination: {
              currentPage: page,
              totalPages,
              totalRecords,
            },
            error: null,
          });
        } catch (error) {
          console.error("Error listing categories:", error);
          return res.json({
            status: STATUS_CODES.SERVER_ERROR,
            message: i18n.__("api.errors.serverError"),
            data: null,
            error: error.message,
          });
        }
      }
    } catch (error) {
      return res.json({
        status: STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: null,
        error: error.message,
      });
    }
  },
};

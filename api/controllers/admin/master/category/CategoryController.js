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
const { HTTP_STATUS_CODES } = require("../../../../config/constants");
const { VALIDATION_RULES } = require("../../../../config/validationRules");

const VALIDATOR = require("validatorjs");
const {
  updatedBy,
  updatedAt,
  deletedBy,
} = require("../../../../models/CommonField");

module.exports = {
  addCategory: async (req, res) => {
    try {
      const adminId = req.admin.id;

      let { categories } = req.body;

      const validation = new VALIDATOR(req.body, {
        categories: VALIDATION_RULES.CATEGORY.categories, // Check if categories is a valid array
      });

      if (validation.fails()) {
        return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          message: "Validation failed.",
          data: null,
          error: validation.errors.all(),
        });
      }

      for (let i = 0; i < categories.length; i++) {
        const query = `
          SELECT id
          FROM master_category_trans
          WHERE is_deleted = false
          AND lang = :lang
          AND LOWER(name) = LOWER(:name)
        `;

        const existingCategory = await sequelize.query(query, {
          replacements: {
            name: categories[i].name,
            lang: categories[i].lang,
          },
          type: sequelize.QueryTypes.SELECT,
        });

        // If a category exists, return a conflict response
        if (existingCategory.length > 0) {
          return res.status(HTTP_STATUS_CODES.CONFLICT).json({
            status: HTTP_STATUS_CODES.CONFLICT,
            message: `Category '${categories[i].name}' already exists in '${categories[i].lang}'`,
            data: null,
            error: null,
          });
        }
      }

      // Generate UUID for MasterCategory
      const masterCategoryId = uuidv4();

      // // Prepare data for bulk insert
      let category_trans = [];
      for (let i = 0; i < categories.length; i++) {
        const { name, lang } = categories[i];

        category_trans.push({
          masterCategoryId,
          name: categories[i].name,
          lang: categories[i].lang,
          createdAt: Math.floor(Date.now() / 1000),
          createdBy: adminId,
        });
      }

      // Create master-category || cat_id put in master category table
      const category = await MasterCategory.create({
        id: masterCategoryId,
        createdAt: Math.floor(Date.now() / 1000),
        createdBy: adminId,
      });

      // Create master-category-trans
      await MasterCategoryTrans.bulkCreate(category_trans, { validate: true });

      return res.json({
        status: HTTP_STATUS_CODES.CREATED,
        message: i18n.__("api.categories.addSuccess"),
        data: { masterCategoryId },
        error: null,
      });
    } catch (error) {
      console.error("Error adding category:", error);
      return res.json({
        status: HTTP_STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: null,
        error: error.message,
      });
    }
  },

  updateCategory: async (req, res) => {
    try {
      const adminId = req.admin.id;
      const { categoryId, categories } = req.body;

      const validation = new VALIDATOR(req.body, {
        categoryId: VALIDATION_RULES.CATEGORY.masterCategoryId,
        categories: VALIDATION_RULES.CATEGORY.categories,
      });

      if (validation.fails()) {
        return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          message: "Validation failed.",
          data: null,
          error: validation.errors.all(),
        });
      }

      // Find category by ID
      const category = await MasterCategory.findOne({
        where: { id: categoryId, isDeleted: false },
        attributes: ["id"],
      });

      if (!category) {
        return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({
          status: HTTP_STATUS_CODES.NOT_FOUND,
          message: i18n.__("api.categories.notFound"),
          data: null,
          error: null,
        });
      }

      // Check if a category with the same name and lang already exists (excluding the current category)
      for (let i = 0; i < categories.length; i++) {
        const duplicateCategory = await MasterCategoryTrans.findOne({
          where: {
            isDeleted: false,
            name: categories[i].name.toLowerCase(),
            lang: categories[i].lang,
            id: { [Op.ne]: categoryId },
          },
          attributes: ["id"],
        });

        if (duplicateCategory) {
          return res.json({
            status: HTTP_STATUS_CODES.BAD_REQUEST,
            message:
              "A category with the same name and language already exists",
            data: null,
            error: null,
          });
        }
      }

      // // Prepare data for bulk insert
      let category_trans = [];
      for (let i = 0; i < categories.length; i++) {
        const { name, lang } = categories[i];

        category_trans.push({
          id: uuidv4(),
          masterCategoryId: categoryId,
          name: categories[i].name,
          lang: categories[i].lang,
          updatedAt: Math.floor(Date.now() / 1000),
          updatedBy: adminId,
        });
      }
      // Create master-category || cat_id put in master category table
      //update --> where ?
      // const Category = await MasterCategory.create({
      //   updatedAt: Math.floor(Date.now() / 1000),
      //   updatedBy: adminId,
      // });

      //update isdeleted true category which get from id
      await MasterCategoryTrans.update(
        { isDeleted: true, updatedAt: Math.floor(Date.now() / 1000) },
        { where: { id: categoryId } }
      );

      await MasterCategoryTrans.bulkCreate(category_trans);

      return res.json({
        status: HTTP_STATUS_CODES.OK,
        message: i18n.__("api.categories.update OK"),
        data: { categoryId },
        error: null,
      });
    } catch (error) {
      console.error("Error updating category:", error);
      return res.json({
        status: HTTP_STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: null,
        error: error.message,
      });
    }
  },
  deleteCategory: async (req, res) => {
    try {
      const adminId = req.admin.id;
      const { categoryId } = req.params; // Extract categoryId from request params

      const validation = new VALIDATOR(req.admin.id, {
        categoryId: VALIDATION_RULES.CATEGORY.masterCategoryId, // Check if categories is a valid array
      });

      if (validation.fails()) {
        return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          message: "Validation failed.",
          data: null,
          error: validation.errors.all(),
        });
      }

      // Find category by ID
      const category = await MasterCategory.findOne({
        where: { id: categoryId, isDeleted: false },
        attributes: ["id"],
      });

      if (!category) {
        return res.json({
          status: HTTP_STATUS_CODES.NOT_FOUND,
          message: i18n.__("api.categories.notFound"),
          data: null,
          error: null,
        });
      }

      const query = `
          SELECT 
          ms.id AS id
          FROM master_subcategory AS ms
          WHERE is_deleted = false
          AND ms.category_id =:categoryId
        `;

      const subcategory = await sequelize.query(query, {
        replacements: { categoryId },
        type: sequelize.QueryTypes.SELECT,
      });

      if (!subcategory.length) {
        return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({
          status: HTTP_STATUS_CODES.NOT_FOUND,
          message: "No subcategories found for this category.",
          data: null,
          error: null,
        });
      }

      const subcategoryIds = subcategory.map((sub) => sub.id);

      await MasterSubcategoryTrans.update(
        {
          isDeleted: true,
          deletedAt: Math.floor(Date.now() / 1000), // Correct placement
          deletedBy: adminId,
        },
        { where: { master_subcategory_id: subcategoryIds } }
      );

      return res.json({
        status: HTTP_STATUS_CODES.OK,
        message: i18n.__("api.categories.deleted"),
        data: { categoryId },
        error: null,
      });
    } catch (error) {
      console.error("Error deleting category:", error);
      return res.json({
        status: HTTP_STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: null,
        error: error.message,
      });
    }
  },
  listingCategory: async (req, res) => {
    try {
      const adminId = req.admin.id;
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
              mc.is_active AS category_active,
              ms.id AS subcategory_id,
              mst.name AS subcategory_name,
              mst.lang AS subcategory_lang,
              mst.is_active AS subcategory_active
                FROM master_category as mc
                JOIN master_category_trans as mct ON mc.id = mct.master_category_id
                LEFT JOIN master_subcategory as ms ON mc.id = ms.category_id AND ms.is_deleted = false
                LEFT JOIN master_subcategory_trans as mst ON ms.id = mst.master_subcategory_id
                WHERE mc.is_deleted = false
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
              status: HTTP_STATUS_CODES.NOT_FOUND,
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
              FROM master_category AS mc
              WHERE mc.is_deleted = false;
            `;

          const countResult = await sequelize.query(countQuery, {
            type: Sequelize.QueryTypes.SELECT,
          });

          const totalRecords = countResult[0].total;
          const totalPages = Math.ceil(totalRecords / limit);

          return res.json({
            status: HTTP_STATUS_CODES.OK,
            message:
              i18n.__("api.categories.list OK") || "Categories listed  OKfully",
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
            status: HTTP_STATUS_CODES.SERVER_ERROR,
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
              status: HTTP_STATUS_CODES.NOT_FOUND,
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
            status: HTTP_STATUS_CODES.OK,
            message:
              i18n.__("api.categories.list OK") || "Categories listed  OKfully",
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
            status: HTTP_STATUS_CODES.SERVER_ERROR,
            message: i18n.__("api.errors.serverError"),
            data: null,
            error: error.message,
          });
        }
      }
    } catch (error) {
      return res.json({
        status: HTTP_STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: null,
        error: error.message,
      });
    }
  },
};

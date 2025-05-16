const i18n = require("../../../../config/i18n");

const {
  MasterCategoryTrans,
  MasterCategory,
  Account,
} = require("../../../../models");
const { Sequelize, Op } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
const sequelize = require("../../../../config/db");
const { HTTP_STATUS_CODES } = require("../../../../config/constants");
const { VALIDATION_RULES } = require("../../../../config/validationRules");

const VALIDATOR = require("validatorjs");

//redis:
//with redis:
const redis = require("redis");
const client = redis.createClient();
client.connect(); // Connect Redis cli

module.exports = {
  addCategory: async (req, res) => {
    try {
      const adminId = req.admin.id;

      const { translation } = req.body;

      const validation = new VALIDATOR(req.body, {
        translation: VALIDATION_RULES.CATEGORY.translation, // Check if categories is a valid array
      });

      if (validation.fails()) {
        return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          message: "Validation failed.",
          data: "",
          error: validation.errors.all(),
        });
      }

      for (let i = 0; i < translation.length; i++) {
        const query = `
          SELECT id
          FROM master_category_trans
          WHERE is_deleted = false
          AND LOWER(lang) = LOWER(:lang)
          AND LOWER(name) = LOWER(:name)
        `;

        const existingCategory = await sequelize.query(query, {
          replacements: {
            name: translation[i].name,
            lang: translation[i].lang,
          },
          type: sequelize.QueryTypes.SELECT,
        });

        // If a category exists, return a conflict response
        if (existingCategory.length > 0) {
          return res.status(HTTP_STATUS_CODES.CONFLICT).json({
            status: HTTP_STATUS_CODES.CONFLICT,
            message: `Category '${translation[i].name}' already exists in '${translation[i].lang}'`,
            data: "",
            error: "",
          });
        }
      }

      // Generate UUID for MasterCategory
      const masterCategoryId = uuidv4();

      // // Prepare data for bulk insert
      let categoryTrans = [];
      for (let i = 0; i < translation.length; i++) {
        const { name, lang } = translation[i];

        categoryTrans.push({
          masterCategoryId,
          name: translation[i].name,
          lang: translation[i].lang,
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
      await MasterCategoryTrans.bulkCreate(categoryTrans, { validate: true });

      return res.status(HTTP_STATUS_CODES.SERVER_ERROR).json({
        status: HTTP_STATUS_CODES.CREATED,
        message: i18n.__("api.categories.addSuccess"),
        data: { masterCategoryId },
        error: "",
      });
    } catch (error) {
      console.error("Error adding category:", error);
      return res.status(HTTP_STATUS_CODES.SERVER_ERROR).json({
        status: HTTP_STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: "",
        error: error.message,
      });
    }
  },

  updateCategory: async (req, res) => {
    try {
      const adminId = req.admin.id;
      const { categoryId, translation } = req.body;

      const validation = new VALIDATOR(req.body, {
        categoryId: VALIDATION_RULES.CATEGORY.masterCategoryId,
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

      // Find category by ID
      const category = await MasterCategory.findOne({
        where: { id: categoryId, isDeleted: false },
        attributes: ["id"],
      });

      // console.log("category: ", category);
      if (!category) {
        return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({
          status: HTTP_STATUS_CODES.NOT_FOUND,
          message: i18n.__("api.categories.notFound"),
          data: "",
          error: "",
        });
      }

      // Check if a category with the same name and lang already exists (excluding the current category)
      for (let i = 0; i < translation.length; i++) {
        const duplicateCategory = await MasterCategoryTrans.findOne({
          where: {
            isDeleted: false,
            name: translation[i].name.toLowerCase(),
            lang: translation[i].lang.toLowerCase(),
            id: { [Op.ne]: categoryId },
          },
          attributes: ["id"],
        });

        if (duplicateCategory) {
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
        master_category_id
        FROM master_category_trans
        WHERE master_category_id = :categoryId
        AND is_deleted = false
   
        `;

        const existingCategory = await sequelize.query(query, {
          replacements: {
            categoryId: categoryId,
          },
          type: sequelize.QueryTypes.SELECT, // Ensure SELECT query type
        });

        if (existingCategory.length > 0) {
          // Ensure there are records to delete
          const idsToDelete = existingCategory.map((cat) => cat.id);
          await MasterCategoryTrans.destroy({
            where: {
              id: idsToDelete,
              isDeleted: false,
            },
          });

          console.log(`Deleted categories for masterCategoryId: ${categoryId}`);
        } else {
          console.log(
            `No categories found to delete for masterCategoryId: ${categoryId}`
          );
        }
      }

      // Find and delete the category
      // const categoryToDelete = await MasterCategoryTrans.findAll({
      //   where: { masterCategoryId: categoryId, isDeleted: false },
      //   attributes: ["id", "master_category_id", "name"],
      // });

      // if (categoryToDelete.length > 0) {
      //   // Ensure there are records to delete
      //   await MasterCategoryTrans.destroy({
      //     where: {
      //       id: categoryToDelete.map((cat) => cat.id), // Extract IDs
      //       isDeleted: false,
      //     },
      //   });

      //   console.log(`Deleted categories for masterCategoryId: ${categoryId}`);
      // } else {
      //   console.log(
      //     `No categories found to delete for masterCategoryId: ${categoryId}`
      //   );
      // }

      // // Prepare data for bulk insert

      let categoryTrans = [];
      for (let i = 0; i < translation.length; i++) {
        const { name, lang } = translation[i];

        categoryTrans.push({
          id: uuidv4(),
          masterCategoryId: categoryId,
          name: translation[i].name.toLowerCase(),
          lang: translation[i].lang.toLowerCase(),
          updatedAt: Math.floor(Date.now() / 1000),
          updatedBy: adminId,
        });
      }
      // Create master-category || cat_id put in master category table

      await MasterCategory.update(
        {
          updatedAt: Math.floor(Date.now() / 1000),
          updatedBy: adminId,
        },
        { where: { id: categoryId } }
      );

      await MasterCategoryTrans.bulkCreate(categoryTrans, { validate: true });

      return res.json({
        status: HTTP_STATUS_CODES.OK,
        message: i18n.__("api.categories.update OK"),
        data: { categoryId },
        error: "",
      });
    } catch (error) {
      console.error("Error updating category:", error);
      return res.json({
        status: HTTP_STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: "",
        error: error.message,
      });
    }
  },
  deleteCategory: async (req, res) => {
    try {
      const adminId = req.admin.id;
      const { categoryId } = req.params; // Extract categoryId from request params

      const validation = new VALIDATOR(req.params, {
        categoryId: VALIDATION_RULES.CATEGORY.masterCategoryId,
      });

      if (validation.fails()) {
        return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          message: "Validation failed.",
          data: "",
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
          data: "",
          error: "",
        });
      }
      const categoryInAccount = await Account.findOne({
        where: { id: categoryId, isDeleted: false },
        attributes: ["id"],
      });

      if (categoryInAccount) {
        return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          message: "Category exists in Account, cannot proceed.",
          data: "",
          error: "",
        });
      }

      //find for subcategory

      const query = `
          SELECT 
          ms.id AS id
          FROM master_subcategory AS ms
          WHERE is_deleted = false
          AND ms.category_id =:categoryId
          `;

      const subcategory = await sequelize.query(query, {
        replacements: { categoryId: categoryId },
        type: sequelize.QueryTypes.SELECT,
      });

      if (!subcategory.length) {
        return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({
          status: HTTP_STATUS_CODES.NOT_FOUND,
          message: "No subcategories found for this category.",
          data: "",
          error: "",
        });
      }

      // **Update MasterCategory**
      await MasterCategory.update(
        {
          isDeleted: true,
          deletedAt: Math.floor(Date.now() / 1000),
          deletedBy: adminId,
        },
        { where: { id: categoryId } }
      );

      // **Update MasterCategoryTrans**
      await MasterCategoryTrans.update(
        {
          isDeleted: true,
          deletedAt: Math.floor(Date.now() / 1000),
          deletedBy: adminId,
        },
        { where: { master_category_id: categoryId } }
      );

      return res.json({
        status: HTTP_STATUS_CODES.OK,
        message: i18n.__("api.categories.deleted"),
        data: { categoryId },
        error: "",
      });
    } catch (error) {
      console.error("Error deleting category:", error);
      return res.json({
        status: HTTP_STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: "",
        error: error.message,
      });
    }
  },

  // listingCategory: async (req, res) => {
  //   try {
  //     const adminId = req.admin.id;
  //     const { page = 1, limit = 10 } = req.query;
  //     const offset = (page - 1) * limit;
  //     const search = req.query.q;
  //     const lang = i18n.getLocale() || "en";

  //     const whereClause = search
  //       ? `WHERE mc.is_deleted = false AND mct.name ILIKE :searchQuery AND mct.lang = :lang AND mst.lang = :lang`
  //       : `WHERE mc.is_deleted = false`;

  //     const rawQuery = `
  //     SELECT
  //       mc.id AS category_id,
  //       mct.name AS category_name,
  //       mct.lang AS category_lang,
  //       mc.is_active AS category_active,
  //       ms.id AS subcategory_id,
  //       mst.name AS subcategory_name,
  //       mst.lang AS subcategory_lang,
  //       mst.is_active AS subcategory_active
  //     FROM master_category AS mc
  //     JOIN master_category_trans AS mct ON mc.id = mct.master_category_id
  //     LEFT JOIN master_subcategory AS ms ON mc.id = ms.category_id AND ms.is_deleted = false
  //     LEFT JOIN master_subcategory_trans AS mst ON ms.id = mst.master_subcategory_id
  //     ${whereClause}
  //     ORDER BY mc.created_at DESC

  //   `;

  //     // Calculate total records for pagination
  //     const countQuery = `
  //             SELECT COUNT(*) AS total
  //             FROM master_category AS mc
  //             WHERE mc.is_deleted = false;
  //           `;

  //     const replacements = search ? { searchQuery: `%${search}%` } : {};

  //     const categoriesData = await sequelize.query(rawQuery, {
  //       replacements,
  //       type: Sequelize.QueryTypes.SELECT,
  //     });

  //     if (!categoriesData.length) {
  //       return res.json({
  //         status: HTTP_STATUS_CODES.NOT_FOUND,
  //         message: "No categories found",
  //         data: "",
  //         error: "",
  //       });
  //     }

  //     const countResult = await sequelize.query(countQuery, {
  //       type: Sequelize.QueryTypes.SELECT,
  //     });

  //     const totalRecords = countResult[0].total;
  //     const totalPages = Math.ceil(totalRecords / limit);

  //     const formattedData = categoriesData.reduce((acc, row) => {
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

  //     return res.json({
  //       status: HTTP_STATUS_CODES.OK,
  //       message: "Categories retrieved successfully",
  //       data: formattedData,
  //       pagination: {
  //         currentPage: page,
  //         totalPages: totalPages,
  //         totalRecords: totalRecords,
  //       },
  //       error: "",
  //     });
  //   } catch (error) {
  //     console.error("Error listing categories:", error);
  //     return res.json({
  //       status: HTTP_STATUS_CODES.SERVER_ERROR,
  //       message: "Internal server error",
  //       data: "",
  //       error: error.message,
  //     });
  //   }
  // },

  listingCategory: async (req, res) => {
    try {
      const adminId = req.admin.id;
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;
      const search = req.query.q;
      const lang = i18n.getLocale() || "en";

      // Generate a unique cache key based on search and pagination
      const cacheKey = search ? `categories_search${search}` : `categories_all`;

      // ✅ Step 1: Check if data exists in Redis
      const cachedData = await client.get(cacheKey);
      if (cachedData) {
        return res.json({
          status: HTTP_STATUS_CODES.OK,
          message: "Categories retrieved from cache",
          data: JSON.parse(cachedData),
          pagination: { currentPage: page },
          error: "",
        });
      }

      // ✅ Step 2: Fetch from database if cache miss
      const whereClause = search
        ? `WHERE mc.is_deleted = false AND mct.name ILIKE :searchQuery AND mct.lang = :lang AND mst.lang = :lang`
        : `WHERE mc.is_deleted = false`;

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
      FROM master_category AS mc
      JOIN master_category_trans AS mct ON mc.id = mct.master_category_id
      LEFT JOIN master_subcategory AS ms ON mc.id = ms.category_id AND ms.is_deleted = false
      LEFT JOIN master_subcategory_trans AS mst ON ms.id = mst.master_subcategory_id
      ${whereClause}
      ORDER BY mc.created_at DESC
      LIMIT :limit OFFSET :offset;
    `;

      const replacements = search ? { searchQuery: `%${search}%` } : {};

      const categoriesData = await sequelize.query(rawQuery, {
        replacements,
        type: Sequelize.QueryTypes.SELECT,
      });

      if (!categoriesData.length) {
        return res.json({
          status: HTTP_STATUS_CODES.NOT_FOUND,
          message: "No categories found",
          data: "",
          error: "",
        });
      }

      // ✅ Step 3: Format data
      const formattedData = categoriesData.reduce((acc, row) => {
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

      // ✅ Step 4: Cache the data in Redis (expires in 1 hour)
      await client.setEx(cacheKey, 3600, JSON.stringify(formattedData));

      return res.json({
        status: HTTP_STATUS_CODES.OK,
        message: "Categories retrieved successfully",
        data: formattedData,
        pagination: { currentPage: page },
        error: "",
      });
    } catch (error) {
      console.error("Error listing categories:", error);
      return res.json({
        status: HTTP_STATUS_CODES.SERVER_ERROR,
        message: "Internal server error",
        data: "",
        error: error.message,
      });
    }
  },
};

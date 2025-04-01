// npm init -y
// // npm install express
// // npm install sequelize mysql2  # For MySQL
// // npm install sequelize pg pg-hstore  # For PostgreSQL
// // npm install jsonwebtoken
// // npm install cors
// // npm install dotenv
// // npm install express-validator
// // npx nodemon server.js

// // npm install express sequelize pg pg-hstore bcrypt jsonwebtoken dotenv i18next i18next-fs-backend i18next-http-middleware cors body-parser

// // #Bhavnagar
// const query = `
//           SELECT
//           ms.id AS id
//           FROM master_subcategory AS ms
//           WHERE is_deleted = false
//           AND ms.category_id =:categoryId
//           `;


// Harsh Kanzariya

getInventoryProductList: async (req, res) => {
    try {
      const { farmId, type, search } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      //get lang from headers
      const lang = req.headers.lang || "en";
      //initialize localization
      req.setLocale(lang);
      // Prepare validation data needs to validate.
      const validationData = {
        farmId,
      };
      // Validate data
      const validation = validate(validationData, getFeedListRules);
      // Return error of validation failed
      if (validation.hasError) {
        return res.status(ResponseCodes.BAD_REQUEST).json({
          status: ResponseCodes.BAD_REQUEST,
          data: null,
          message: validation.errors,
          error: null,
        });
      }
      // Find the animal group
      const findFarm = await UserFarmDetails.findOne({
        where: {
          id: farmId,
          isDeleted: false,
          isActive: true,
        },
        attributes: ["id"],
      });
      // Animal group is not found
      if (!findFarm) {
        return res.status(ResponseCodes.BAD_REQUEST).json({
          status: ResponseCodes.BAD_REQUEST,
          data: null,
          message: req.__("FARM_NOT_FOUND"),
          error: null,
        });
      }
      const offset = (page - 1) * limit;
      let whereConditionQuery = `WHERE "farmId" = :farmId
          AND "isDeleted" = false
          AND "isActive" = true`;
      let replacementForPagination = {
        farmId: farmId,
      };
      let replacementForQuery = {
        lang: lang,
        farmId: farmId,
        limit: limit,
        offset: offset,
      };
      if (search) {
        if (lang === "en") {
          whereConditionQuery =
            whereConditionQuery +
            ` AND "productNameEnglish" ilike '%' || :search || '%' `;
          replacementForPagination.search = search;
          replacementForQuery.search = search;
        } else if (lang === "ar") {
          whereConditionQuery =
            whereConditionQuery +
            ` AND "productNameArabic" ilike '%' || :search || '%' `;
          replacementForPagination.search = search;
          replacementForQuery.search = search;
        }
      }
      //same condition for type as well
      if (type) {
        if (lang === "en") {
          whereConditionQuery =
            whereConditionQuery +
            ` AND "productCategoryEnglish" ilike '%' || :type || '%' `;
          replacementForPagination.type = type;
          replacementForQuery.type = type;
        } else if (lang === "ar") {
          whereConditionQuery =
            whereConditionQuery +
            ` AND "productCategoryArabic" ilike '%' || :type || '%' `;
          replacementForPagination.type = type;
          replacementForQuery.type = type;
        }
      }
      const paginationSelectQuery = `SELECT COUNT(*) as total_count
          FROM farm_product_inventory`;
      const paginationQuery = `${paginationSelectQuery} ${whereConditionQuery}`;
      // First query to get total count
      const [{ total_count }] = await sequelize.query(paginationQuery, {
        replacements: replacementForPagination,
        type: sequelize.QueryTypes.SELECT,
      });
      const selectQuery = `SELECT
              id,
              "farmId",
              "productId",
              CASE
                  WHEN :lang = 'ar' THEN COALESCE("productNameArabic", "productNameEnglish")
                  ELSE COALESCE("productNameEnglish", "productNameArabic")
              END as "productName",
              CASE
                  WHEN :lang = 'ar' THEN COALESCE("productCategoryArabic", "productCategoryEnglish")
                  ELSE COALESCE("productCategoryEnglish", "productCategoryArabic")
              END as "productCategory",
              CASE
              WHEN :lang = 'ar' THEN COALESCE("descriptionArabic", "descriptionEnglish")
                  ELSE COALESCE("descriptionEnglish", "descriptionArabic")
                  END as "description",
              "productImageUrl",
              "feedInKg",
              "feedCostPerKg",
              "feedCost",
              "supplier",
              "avgCostPerKg",
              "avgCost",
              "availableStockInKg",
              "weeklyUsage",
              "reorderFlag"
          FROM farm_product_inventory `;
      const orderByClause = `ORDER BY "createdAt" DESC`;
      const limitOffsetClause = `LIMIT :limit OFFSET :offset;`;
      const query = `${selectQuery} ${whereConditionQuery} ${orderByClause} ${limitOffsetClause}`;
      // Main query with pagination
      const data = await sequelize.query(query, {
        replacements: replacementForQuery,
        type: sequelize.QueryTypes.SELECT,
      });
      const totalPages = Math.ceil(total_count / limit);
      return res.status(ResponseCodes.OK).json({
        status: ResponseCodes.OK,
        data: data,
        pagination: {
          total: parseInt(total_count),
          totalPages,
          currentPage: page,
          limit,
        },
      });
    } catch (error) {
      return res
        .status(ResponseCodes.SERVER_ERROR)
        .json({ status: ResponseCodes.SERVER_ERROR, error: error.message });
    }
  },

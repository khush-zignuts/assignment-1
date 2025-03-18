const { search } = require("./src/routes/admin/categoryRoutes")

npm init -y
npm install express
npm install sequelize mysql2  # For MySQL  
npm install sequelize pg pg-hstore  # For PostgreSQL  
npm install jsonwebtoken
npm install cors
npm install dotenv
npm install express-validator
npx nodemon server.js


npm install express sequelize pg pg-hstore bcrypt jsonwebtoken dotenv i18next i18next-fs-backend i18next-http-middleware cors body-parser


#Bhavnagar 



listingCategorys: async (req, res) => {
    const { t } = req; // Get translation function from middleware
    try {
      // const { categoryname } = req.query;
      // console.log("categoryName: ", categoryname);

      // Get search parameter (if provided) and language from headers
      // const search = req.query || "";
      // console.log('search: ', search);

      const categoryname = req.query.categoryname || "";
      console.log("categoryname: ", categoryname);

      const lang = req.headers.lang ? req.headers.lang : "en";
      console.log("lang: ", lang);

      //initialize localization
      // req.setLocale(lang);
      if (req.i18n && req.i18n.changeLanguage) {
        req.i18n.changeLanguage(lang);
      }

      let { page, size } = req.query;

      // // Convert query params to numbers and set defaults
      page = Number(page) || 1; // Default to page 1
      size = Number(size) || 10; // Default page size 10

      // // Calculate offset
      const offset = (page - 1) * size;
      const limit = size;

      // // Query MasterCategoryTrans using search on name and filtering by language and isDeleted flag
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
        limit,
        offset,
        order: [["created_at", "DESC"]],
      });

      console.log("categoriesData: ", categoriesData);
      if (!categoriesData || categoriesData.count === 0) {
        return res.status(404).json({
          message: t("api.categories.notFound") || "No categories found",
        });
      }

      // Format the result as desired
      const data = categoriesData.rows.map(category => ({
        id: category.id,
        name: category.name,
        isActive: category.isActive,
        subcategory: category.subcategories.map(sub => ({
          id: sub.id,
          name: sub.name,
          isActive: sub.isActive,
        })),
      }));
      return res.status(200).json({
        message: t("api.categories.listSuccess") || "Categories listed successfully",
        data,
        totalCategories: categoriesData.count,
        totalPages: Math.ceil(categoriesData.count / size),
        currentPage: page,
      });

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


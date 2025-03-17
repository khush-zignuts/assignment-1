// const User = require("../../models/User");
 
// const { Category, Subcategory } = require("../../models");
// const { Op } = require("sequelize");

// module.exports = {
//   addCategory: async (req, res) => {
//     const { t } = req; // Get translation function
//     try {
//       let { name_en, name_de } = req.body;
      
//       // Validate input
//       if (!name_en || !name_de) {
//         return res
//           .status(400)
//           .json({ message: t("api.categories.nameRequired") });
//       }

//       // Convert to lowercase for case-insensitive uniqueness check
//       const existingCategory = await Category.findOne({
//         where: { name_en: name_en.toLowerCase() },
//       });
//       if (existingCategory) {
//         return res
//           .status(400)
//           .json({ message: t("api.categories.alreadyExists") });
//       }

//       // Create Category
//       const category = await Category.create({
//         name_en: name_en.toLowerCase(),
//         name_de: name_de.toLowerCase(),
//       });
//       return res
//         .status(201)
//         .json({ message: t("api.categories.addSuccess"), category });
//     } catch (error) {
//       console.error(error);
//       return res
//         .status(500)
//         .json({ message: t("api.errors.serverError"), error });
//     }
//   },
//   addSubcategory: async (req, res) => {
//     const { t } = req; // Get translation function
//     try {
//       let { categoryId, name_en, name_de } = req.body;
//       console.log("req.body: ", req.body);

//       if (!categoryId || !name_en || !name_de) {
//         return res
//           .status(400)
//           .json({ message: t("api.subcategories.allFieldsRequired") });
//       }

//       // Check if category exists
//       const category = await Category.findOne({ where: { id: categoryId } });
//       if (!category) {
//         return res.status(404).json({ message: t("api.categories.notFound") });
//       }

//       // Check for uniqueness
//       const existingSubcategory = await Subcategory.findOne({
//         where: { name_en: name_en.toLowerCase(), categoryId },
//       });
//       if (existingSubcategory) {
//         return res
//           .status(400)
//           .json({ message: t("api.subcategories.alreadyExists") });
//       }

//       // // Create Subcategory
//       const subcategory = await Subcategory.create({
//         categoryId,
//         name_en: name_en.toLowerCase(),
//         name_de: name_de.toLowerCase(),
//       });
//       return res
//         .status(201)
//         .json({ message: t("api.subcategories.addSuccess"), Subcategory });
//     } catch (error) {
//       console.error(error);
//       return res
//         .status(500)
//         .json({ message: t("api.errors.serverError"), error });
//     }
//   },
 
// };

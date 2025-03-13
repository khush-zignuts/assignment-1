const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const { Category, Subcategory } = require("../models");
const { Op } = require("sequelize");

module.exports = {
  // signup: async (req, res) => {
  //   const { t } = req; // Get translation function
  //   try {
  //     const { name, email, password } = req.body;
  //     console.log("req.body: ", req.body);

  //     // Check if email exists in Admin or User table
  //     const existingAdmin = await Admin.findOne({ where: { email } });
  //     const existingUser = await User.findOne({ where: { email } });

  //     if (existingAdmin || existingUser) {
  //         return res.status(400).json({ message:  t("api.auth.signup.emailExists")  });
  //     }

  //     const salt = await bcrypt.genSalt(10);
  //     const hashedPassword = await bcrypt.hash(password, salt);

  //     const newUser = await Admin.create({
  //       name,
  //       email,
  //       password: hashedPassword,
  //     });
  //     // res.status(201).json({ message: t("signup_success"), user: newUser });
  //     res
  //       .status(201)
  //       .json({ message: t("api.auth.signup.success"), user: newUser });
  //   } catch (error) {
  //     console.log(error);
  //     res.status(500).json({ message: t("api.errors.serverError"), error });
  //   }
  // },

  login: async (req, res) => {
    const { t } = req;
    try {
      const { email, password } = req.body;
      console.log(" req.body: ", req.body);

      // Validate input
      if (!email || !password) {
        return res
          .status(400)
          .json({
            message:
              t("api.auth.login.missingFields") ||
              "Email and password are required.",
          });
      }

      const admin = await Admin.findOne({ where: { email } });

      // Check if admin exists
      if (!admin) {
        return res
          .status(401)
          .json({ message: t("api.auth.login.invalidCredentials") });
      }
      console.log("admin:", admin.toJSON());

      const isPasswordCorrect = await bcrypt.compare(password, admin.password);

      if (!isPasswordCorrect) {
        return res
          .status(401)
          .json({ message: t("api.auth.login.invalidCredentials") });
      }
      const payload = {
        id: admin.id,
        email: email
      };

      const token = jwt.sign(payload, process.env.SECRET_KEY, {
        expiresIn: "10d",
      });

      //  Save the access token in the database
      admin.accessToken = token;
      await admin.save(); // ✅ Fixed: Now correctly updating instance

      res.json({ message: t("api.auth.login.success"), token });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ message: t("api.errors.serverError"), error });
    }
  },
  deleteUser: async (req, res) => {
    try {
      const { userId } = req.params; // Get user ID from request param
      console.log('req.params: ', req.params);

      // Check if user exists and is not deleted
      const user = await User.findOne({
        where: {
          id: userId,
          isDeleted: false,
        },
      });

      if (!user) {
        return res
          .status(404)
          .json({ message: "api.auth.delete.usernotFound" });
      }

      // Delete user token
      await User.update(
        { accessToken: null, isDeleted: true, deleted_at: new Date() }, // Clear token
        { where: { id: userId } }
      );

      //   delete user
      // await User.destroy({ where: { id: userId } });

      return res.status(200).json({ message: "api.auth.delete.successDelete" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "api.errors.serverError" });
    }
  },
  addCategory: async (req, res) => {
    const { t } = req; // Get translation function
    try {
      let { name_en, name_de } = req.body;

      // // For using in controller:
      // //get headers from request
      // const lang = req.headers.lang ? req.headers.lang : "en";

      // //initialize localization
      // req.setLocale(lang);
      // // Response
      // return res.status(ResponseCodes.SERVER_ERROR).json({
      //   status: ResponseCodes.SERVER_ERROR,
      //   data: null,
      //   message: req.__("ERROR_UPLOADING_FILE"),
      //   error,
      // });

      // Validate input
      if (!name_en || !name_de) {
        return res
          .status(400)
          .json({ message: t("api.categories.nameRequired") });
      }

      // Convert to lowercase for case-insensitive uniqueness check
      const existingCategory = await Category.findOne({
        where: { name_en: name_en.toLowerCase() },
      });
      if (existingCategory) {
        return res
          .status(400)
          .json({ message: t("api.categories.alreadyExists") });
      }

      // Create Category
      const category = await Category.create({
        name_en: name_en.toLowerCase(),
        name_de: name_de.toLowerCase(),
      });
      return res
        .status(201)
        .json({ message: t("api.categories.addSuccess"), category });
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

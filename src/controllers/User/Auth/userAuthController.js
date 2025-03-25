const User = require("../../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Admin = require("../../models/Admin");
const Validator = require("validatorjs");
const { STATUS_CODES } = require("../../../config/constants");
const { VALIDATION_RULES } = require("../../../config/validationRules");

const i18n = require("../../config/i18n");

const validateRequest = (data, rules, res) => {
  const validation = new Validator(data, rules);
  if (validation.fails()) {
    res
      .status(STATUS_CODES.BAD_REQUEST)
      .json({ message: validation.errors.all() });
    return false;
  }
  return true;
};

module.exports = {
  signup: async (req, res) => {
    // const { t } = req; // Get translation function
    try {
      if (!validateRequest(req.body, VALIDATION_RULES.USER, res)) return;

      const { name, email, password, country_id, city_id, companyName } =
        req.body;
      // console.log("req.body: ", req.body);

      const existingUser = await User.findOne({ where: { email } });
      const existingAdmin = await Admin.findOne({ where: { email } });

      if (existingUser || existingAdmin) {
        return res
          .status(400)
          .json({ message: i18n.__("api.auth.signup.emailExists") });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = await User.create({
        name,
        email,
        password: hashedPassword,
        country_id,
        city_id,
        companyName,
      });
      // res.status(201).json({ message: i18n.__("signup_success"), user: newUser });
      res
        .status(201)
        .json({ message: i18n.__("api.auth.signup.success"), user: newUser });
    } catch (error) {
      console.log(error.message);
      res
        .status(500)
        .json({ message: i18n.__("api.errors.serverError"), error });
    }
  },

  login: async (req, res) => {
    // const { t } = req;
    try {
      if (!validateRequest(req.body, VALIDATION_RULES.USER, res)) return;
      const { email, password } = req.body;
      // console.log(" req.body: ", req.body);

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          message:
            i18n.__("api.auth.login.missingFields") ||
            "Email and password are required.",
        });
      }

      const user = await User.findOne({ where: { email } });
      // console.log("user: ", user);

      const isPasswordCorrect = await bcrypt.compare(password, user.password);

      if (!isPasswordCorrect) {
        return res
          .status(401)
          .json({ message: i18n.__("api.auth.login.invalidCredentials") });
        // return res.status(401).json({ message: i18n.__("invalid_credentials") });
      }

      const token = jwt.sign({ id: user.id }, process.env.SECRET_KEY, {
        expiresIn: "1d",
      });

      user.accessToken = token;
      await user.save(); // ✅ Fixed: Now correctly updating instance

      res.json({ message: i18n.__("api.auth.login.success"), token });
    } catch (error) {
      console.log(error.message);
      res
        .status(500)
        .json({ message: i18n.__("api.errors.serverError"), error });
    }
  },

  logout: async (req, res) => {
    try {
      if (!validateRequest(req.body, VALIDATION_RULES.USER, res)) return;
      const { userId } = req.params; // Assuming userId is passed in request body

      if (!userId) {
        return res
          .status(400)
          .json({ message: i18n.__("api.auth.logout.invalidCredentials") });
      }

      // Find user by ID
      const user = await User.findOne({ where: { id: userId } });

      if (!user) {
        return res
          .status(404)
          .json({ message: i18n.__("api.auth.logout.invalidCredentials") });
      }
      // Set accessToken to NULL (logout)
      await User.update({ accessToken: null }, { where: { id: userId } });

      return res
        .status(200)
        .json({ message: i18n.__("api.auth.logout.success") });
    } catch (error) {
      console.error("Logout error:", error);
      return res
        .status(500)
        .json({ message: i18n.__("api.errors.serverError") });
    }
  },

  EditUser: async (req, res) => {
    try {
      if (!validateRequest(req.body, VALIDATION_RULES.USER, res)) return;
      const userId = req.user.id; // Assuming user ID is available in req.user

      // Validate input lengths
      // if (name && name.length > 30) {
      //   return res.status(400).json({ message: 'Name should not exceed 30 characters.' });
      // }
      // if (companyName && companyName.length > 64) {
      //   return res.status(400).json({ message: 'Company name should not exceed 64 characters.' });
      // }

      // Find the user by ID

      const user = await User.findOne({
        where: { id: userId },
        // attributes: ["id"],
      });
      if (!user) {
        return res
          .status(STATUS_CODES.NOT_FOUND)
          .json({ message: i18n.__("api.auth.editUser.userNotFound") });
      }

      const { name, password, country_id, city_id, companyName } = req.body;

      // Check if the user is deleted or inactive
      if (user.isDeleted) {
        return res.status(403).json({ message: "User account is deleted." });
      }
      if (!user.isActive) {
        return res.status(403).json({ message: "User account is inactive." });
      }

      // Update fields
      if (name) user.name = name;
      if (country_id) user.country_id = country_id;
      if (city_id) user.city_id = city_id;
      if (companyName) user.companyName = companyName;

      // Update password if provided
      if (password) {
        user.password = await bcrypt.hash(password, 10);
      }

      // Save the updated user
      await user.save();

      res
        .status(STATUS_CODES.SUCCESS)
        .json({ message: i18n.__("api.auth.editUser.profileUpdated"), user });
    } catch (error) {
      console.error("Error updating profile:", error);
      res
        .status(STATUS_CODES.UNAUTHORIZED)
        .json({ message: i18n.__("api.errors.serverError"), error });
    }
  },
};

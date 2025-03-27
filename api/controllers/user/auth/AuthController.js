const User = require("../../../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Admin = require("../../../models/Admin");
const Validator = require("validatorjs");
const { HTTP_STATUS_CODES } = require("../../../config/constants");
const { VALIDATION_RULES } = require("../../../config/validationRules");

const i18n = require("../../../config/i18n");

const validateRequest = (data, rules, res) => {
  const validation = new Validator(data, rules);
  if (validation.fails()) {
    res
      .status(HTTP_STATUS_CODES.BAD_REQUEST)
      .json({ message: validation.errors.all() });
    return false;
  }
  return true;
};

module.exports = {
  signup: async (req, res) => {
    try {
      if (!validateRequest(req.body, VALIDATION_RULES.USER, res)) return;

      const { name, email, password, country_id, city_id, companyName } =
        req.body;

      const existingUser = await User.findOne({
        where: { email },
        attributes: ["id"],
      });
      const existingAdmin = await Admin.findOne({
        where: { email },
        attributes: ["id"],
      });

      if (existingUser || existingAdmin) {
        return res.json({
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          message: i18n.__("api.auth.signup.emailExists"),
          data: null,
          error: null,
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newuser = await User.create({
        name,
        email,
        password: hashedPassword,
        country_id,
        city_id,
        companyName,
        createdAt: Math.floor(Date.now() / 1000), // Store the current timestamp
        created_by: req.body ? req.body.name : "System", // User who performed the creation
        isActive: true,
      });

      // Create a response object with only the selected fields
      const responseUser = {
        id: newuser.id,
        name: newuser.name,
        email: newuser.email,
        gender: newuser.gender,
        country: newuser.country,
        city: newuser.city,
        companyName: newuser.companyName,
      };
      res.json({
        status: HTTP_STATUS_CODES.CREATED,
        message: i18n.__("api.auth.signup.OK"),
        data: responseUser,
        error: null,
      });
    } catch (error) {
      console.log(error.message);
      res.json({
        status: HTTP_STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: null,
        error: error.message,
      });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.json({
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          message:
            i18n.__("api.auth.login.missingFields") ||
            "Email and password are required.",
          data: null,
          error: null,
        });
      }

      const user = await User.findOne({
        where: { email },
        attributes: [
          "id",
          "name",
          "email",
          "password",
          "gender",
          "city",
          "country",
          "companyName",
        ],
      });

      const isPasswordCorrect = await bcrypt.compare(password, user.password);

      if (!isPasswordCorrect) {
        return res.json({
          status: HTTP_STATUS_CODES.UNAUTHORIZED,
          message: i18n.__("api.auth.login.invalidCredentials"),
          data: null,
          error: null,
        });
      }

      const token = jwt.sign({ id: user.id }, process.env.SECRET_KEY, {
        expiresIn: "1d",
      });

      user.accessToken = token;
      await user.save(); // ✅ Fixed: Now correctly updating instance
      res.json({
        status: HTTP_STATUS_CODES.OK,
        message: i18n.__("api.auth.login.OK"),
        data: { token },
        error: null,
      });
    } catch (error) {
      console.log(error.message);
      res.json({
        status: HTTP_STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: null,
        error: error.message,
      });
    }
  },

  logout: async (req, res) => {
    try {
      const { userId } = req.params; // Assuming userId is passed in request body
      if (!userId) {
        return res.json({
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          message: i18n.__("api.auth.logout.invalidCredentials"),
          data: null,
          error: null,
        });
      }

      // Find user by ID
      const user = await User.findOne({
        where: { id: userId },
        attributes: [
          "id",
          "name",
          "email",
          "password",
          "gender",
          "city",
          "country",
          "companyName",
        ],
      });

      if (!user) {
        return res.json({
          status: HTTP_STATUS_CODES.NOT_FOUND,
          message: i18n.__("api.auth.logout.invalidCredentials"),
          data: null,
          error: null,
        });
      }
      if (user.accessToken === null) {
        return res.json({
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          message: "Already logged out",
          data: null,
          error: null,
        });
      }
      // Set accessToken to NULL (logout)
      await User.update(
        { accessToken: null, updatedAt: Math.floor(Date.now() / 1000) },
        { where: { id: userId } }
      );
      return res.json({
        status: HTTP_STATUS_CODES.OK,
        message: i18n.__("api.auth.logout.OK"),
        data: null,
        error: null,
      });
    } catch (error) {
      console.error("Logout error:", error);
      return res.json({
        status: HTTP_STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: null,
        error: error.message,
      });
    }
  },

  EditUser: async (req, res) => {
    try {
      const { userId, name, password, country_id, city_id, companyName } =
        req.body;

      const user = await User.findOne({
        where: { id: userId },
        attributes: [
          "id",
          "name",
          "email",
          "password",
          "gender",
          "city",
          "country",
          "companyName",
        ],
      });

      if (!user) {
        return res.json({
          status: HTTP_STATUS_CODES.NOT_FOUND,
          message: i18n.__("api.auth.editUser.userNotFound"),
          data: null,
          error: null,
        });
      }
      // Check if the user is deleted or inactive
      if (user.isDeleted) {
        return res.json({
          status: HTTP_STATUS_CODES.FORBIDDEN,
          message: "User deleted",
          data: null,
          error: null,
        });
      }

      if (!user.isActive) {
        return res.json({
          status: HTTP_STATUS_CODES.FORBIDDEN,
          message: "User inactive",
          data: null,
          error: null,
        });
      }

      // Update fields
      if (name) user.name = name;
      if (country_id) user.country_id = country_id;
      if (city_id) user.city_id = city_id;
      if (companyName) user.companyName = companyName;

      // Store the current timestamp and user who performed the update
      user.updatedAt = Math.floor(Date.now() / 1000);
      user.updated_by = req.body ? req.body.name : "System";

      // Update password if provided
      if (password) {
        user.password = await bcrypt.hash(password, 10);
      }

      // Save the updated user
      await user.save();

      const updatedUser = {
        userId: user.id,
        name: user.name,
        password: user.password, // ⚠️ Consider omitting this for security reasons
        gender: user.gender,
        country: user.country,
        city: user.city,
        companyName: user.companyName,
        updatedAt: Math.floor(Date.now() / 1000),
        updated_by: req.user ? req.user.name : "System", // User who performed the update
      };
      res.json({
        status: HTTP_STATUS_CODES.OK,
        message: i18n.__("api.auth.editUser.profileUpdated"),
        data: updatedUser,
        error: null,
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.json({
        status: HTTP_STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: null,
        error: error.message,
      });
    }
  },
};

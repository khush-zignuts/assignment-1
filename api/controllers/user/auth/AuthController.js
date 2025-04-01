const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Admin = require("../../../models/Admin");
const {
  HTTP_STATUS_CODES,
  TOKEN_EXPIRY,
  uuid,
} = require("../../../config/constants");
const { VALIDATION_RULES } = require("../../../config/validationRules");
const VALIDATOR = require("validatorjs");
const i18n = require("../../../config/i18n");
const User = require("../../../models/User");
const { createdBy, updatedBy } = require("../../../models/CommonField");

module.exports = {
  signup: async (req, res) => {
    try {
      const { name, email, password, countryId, cityId, companyName } =
        req.body;

      const validation = new VALIDATOR(req.body, {
        name: VALIDATION_RULES.USER.name,
        email: VALIDATION_RULES.USER.email,
        password: VALIDATION_RULES.USER.password,
        countryId: VALIDATION_RULES.USER.countryId,
        cityId: VALIDATION_RULES.USER.cityId,
        companyName: VALIDATION_RULES.USER.companyName,
      });

      if (validation.fails()) {
        return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          message: "Validation failed.",
          data: "",
          error: validation.errors.all(),
        });
      }

      const existingUser = await User.findOne({
        where: { email, isDeleted: false },
        attributes: ["id"],
        //isdeleted
      });
      const existingAdmin = await Admin.findOne({
        where: { email, isDeleted: false },
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

      const userId = uuid; // Generate unique ID

      const newuser = await User.create({
        id: userId,
        name,
        email,
        password: hashedPassword,
        countryId,
        cityId,
        companyName,
        createdAt: Math.floor(Date.now() / 1000),
        createdBy: userId,
        isActive: true,
      });

      res.json({
        status: HTTP_STATUS_CODES.CREATED,
        message: i18n.__("api.auth.signup.OK"),
        data: { id: newuser.id, email: newuser.email },
        error: "",
      });
    } catch (error) {
      console.log(error.message);
      res.json({
        status: HTTP_STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: "",
        error: error.message,
      });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      const validation = new VALIDATOR(req.body, {
        email: VALIDATION_RULES.USER.email,
        password: VALIDATION_RULES.USER.password,
      });

      if (validation.fails()) {
        return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          message: "Validation failed.",
          data: "",
          error: validation.errors.all(),
        });
      }
      const user = await User.findOne({
        where: { email, isDeleted: false },
        attributes: ["id", "name", "email", "password"],
      });

      // Check if admin exists
      if (!user) {
        return res.status(HTTP_STATUS_CODES.UNAUTHORIZED).json({
          status: HTTP_STATUS_CODES.UNAUTHORIZED,
          message: i18n.__("api.auth.login.invalidCredentials"),
          data: "",
          error: "",
        });
      }
      const isPasswordCorrect = await bcrypt.compare(password, user.password);

      if (!isPasswordCorrect) {
        return res.json({
          status: HTTP_STATUS_CODES.UNAUTHORIZED,
          message: i18n.__("api.auth.login.invalidCredentials"),
          data: "",
          error: "",
        });
      }

      const token = jwt.sign({ id: user.id }, process.env.SECRET_KEY, {
        expiresIn: TOKEN_EXPIRY.ACCESS_TOKEN,
      });

      user.accessToken = token;
      await user.save();
      res.json({
        status: HTTP_STATUS_CODES.OK,
        message: i18n.__("api.auth.login.OK"),
        data: { token },
        error: "",
      });
    } catch (error) {
      console.error("Login error:", error);
      res.json({
        status: HTTP_STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: "",
        error: error.message,
      });
    }
  },

  logout: async (req, res) => {
    try {
      const { userId } = req.params;

      const user = await User.findOne({
        where: { id: userId, isDeleted: false },
        attributes: ["id", "name"],
      });

      if (!user) {
        return res.json({
          status: HTTP_STATUS_CODES.NOT_FOUND,
          message: i18n.__("api.auth.logout.invalidCredentials"),
          data: "",
          error: "",
        });
      }
      if (user.accessToken === null) {
        return res.json({
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          message: "Already logged out",
          data: "",
          error: "",
        });
      }
      // Set accessToken to NULL (logout)
      await User.update(
        {
          accessToken: null,
          updatedAt: Math.floor(Date.now() / 1000),
          updatedBy: userId,
        },
        { where: { id: userId, isDeleted: false } }
      );
      return res.json({
        status: HTTP_STATUS_CODES.OK,
        message: i18n.__("api.auth.logout.OK"),
        data: "",
        error: "",
      });
    } catch (error) {
      console.error("Logout error:", error);
      return res.json({
        status: HTTP_STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: "",
        error: error.message,
      });
    }
  },

  editProfile: async (req, res) => {
    try {
      const { userId, name, countryId, cityId, companyName } = req.body;

      //validate all

      const user = await User.findOne({
        where: { id: userId, isDeleted: false },
        attributes: ["id", "name", "email", "isActive"],
      });

      if (!user) {
        return res.json({
          status: HTTP_STATUS_CODES.NOT_FOUND,
          message: i18n.__("api.auth.editUser.userNotFound"),
          data: "",
          error: "",
        });
      }

      if (user.isDeleted) {
        return res.json({
          status: HTTP_STATUS_CODES.FORBIDDEN,
          message: "User deleted",
          data: "",
          error: "",
        });
      }

      if (!user.isActive) {
        return res.json({
          status: HTTP_STATUS_CODES.FORBIDDEN,
          message: "User inactive",
          data: "",
          error: "",
        });
      }

      // Update fields
      if (name) user.name = name;
      if (countryId) user.countryId = countryId;
      if (cityId) user.cityId = cityId;
      if (companyName) user.companyName = companyName;

      // Store the current timestamp and user who performed the update
      user.updatedAt = Math.floor(Date.now() / 1000);
      user.updatedBy = userId;

      // Save the updated user
      await user.save();

      res.json({
        status: HTTP_STATUS_CODES.OK,
        message: i18n.__("api.auth.editUser.profileUpdated"),
        data: { id: userId },
        error: "",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.json({
        status: HTTP_STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: "",
        error: error.message,
      });
    }
  },
  getProfile: async (req, res) => {
    try {
      const { userId } = req.params;

      // Fetch user details
      const user = await User.findOne({
        where: { id: userId, isDeleted: false },
        attributes: [
          "id",
          "name",
          "email",
          "countryId",
          "cityId",
          "companyName",
          "isActive",
        ],
      });

      if (!user) {
        return res.json({
          status: HTTP_STATUS_CODES.NOT_FOUND,
          message: i18n.__("api.auth.getUser.userNotFound"),
          data: "",
          error: "",
        });
      }

      if (user.isDeleted) {
        return res.json({
          status: HTTP_STATUS_CODES.FORBIDDEN,
          message: "User deleted",
          data: "",
          error: "",
        });
      }

      if (!user.isActive) {
        return res.json({
          status: HTTP_STATUS_CODES.FORBIDDEN,
          message: "User inactive",
          data: "",
          error: "",
        });
      }
      const showUser = {
        id: userId,
        name: user.name,
        email: user.email,
        countryId: user.countryId,
        cityId: user.cityId,
        companyName: user.companyName,
        isActive: user.isActive,
      };

      res.json({
        status: HTTP_STATUS_CODES.OK,
        message: i18n.__("api.auth.getUser.profileFetched"),
        data: { showUser },
        error: "",
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.json({
        status: HTTP_STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: "",
        error: error.message,
      });
    }
  },
};

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Admin = require("../../../models/Admin");
const i18n = require("../../../config/i18n");
const {
  HTTP_STATUS_CODES,
  TOKEN_EXPIRY,
} = require("../../../config/constants");
const { VALIDATION_RULES } = require("../../../config/validationRules");
const VALIDATOR = require("validatorjs");

module.exports = {
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      const validation = new VALIDATOR(req.body, {
        email: VALIDATION_RULES.ADMIN.email,
        password: VALIDATION_RULES.ADMIN.password,
      });

      if (validation.fails()) {
        return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          message: "Validation failed.",
          data: "",
          error: validation.errors.all(),
        });
      }

      const admin = await Admin.findOne({
        where: { email },
        attributes: ["id", "email", "password"],
      });

      // Check if admin exists
      if (!admin) {
        return res.status(HTTP_STATUS_CODES.UNAUTHORIZED).json({
          status: HTTP_STATUS_CODES.UNAUTHORIZED,
          message: i18n.__("api.auth.login.invalidCredentials"),
          data: "",
          error: "",
        });
      }

      const isPasswordCorrect = await bcrypt.compare(password, admin.password);

      if (!isPasswordCorrect) {
        return res.status(HTTP_STATUS_CODES.UNAUTHORIZED).json({
          status: HTTP_STATUS_CODES.UNAUTHORIZED,
          message: i18n.__("api.auth.login.invalidCredentials"),
          data: "",
          error: "",
        });
      }

      const payload = {
        id: admin.id,
        email: email,
      };

      const token = jwt.sign(payload, process.env.SECRET_KEY, {
        expiresIn: TOKEN_EXPIRY.ACCESS_TOKEN,
      });

      //  Save the access token in the database
      admin.accessToken = token;
      await admin.save();

      return res.status(HTTP_STATUS_CODES.OK).json({
        status: HTTP_STATUS_CODES.OK,
        message: i18n.__("api.auth.login.success"),
        data: { token },
        error: "",
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(HTTP_STATUS_CODES.SERVER_ERROR).json({
        status: HTTP_STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: "",
        error: error.message,
      });
    }
  },

  logout: async (req, res) => {
    try {
      const { adminId } = req.params;

      const admin = await Admin.findOne({
        where: { id: adminId, isDeleted: false },
        attributes: ["id", "name"],
      });

      if (!admin) {
        return res.json({
          status: HTTP_STATUS_CODES.NOT_FOUND,
          message: i18n.__("api.auth.logout.invalidCredentials"),
          data: "",
          error: "",
        });
      }
      if (admin.accessToken === "") {
        return res.json({
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          message: "Already logged out",
          data: "",
          error: "",
        });
      }
      // Set accessToken to NULL (logout)
      await Admin.update(
        {
          accessToken: null,
          updatedAt: Math.floor(Date.now() / 1000),
          updatedBy: adminId,
        },
        { where: { id: adminId, isDeleted: false } }
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
};

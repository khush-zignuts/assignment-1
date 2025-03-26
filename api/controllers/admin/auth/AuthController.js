const User = require("../../../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Admin = require("../../../models/Admin");
const i18n = require("../../../config/i18n");
const { STATUS_CODES } = require("../../../config/constants");

module.exports = {
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      console.log("req.body: ", req.body);

      // Validate input
      if (!email || !password) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
          status: STATUS_CODES.BAD_REQUEST,
          message: i18n.__("api.auth.login.missingFields"),
          data: null,
          error: null,
        });
      }

      const admin = await Admin.findOne({
        where: { email },
        attributes: ["id", "name", "email", "password"],
      });

      // Check if admin exists
      if (!admin) {
        return res.status(STATUS_CODES.UNAUTHORIZED).json({
          status: STATUS_CODES.UNAUTHORIZED,
          message: i18n.__("api.auth.login.invalidCredentials"),
          data: null,
          error: null,
        });
      }

      const isPasswordCorrect = await bcrypt.compare(password, admin.password);

      if (!isPasswordCorrect) {
        return res.status(STATUS_CODES.UNAUTHORIZED).json({
          status: STATUS_CODES.UNAUTHORIZED,
          message: i18n.__("api.auth.login.invalidCredentials"),
          data: null,
          error: null,
        });
      }

      const payload = {
        id: admin.id,
        email: email,
      };

      const token = jwt.sign(payload, process.env.SECRET_KEY, {
        expiresIn: "10d",
      });

      //  Save the access token in the database
      admin.accessToken = token;
      await admin.save(); // ✅ Fixed: Now correctly updating instance

      return res.status(STATUS_CODES.SUCCESS).json({
        status: STATUS_CODES.SUCCESS,
        message: i18n.__("api.auth.login.success"),
        data: { token },
        error: null,
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(STATUS_CODES.SERVER_ERROR).json({
        status: STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: null,
        error: error.message,
      });
    }
  },
  deleteUser: async (req, res) => {
    try {
      const userId = req.params.userId; // Get user ID from request param

      // Check if user exists and is not deleted
      const user = await User.findOne({
        where: {
          id: userId,
          isDeleted: false,
        },
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
        return res.status(STATUS_CODES.NOT_FOUND).json({
          status: STATUS_CODES.NOT_FOUND,
          message: i18n.__("api.auth.delete.usernotFound"),
          data: null,
          error: null,
        });
      }

      // Delete user token
      await User.update(
        { accessToken: null, isDeleted: true, deleted_at: new Date() }, // Clear token
        { where: { id: userId } }
      );

      return res.status(STATUS_CODES.SUCCESS).json({
        status: STATUS_CODES.SUCCESS,
        message: i18n.__("api.auth.delete.successDelete"),
        data: { userId },
        error: null,
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      return res.status(STATUS_CODES.SERVER_ERROR).json({
        status: STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: null,
        error: error.message,
      });
    }
  },
};

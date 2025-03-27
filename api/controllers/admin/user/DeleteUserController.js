const User = require("../../../models/User");
const i18n = require("../../../config/i18n");
const { HTTP_STATUS_CODES } = require("../../../config/constants");
const { VALIDATION_RULES } = require("../../../config/validationRules");
const VALIDATOR = require("validatorjs");

module.exports = {
  deleteUser: async (req, res) => {
    try {    const adminId = req.admin.id;
      const userId = req.params.userId; // Get user ID from request param

      const validation = new VALIDATOR(req.params.userId, {
        userId: VALIDATION_RULES.ACCOUNT.userId,
      });

      if (validation.fails()) {
        return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          message: "Validation failed.",
          data: null,
          error: validation.errors.all(),
        });
      }

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
        return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({
          status: HTTP_STATUS_CODES.NOT_FOUND,
          message: i18n.__("api.auth.delete.usernotFound"),
          data: null,
          error: null,
        });
      }

      // Delete user token
      await User.update(
        {
          accessToken: null,
          isDeleted: true,
          deleted_at: Math.floor(Date.now() / 1000),
        }, // Clear token
        { where: { id: userId } }
      );

      return res.status(HTTP_STATUS_CODES.OK).json({
        status: HTTP_STATUS_CODES.OK,
        message: i18n.__("api.auth.delete.OKDelete"),
        data: { userId },
        error: null,
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      return res.status(HTTP_STATUS_CODES.SERVER_ERROR).json({
        status: HTTP_STATUS_CODES.SERVER_ERROR,
        message: i18n.__("api.errors.serverError"),
        data: null,
        error: error.message,
      });
    }
  },
};

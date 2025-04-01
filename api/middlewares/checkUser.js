require("dotenv").config();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const i18n = require("../config/i18n");
const { HTTP_STATUS_CODES } = require("../config/constants");

const checkUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.json({
        status: HTTP_STATUS_CODES.UNAUTHORIZED,
        message: i18n.__("api.errors.unauthorized"),
        data: "",
        error: "",
      });
    }
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.json({
        status: HTTP_STATUS_CODES.UNAUTHORIZED,
        message: i18n.__("Access denied. No token provided."),
        data: "",
        error: "",
      });
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    const user = await User.findOne({
      where: { id: decoded.id },
      attributes: ["id", "accessToken"],
    });

    if (!user) {
      return res.json({
        status: HTTP_STATUS_CODES.UNAUTHORIZED,
        message: i18n.__("api.errors.unauthorized"),
        data: "",
        error: "",
      });
    }

    if (user.accessToken !== token) {
      return res.json({
        status: HTTP_STATUS_CODES.UNAUTHORIZED,
        message: i18n.__(
          "api.errors.unauthorized" || "Invalid or expired token."
        ),
        data: "",
        error: "",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.json({
      status: HTTP_STATUS_CODES.UNAUTHORIZED,
      message: i18n.__("api.errors.unauthorized"),
      data: null,
      error: error.message,
    });
  }
};

module.exports = checkUser;

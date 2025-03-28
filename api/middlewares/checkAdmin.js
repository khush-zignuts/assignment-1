require("dotenv").config();
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const i18n = require("../config/i18n");
const { STATUS_CODES } = require("../config/constants");

const checkAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.json({
        status: STATUS_CODES.UNAUTHORIZED,
        message: i18n.__("api.errors.unauthorized"),
        data: null,
        error: null,
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.json({
        status: STATUS_CODES.UNAUTHORIZED,
        message: i18n.__("Access denied. No token provided."),
        data: null,
        error: null,
      });
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    const admin = await Admin.findOne({
      where: { id: decoded.id },
      attributes: ["id", "accessToken"],
    });

    if (!admin) {
      return res.json({
        status: STATUS_CODES.UNAUTHORIZED,
        message: i18n.__("api.errors.unauthorized"),
        data: null,
        error: null,
      });
    }

    if (admin.accessToken !== token) {
      return res.json({
        status: STATUS_CODES.UNAUTHORIZED,
        message: i18n.__(
          "api.errors.unauthorized" || "Invalid or expired token."
        ),
        data: null,
        error: null,
      });
    }

    // Set admin on request object
    req.admin = admin;

    next(); // Proceed if admin
  } catch (error) {
    return res.json({
      status: STATUS_CODES.UNAUTHORIZED,
      message: i18n.__("api.errors.unauthorized"),
      data: null,
      error: error.message,
    });
  }
};

module.exports = checkAdmin;

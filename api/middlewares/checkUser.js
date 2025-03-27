require("dotenv").config();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const i18n = require("../config/i18n");

const checkUser = async (req, res, next) => {
  // const { t } = req; // Get translation function
  try {
    const authHeader = req.headers.authorization;
    // console.log("authHeader: ", authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(HTTP_STATUS_CODES.UNAUTHORIZED)
        .json({ message: i18n.__("api.errors.unauthorized") });
    }

    const token = authHeader.split(" ")[1];
    // console.log("token: ", token);

    if (!token) {
      return res
        .status(HTTP_STATUS_CODES.UNAUTHORIZED)
        .json({ message: i18n.__("Access denied. No token provided.") });
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    console.log("decoded: ", decoded);

    const user = await User.findOne({
      where: { id: decoded.id },
      // attributes: ["id"],
    });
    // console.log("user: ", user);
    if (!user) {
      return res
        .status(401)
        .json({ message: i18n.__("api.errors.unauthorized") });
    }

    try {
      if (user.accessToken === token) {
        console.log("Token matches!");
      } else {
        console.log("Token does not match.");
      }
    } catch (error) {
      console.error({ message: i18n.__("api.errors.unauthorized") });
    }

    // // Set admin on request object
    req.user = user;

    next(); // Proceed if user
  } catch (error) {
    res.status(401).json({ message: i18n.__("api.errors.unauthorized") });
  }
};

module.exports = checkUser;

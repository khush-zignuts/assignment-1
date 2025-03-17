require("dotenv").config();
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const checkUser = async (req, res, next) => {
  const { t } = req; // Get translation function
  try {
    const authHeader = req.headers.authorization;
    console.log("authHeader: ", authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: t("api.errors.unauthorized") });
    }

    const token = authHeader.split(" ")[1];
    console.log("token: ", token);

    // const token = req.header("Authorization");
    // token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZmNjlkMTQ5LWFmODktNGNhOC1hZjBjLTBiYjc2YTNkMmE2NiIsImlhdCI6MTc0MTc1NDE2MywiZXhwIjoxNzQxODQwNTYzfQ.kvCRwXYk0Fkzzwu2yyZ9vgLatPMPspYOnJb3KuNbQm4";

    if (!token) {
      return res
        .status(401)
        .json({ message: t("Access denied. No token provided.") });
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    // req.user = decoded;
    console.log("req.user: ", req.user);

    const user = await User.findOne({
      where: { id: decoded.id },
      attributes: ["id"],
    });
    console.log("user: ", user);
    if (!user) {
      return res.status(401).json({ message: t("api.errors.unauthorized") });
    }

    try {
      if (accessToken === admin.Token) {
        console.log("Token matches!");
      } else {
        console.log("Token does not match.");
      }
    } catch (error) {
      console.error({ message: t("api.errors.unauthorized") });
    }
    
    // // Set admin on request object
    req.user = user;

    next(); // Proceed if user
  } catch (error) {
    res.status(401).json({ message: t("api.errors.unauthorized") });
  }
};

module.exports = checkUser;

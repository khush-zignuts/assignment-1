require("dotenv").config();
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const checkAdmin = async (req, res, next) => {
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
    // req.admin = decoded;
    console.log("req.admin: ", req.admin);

    const admin = await Admin.findOne({
      where: { id: decoded.id },
      attributes: ["id" , "accessedToken"],
    });
    console.log("admin: ", admin);
    if (!admin) {
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
    req.admin = admin;

    next(); // Proceed if admin
  } catch (error) {
    res.status(401).json({ message: t("api.errors.unauthorized") });
  }
};

module.exports = checkAdmin;

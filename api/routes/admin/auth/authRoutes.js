const express = require("express");
const {
  login,
  logout,
} = require("../../../controllers/admin/auth/AuthController");
const checkAdmin = require("../../../middlewares/checkAdmin");
const router = express.Router();

//auth User
router.post("/login", login);
router.post("/logout", checkAdmin, logout);

module.exports = router;

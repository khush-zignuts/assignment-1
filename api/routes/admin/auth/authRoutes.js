const express = require("express");
const { login } = require("../../../controllers/admin/auth/AuthController");
const router = express.Router();

//auth User
router.post("/login", login);

module.exports = router;

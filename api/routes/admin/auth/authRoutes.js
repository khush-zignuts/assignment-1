const express = require("express");
const {
  login,
  deleteUser,
} = require("../../../controllers/admin/auth/AuthController");
const router = express.Router();

//auth User
router.post("/login", login);

//delete user:
router.delete("/deleteUser/:userId", deleteUser);

module.exports = router;

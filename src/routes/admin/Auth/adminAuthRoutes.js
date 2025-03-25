const express = require("express");
const {
  signup,
  login,
  deleteUser,
} = require("../../../controllers/Admin/Auth/AdminAuthController");
const router = express.Router();

//auth User
router.post("/signup", signup);
router.post("/login", login);

//delete user:
router.delete("/deleteUser/:userId", deleteUser);

module.exports = router;

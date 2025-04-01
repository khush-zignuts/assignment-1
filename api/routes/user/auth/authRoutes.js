const express = require("express");
const {
  signup,
  login,
  logout,
  getProfile,
  editProfile,
} = require("../../../controllers/user/auth/AuthController");
const checkUser = require("../../../middlewares/checkUser");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", checkUser, logout);

router.post("/editProfile", checkUser, editProfile);

router.get("/getProfile/:userId", checkUser, getProfile);

module.exports = router;

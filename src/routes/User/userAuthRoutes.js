const express = require("express");
const {
  signup,
  login,
  logout,
  EditUser,
} = require("../../controllers/User/userAuthController");
const checkUser = require("../../middlewares/checkUser");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", checkUser, logout);

router.post("/editUser", checkUser, EditUser);



module.exports = router;

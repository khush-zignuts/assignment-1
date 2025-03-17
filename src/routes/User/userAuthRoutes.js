
const express = require("express");
const { signup, login ,logout  } = require("../../controllers/userController");
const checkUser = require("../../middlewares/checkAdmin")
const router = express.Router();


router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", checkUser ,logout);

module.exports = router;



// router.get("/dropdown-data", getDropdownData);


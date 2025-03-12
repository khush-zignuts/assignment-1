const express = require("express");
const {signup, login ,addCategory , addSubcategory } = require("../controllers/adminController");
const addcate = require("../controllers/adminController")
const router = express.Router();
const  checkAdmin  = require("../middlewares/checkAdmin"); // Middleware to check admin access 

router.post("/signup", signup);
router.post("/login", login);
router.post("/addCategory" ,checkAdmin, addCategory)
router.post("/addSubcategory" ,checkAdmin, addSubcategory)

module.exports = router;
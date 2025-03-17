const express = require("express");
const { addCategory , addSubcategory ,deleteCategory} = require("../../controllers/Admin/categoryController");
const router = express.Router();
const  checkAdmin  = require("../../middlewares/checkAdmin"); // Middleware to check admin access 
 


router.post("/addCategory" ,checkAdmin, addCategory)
router.post("/addSubcategory" ,checkAdmin, addSubcategory)
//deletion of category
router.post("/deleteCategory" , deleteCategory)

module.exports = router;
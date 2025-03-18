const express = require("express");
const { addCategory , addSubcategory ,deleteCategory , searchCategory} = require("../../controllers/Admin/categoryController");
const router = express.Router();
const  checkAdmin  = require("../../middlewares/checkAdmin"); // Middleware to check admin access 
 

//CRUD category
router.post("/addCategory" ,checkAdmin, addCategory)
router.post("/addSubcategory" ,checkAdmin, addSubcategory)

//deletion of category
router.post("/deleteCategory" , deleteCategory)

//search Category
router.post("/searchCategory" , searchCategory)


module.exports = router;
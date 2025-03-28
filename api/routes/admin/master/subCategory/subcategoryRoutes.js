const express = require("express");
const {
  addSubcategory,
  updateSubcategory,
  deleteSubcategory,
} = require("../../../../controllers/Admin/Master/Subcategory/SubcategoryController");
const router = express.Router();
const checkAdmin = require("../../../../middlewares/checkAdmin"); // Middleware to check admin access

//create category
router.post("/add", checkAdmin, addSubcategory);

//update category
router.post("/update", checkAdmin, updateSubcategory);

//deletion of category
// DELETE /api/subcategories/delete/:subCategoryId
router.delete("/delete/:subCategoryId", checkAdmin, deleteSubcategory);

module.exports = router;

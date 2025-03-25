const express = require("express");
const {
  addSubcategory,
  updateSubcategory,
  deleteSubcategory,
} = require("../../../controllers/Admin/Subcategory/subcategoryController");
const router = express.Router();
const checkAdmin = require("../../../../middlewares/checkAdmin"); // Middleware to check admin access

//create category
router.post("/addSubcategory", checkAdmin, addSubcategory);

//update category
router.post("/updateSubcategory", checkAdmin, updateSubcategory);

//deletion of category
// DELETE /api/subcategories/delete/:subCategoryId
router.delete(
  "/deleteSubcategory/:subCategoryId",
  checkAdmin,
  deleteSubcategory
);

module.exports = router;

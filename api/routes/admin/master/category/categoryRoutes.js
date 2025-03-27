const express = require("express");

const router = express.Router();
const checkAdmin = require("../../../../middlewares/checkAdmin"); // Middleware to check admin access
const {
  addCategory,
  updateCategory,
  deleteCategory,
  listingCategory,
} = require("../../../../controllers/admin/master/category/CategoryController");

//create category
router.post("/add", checkAdmin, addCategory);

//update category
router.post("/update", checkAdmin, updateCategory);

//deletion of category
// DELETE /api/categories/delete/:categoryId
router.delete("/delete/:categoryId", checkAdmin, deleteCategory);

//search Category
router.get("/listing", checkAdmin, listingCategory);

module.exports = router;

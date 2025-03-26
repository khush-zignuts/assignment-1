const express = require("express");
const {
  addCategory,
  updateCategory,
  deleteCategory,
  listingCategory,
} = require("../../../../controllers/Admin/master/Category/CategoryController");
const router = express.Router();
const checkAdmin = require("../../../../middlewares/checkAdmin"); // Middleware to check admin access

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

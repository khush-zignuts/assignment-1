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
router.post("/addCategory", checkAdmin, addCategory);

//update category
router.post("/updateCategory/:categoryId", checkAdmin, updateCategory);

//deletion of category
// DELETE /api/categories/delete/:categoryId
router.delete("/deleteCategory/:categoryId", checkAdmin, deleteCategory);

//search Category
router.get("/listingCategory", listingCategory);

module.exports = router;

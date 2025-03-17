
const User = require("./user");
const Admin = require("./admin");
const MasterCategory = require("./master_category");
const MasterCategoryTrans = require("./master_category_trans");
const MasterSubcategory = require("./master_subcategory")
const MasterSubcategoryTrans = require("./master_subcategory_trans");
const MasterCountry = require("./master_country");
const MasterCountryTrans = require("./master_country_trans");
const MasterAccount = require("./master_account");

// 1. User and MasterAccount (One-to-One)
User.hasOne(MasterAccount, { foreignKey: "userId", onDelete: "CASCADE" });
MasterAccount.belongsTo(User, { foreignKey: "userId" });

// 2. MasterCategory and MasterCategoryTrans (One-to-Many)
MasterCategory.hasMany(MasterCategoryTrans, {
  foreignKey: "master_category_id",
  onDelete: "CASCADE",
});
MasterCategoryTrans.belongsTo(MasterCategory, {
  foreignKey: "master_category_id",
});

// 3. MasterCategory and MasterSubcategory (One-to-Many)
MasterCategory.hasMany(MasterSubcategory, {
  foreignKey: "categoryId",
  onDelete: "CASCADE",
});
MasterSubcategory.belongsTo(MasterCategory, {
  foreignKey: "categoryId",
});

// 4. MasterSubcategory and MasterSubcategoryTrans (One-to-Many)
MasterSubcategory.hasMany(MasterSubcategoryTrans, {
  foreignKey: "master_subcategory_id",
  onDelete: "CASCADE",
});
MasterSubcategoryTrans.belongsTo(MasterSubcategory, {
  foreignKey: "master_subcategory_id",
});

// 5. MasterCountry and MasterCountryTrans (One-to-Many)
MasterCountry.hasMany(MasterCountryTrans, {
  foreignKey: "master_country_id",
  onDelete: "CASCADE",
});
MasterCountryTrans.belongsTo(MasterCountry, {
  foreignKey: "master_country_id",
});


module.exports = {
  User,
  Admin,
  MasterCategory,
  MasterCategoryTrans,
  MasterSubcategory,
  MasterSubcategoryTrans,
  MasterCountry,
  MasterCountryTrans,
  MasterAccount,
};

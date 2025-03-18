
const User = require("./User");
const Admin = require("./Admin");
const MasterCategory = require("./MasterCategory");
const MasterCategoryTrans = require("./MasterCategoryTrans");
const MasterSubcategory = require("./MasterSubcategory")
const MasterSubcategoryTrans = require("./MasterSubcategoryTrans");
const MasterCountry = require("./MasterCountry");
const MasterCountryTrans = require("./MasterCountryTrans");
const Account = require("./Account");

// 1. User and MasterAccount (One-to-One)
User.hasOne(Account, { foreignKey: "userId", onDelete: "CASCADE" });
Account.belongsTo(User, { foreignKey: "userId" });

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
  Account,
};

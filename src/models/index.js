const User = require("./User");
const Admin = require("./Admin");
const MasterCategory = require("./MasterCategory");
const MasterCategoryTrans = require("./MasterCategoryTrans");
const MasterSubcategory = require("./MasterSubcategory");
const MasterSubcategoryTrans = require("./MasterSubcategoryTrans");
const MasterCountry = require("./MasterCountry");
const MasterCountryTrans = require("./MasterCountryTrans");
const MasterCity = require("./MasterCity");
const MasterCityTrans = require("./MasterCityTrans");
const Account = require("./Account");
const AccountTrans = require("./AccountTrans");

// 1. User and MasterAccount (One-to-One)
User.hasMany(Account, { foreignKey: "userId", onDelete: "CASCADE" });
Account.belongsTo(User, { foreignKey: "userId" });

// AccountTrans.sync({ force: true, alter: true });

// 2. Account with AccountTrans
Account.hasOne(AccountTrans, { foreignKey: "Account_id", onDelete: "CASCADE" });
AccountTrans.belongsTo(Account, { foreignKey: "Account_id" });

// 3. Account with Category
MasterCategory.hasMany(Account, { foreignKey: "categoryId" }); // One category, many accounts
Account.belongsTo(MasterCategory, {
  foreignKey: "categoryId",
  onDelete: "CASCADE",
});

//4. Account belongs to a single SubCategory
MasterSubcategory.hasMany(Account, { foreignKey: "subcategoryId" }); // One subcategory, many accounts
Account.belongsTo(MasterSubcategory, {
  foreignKey: "subcategoryId",
  onDelete: "CASCADE",
});

// 5. MasterCategory and MasterCategoryTrans (One-to-Many)
MasterCategory.hasMany(MasterCategoryTrans, {
  foreignKey: "master_category_id",
  onDelete: "CASCADE",
});
MasterCategoryTrans.belongsTo(MasterCategory, {
  foreignKey: "master_category_id",
});

// 6. MasterCategory and MasterSubcategory (One-to-Many)
MasterCategory.hasMany(MasterSubcategory, {
  foreignKey: "categoryId",
  onDelete: "CASCADE",
});
MasterSubcategory.belongsTo(MasterCategory, {
  foreignKey: "categoryId",
});

// 7. MasterSubcategory and MasterSubcategoryTrans (One-to-Many)
MasterSubcategory.hasMany(MasterSubcategoryTrans, {
  foreignKey: "master_subcategory_id",
  onDelete: "CASCADE",
});
MasterSubcategoryTrans.belongsTo(MasterSubcategory, {
  foreignKey: "master_subcategory_id",
});

// MasterCountryTrans.sync({ force: true, alter: true });

// 8. MasterCountry and MasterCountryTrans (One-to-Many)
MasterCountry.hasMany(MasterCountryTrans, {
  foreignKey: "master_country_id",
  onDelete: "CASCADE",
});
MasterCountryTrans.belongsTo(MasterCountry, {
  foreignKey: "master_country_id",
});

// MasterCity.sync({ force: true, alter: true });

//  9. MasterCountry and MasterCity (One-to-Many)
MasterCountry.hasMany(MasterCity, {
  foreignKey: "countryId",
  onDelete: "CASCADE",
});
MasterCity.belongsTo(MasterCountry, {
  foreignKey: "countryId",
});

// MasterCityTrans.sync({ force: true, alter: true });

// 10. MasterCity and MasterCityTrans (One-to-Many)
MasterCity.hasMany(MasterCityTrans, {
  foreignKey: "master_city_id",
  onDelete: "CASCADE",
});
MasterCityTrans.belongsTo(MasterCity, {
  foreignKey: "master_city_id",
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
  MasterCity,
  MasterCityTrans,
  Account,
};

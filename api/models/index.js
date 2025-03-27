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
Account.hasOne(AccountTrans, { foreignKey: "accountId", onDelete: "CASCADE" });
AccountTrans.belongsTo(Account, { foreignKey: "accountId" });

// 3. Account with Category
MasterCategory.hasMany(Account, { foreignKey: "categoryId" }); // One category, many accounts
Account.belongsTo(MasterCategory, {
  foreignKey: "categoryId",
  onDelete: "CASCADE",
});

//4. Account belongs to a single SubCategory
MasterSubcategory.hasMany(Account, { foreignKey: "subCategoryId" }); // One subcategory, many accounts
Account.belongsTo(MasterSubcategory, {
  foreignKey: "subCategoryId",
  onDelete: "CASCADE",
});

// 5. MasterCategory and MasterCategoryTrans (One-to-Many)
MasterCategory.hasMany(MasterCategoryTrans, {
  foreignKey: "masterCategoryId",
  onDelete: "CASCADE",
});
MasterCategoryTrans.belongsTo(MasterCategory, {
  foreignKey: "masterCategoryId",
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
  foreignKey: "masterSubcategoryId",
  onDelete: "CASCADE",
});
MasterSubcategoryTrans.belongsTo(MasterSubcategory, {
  foreignKey: "masterSubcategoryId",
});

// MasterCountryTrans.sync({ force: true, alter: true });

// 8. MasterCountry and MasterCountryTrans (One-to-Many)
MasterCountry.hasMany(MasterCountryTrans, {
  foreignKey: "masterCountryId",
  onDelete: "CASCADE",
});
MasterCountryTrans.belongsTo(MasterCountry, {
  foreignKey: "masterCountryId",
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
  foreignKey: "masterCityId",
  onDelete: "CASCADE",
});
MasterCityTrans.belongsTo(MasterCity, {
  foreignKey: "masterCityId",
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

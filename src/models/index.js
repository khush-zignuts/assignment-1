const User = require("./User");
const Country = require("./Country");
const City = require("./City");
const Category = require("./Category");
const Subcategory = require("./Subcategory");
const Account = require("./Account");
const Admin = require("./Admin");
const commonFields = require("./commonFields");

// Relationships
Country.hasMany(City, { foreignKey: "countryId" });
City.belongsTo(Country, { foreignKey: "countryId" });

User.belongsTo(Country, { foreignKey: "countryId" });
User.belongsTo(City, { foreignKey: "cityId" });

Category.hasMany(Subcategory, { foreignKey: "categoryId" });
Subcategory.belongsTo(Category, { foreignKey: "categoryId" });

User.hasMany(Account, { foreignKey: "userId" });
Account.belongsTo(User, { foreignKey: "userId" });

Category.hasMany(Account, { foreignKey: "categoryId" });
Account.belongsTo(Category, { foreignKey: "categoryId" });

Subcategory.hasMany(Account, { foreignKey: "subcategoryId" });
Account.belongsTo(Subcategory, { foreignKey: "subcategoryId" });

module.exports = { User, Country, City, Category, Subcategory, Account , Admin};

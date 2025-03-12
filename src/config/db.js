const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    logging: false, 
    define: {
      timestamps: true // Automatically add createdAt & updatedAt fields
    } 
  }
);

// Test the database connection
(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Connected to PostgreSQL Database successfully!");
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error);
  }
})();

module.exports = sequelize;





// sequelize
//   .authenticate()
//   .then(() => console.log("Connected to PostgreSQL successfully!"))
//   .catch((err) => console.error("Database connection error:", err));

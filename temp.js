// npm init -y
// npm install express
// npm install sequelize mysql2  # For MySQL
// npm install sequelize pg pg-hstore  # For PostgreSQL
// npm install jsonwebtoken
// npm install cors
// npm install dotenv
// npm install express-validator
// npx nodemon server.js

// npm install express sequelize pg pg-hstore bcrypt jsonwebtoken dotenv i18next i18next-fs-backend i18next-http-middleware cors body-parser

// #Bhavnagar
const query = `
          SELECT 
          ms.id AS id
          FROM master_subcategory AS ms
          WHERE is_deleted = false
          AND ms.category_id =:categoryId
          `;

const subcategory = await sequelize.query(query, {
  replacements: { categoryId: categoryId },
  type: sequelize.QueryTypes.SELECT,
});

if (!subcategory.length) {
  return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({
    status: HTTP_STATUS_CODES.NOT_FOUND,
    message: "No subcategories found for this category.",
    data: null,
    error: null,
  });
}

const subcategoryIds = subcategory.map((sub) => sub.id);

const accountQuery = `
          SELECT id FROM account AS a
          WHERE is_deleted = false 
          AND a.subcategory_id = :subcategoryIds
      `;

const subcategoryInAccount = await sequelize.query(accountQuery, {
  replacements: { subcategoryIds },
  type: sequelize.QueryTypes.SELECT,
});

if (subcategoryInAccount.length > 0) {
  return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
    status: HTTP_STATUS_CODES.BAD_REQUEST,
    message: "Some subcategories exist in an account, deletion not allowed.",
    data: "",
    error: "",
  });
}

await MasterSubcategory.update(
  {
    isDeleted: true,
    deletedAt: Math.floor(Date.now() / 1000),
    deletedBy: adminId,
  },
  { where: { id: subcategoryIds } }
);

// **Update MasterSubcategoryTrans**
await MasterSubcategoryTrans.update(
  {
    isDeleted: true,
    deletedAt: Math.floor(Date.now() / 1000),
    deletedBy: adminId,
  },
  { where: { subcategory_id: subcategoryIds } }
);

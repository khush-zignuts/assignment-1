module.exports = {
  //? Validation Rules
  VALIDATION_RULES: {
    ACCOUNT: {
      userId: "required|string",
      categoryId: "required|string",
      subcategoryId: "required|string",
      description: "string|max:255|nullable",
      Account_id: "required|string",
      name: "required|string|min:1|max:128",
      lang: "required|string|min:2|max:10",
    },
    ADMIN: {
      name: "required|string|min:2|max:30",
      email: "required|email",
      password:
        "required|string|min:8|max:16|regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,16}$/",
      accessToken: "string|nullable",
    },
    USER: {
      name: "required|string|min:1|max:30",
      email: "required|email",
      password:
        "required|min:8|max:16|regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,16}$/",
      countryId: "required|string",
      cityId: "required|string",
      companyName: "string|min:0|max:64",
      accessToken: "string|nullable",
    },
    CATEGORY: {
      masterCategoryId: "required|string",
      categories: "required|array|min:1",
      "categories.*.name": "required|string|min:3|max:128",
      "categories.*.lang": "required|string|min: 2 |max:10",
    },
    CITY: {
      countryId: "required|string",
      masterCityId: "required|string",
      cities: "required|array|min:1",
      "cities.*.name": "required|string|min:3|max:128",
      "cities.*.lang": "required|string|min: 2 |max:10",
    },
    COUNTRY: {
      masterCountryId: "required|string",
      countries: "required|array|min:1",
      "countries.*.name": "required|string|min:3|max:128",
      "countries.*.lang": "required|string|min: 2 |max:10",
    },
    SUBCATEGORY: {
      categoryId: "required|string",
      masterSubcategoryId: "required|string",
      subcategories: "required|array|min:1",
      "subcategories.*.name": "required|string|min:3|max:128",
      "subcategories.*.lang": "required|string|min: 2 |max:10",
    },
  },
};

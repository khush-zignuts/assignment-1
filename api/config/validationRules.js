module.exports = {
  //? Validation Rules
  VALIDATION_RULES: {
    ACCOUNT: {
      userId: "required|uuid",
      categoryId: "required|uuid",
      subcategoryId: "required|uuid",
      description: "string|max:255|nullable",
      Account_id: "required|uuid",
      name: "required|string|min:1|max:128",
      lang: "required|string|min:2|max:10",
    },
    ADMIN: {
      id: "required|uuid",
      name: "required|string|min:2|max:30",
      email: "required|email|unique",
      password:
        "required|string|min:8|max:16|regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,16}$/",
      accessToken: "string|nullable",
    },
    USER: {
      name: "required|string|min:1|max:30",
      email: "required|email|unique",
      password:
        "required|min:8|max:16|regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,16}$/",
      country_id: "required|uuid",
      city_id: "required|uuid",
      companyName: "string|min:0|max:64",
      accessToken: "string|nullable",
    },
    CATEGORY: {
      id: "required|uuid",
      master_category_id: "required|uuid",
      name: "required|string|max:128",
      lang: "required|string|max:10",
    },
    CITY: {
      id: "required|uuid",
      countryId: "required|uuid",
      master_city_id: "required|uuid",
      name: "required|string|max:128",
      lang: "required|string|max:10",
    },
    COUNTRY: {
      id: "required|uuid",
      master_country_id: "required|uuid",
      name: "required|string|max:128",
      lang: "required|string|max:10",
    },
    SUBCATEGORY: {
      id: "required|uuid",
      categoryId: "required|uuid",
      master_subcategory_id: "required|uuid",
      name: "required|string|max:128",
      lang: "required|string|max:10",
    },
  },
};

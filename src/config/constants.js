module.exports = {
  //? HTTP Status Codes
  STATUS_CODES: {
    SUCCESS: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    SERVER_ERROR: 500,
  },
  //? Validation Rules
  VALIDATION_RULES: {
    ADMIN_SIGNUP: {
      name: "required|string|min:2|max:30",
      email: "required|email",
      password:
        "required|min:8|max:16|regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,16}$/",
    },
    USER_SIGNUP: {
      name: "required|string|min:2|max:30",
      email: "required|email",
      password:
        "required|min:8|max:16|regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,16}$/",
      companyName: "string|min:2|max:64",
    },
    LOGIN: {
      email: "required|email",
      password: "required|string|min:8",
    },
    ACCOUNT: {
      description: "requires | max:64",
    },
  },
};

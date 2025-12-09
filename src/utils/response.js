// utils/response.js

exports.success = (res, message = "Success", data = {}, code = 200) => {
  return res.status(code).json({
    success: true,
    message,
    data
  });
};

exports.error = (res, message = "Server error", error = null, code = 500) => {
  return res.status(code).json({
    success: false,
    message,
    error
  });
};

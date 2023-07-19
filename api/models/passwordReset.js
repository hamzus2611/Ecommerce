const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PasswordResetSchema = new Schema({
  userId: String,
  resetString: String,
  CreatedAt: Date,
  expiresAt: Date,
});
module.exports = mongoose.model("PasswordReset", PasswordResetSchema);

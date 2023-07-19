const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userVerficationSchema = new Schema({
  userId: String,
  uniqueString: String,
  CreatedAt: Date,
  expiresAt: Date,
});
module.exports = mongoose.model("UserVerfication", userVerficationSchema);

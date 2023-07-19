const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({

    FirstName: { type: String, required: true },
    LastName: { type: String, required: true },
    password: { type: String, required: true },
    Email: { type: String, required: true, unique: true },
    ContactTelephone: { type: String, required: true },
    DateOfBirth: { type: Date, required: true },
    verified : {type : Boolean, default :false},
    isAdmin: { type: Boolean, default: false }

}, { timestamps: true });
module.exports = mongoose.model("User", UserSchema)
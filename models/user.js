const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const usersSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      require: true,
      unique: true,
    },
    password: {
      type: String,
      require: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    token: {
      type: String,
      default: null
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    tokenExpiry: {
      type: Date,
      default: null
    },
  },
  {
    timestamps: true,
  }
);

usersSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

usersSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

usersSchema.methods.isTokenExpired = function () {
  if (!this.tokenExpiry) return true;
  return new Date() > this.tokenExpiry;
};

module.exports = mongoose.model("User", usersSchema);

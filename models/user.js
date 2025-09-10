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
    isVerified: {
      type: Boolean,
      default: true,
    },
    pushTokens: [{
      token: {
        type: String,
        required: true
      },
      device: {
        type: String, // ios, android
        default: 'unknown'
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    // verifyToken: {
    //   type: String,
    // },
    // verifyTokenExpires: {
    //   type: Date,
    // },
    // resetPasswordToken: {
    //   type: String,
    // },
    // resetPasswordExpires: {
    //   type: Date,
    // }
  },
  {
    timestamps: true,
  }
);

usersSchema.index({ 'pushTokens.token': 1 });

usersSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

usersSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", usersSchema);

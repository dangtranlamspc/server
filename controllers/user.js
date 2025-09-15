const User = require("../models/user");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const calculateTokenExpiry = () => {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 1 day
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExist = await User.findOne({ email });
    if (userExist)
      return res.status(400).json({ message: "User already exist" });

    const user = new User({
      name,
      email,
      password,
      isVerified: true,
    });

    await user.save();

    return res.status(201).json({
      message: "Đăng ký thành công!",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Đăng ký thất bại", error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Không tồn tại email này" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: "Email hoặc mật khẩu không đúng" });

    let token = user.token;
    let needNewToken = false;

    // Corrected line here: changed user.tokenExpiry() to user.tokenExpiry
    if (!token || !user.tokenExpiry || new Date(user.tokenExpiry).getTime() < Date.now()) {
      needNewToken = true;
    } else {
      try {
        jwt.verify(token, process.env.JWT_SECRET)
      } catch (error) {
        needNewToken = true;
      }
    }

    if (needNewToken) {
      token = generateToken(user);
      await User.findByIdAndUpdate(user._id, {
        token: token,
        tokenExpiry: calculateTokenExpiry()
      })
    }

    const userObject = user.toObject();
    delete userObject.password;
    delete userObject.token;
    delete userObject.tokenExpiry;

    res.json({ token, user: userObject });
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};


exports.refreshToken = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy user" });
    }

    // Tạo token mới
    const newToken = generateToken(user);

    // Cập nhật trong database
    await User.findByIdAndUpdate(userId, {
      token: newToken,
      tokenExpiry: calculateTokenExpiry()
    });

    res.json({
      token: newToken,
      message: "Token đã được làm mới"
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.logout = async (req, res) => {
  try {
    const userId = req.user.id;

    await User.findByIdAndUpdate(userId, {
      token: null,
      tokenExpiry: null,
      expoPushToken: null
    });

    res.json({ message: "Đăng xuất thành công" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id; // đã có từ middleware verifyToken
    const { oldPassword, newPassword } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ mật khẩu cũ và mới." });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng." });

    const isMatch = await user.matchPassword(oldPassword);
    if (!isMatch)
      return res.status(400).json({ message: "Mật khẩu cũ không chính xác." });

    // Đổi mật khẩu
    user.password = newPassword;
    await user.save(); // pre-save hook sẽ tự hash mật khẩu

    res.json({ message: "Đổi mật khẩu thành công." });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Đã xảy ra lỗi.", error: error.message });
  }
};

exports.verifyAccount = async (req, res) => {
  const { token } = req.query;

  const user = await User.findOne({
    verifyToken: token,
    verifyTokenExpires: { $gt: Date.now() },
  });

  if (!user)
    return res.status(400).json({ message: "Token không hợp lệ hoặc hết hạn" });

  user.verifyToken = undefined;
  user.verifyTokenExpires = undefined;

  await user.save();

  res.json({ message: "Tài khoản đã được xác thực !" });
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user)
    return res.status(404).json({ message: "Không tìm thấy người dùng" });

  const token = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 1000 * 60 * 15; // 15 phút
  await user.save();

  const resetLink = `${process.env.BASE_URL}/api/auth/reset-password?token=${token}`;
  await sendEmail({
    to: email,
    subject: "Đặt lại mật khẩu",
    html: `<p>Nhấn vào đây để đặt lại mật khẩu: <a href="${resetLink}">Đặt lại</a></p>`,
  });

  res.json({ message: "Đã gửi email đặt lại mật khẩu" });
};

exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user)
    return res
      .status(400)
      .json({ message: "Token không hợp lệ hoặc đã hết hạn" });

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({ message: "Mật khẩu đã được đặt lại thành công" });
};

exports.getUsers = async (req, res) => {
  try {
    // const search = req.query.search || '';
    // const users = await User.find({
    //   $or: [
    //     { name: { $regex: search, $options: 'i' } },
    //     { email: { $regex: search, $options: 'i' } }
    //   ]
    // });
    // res.json(users);
    const search = req.query.search || "";
    const users = await User.find({
      name: { $regex: search, $options: "i" },
    }).select("-password"); // bỏ password
    res.json({ data: users });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

exports.createUser = async (req, res) => {
  // try {
  //   const { name, email, password, role } = req.body;
  //   const hashedPassword = await bcrypt.hash(password, 10);
  //   const user = await User.create({ name, email, password: hashedPassword, role });
  //   res.status(201).json(user);
  // } catch (err) {
  //   res.status(500).json({ message: 'Lỗi server' });
  // }
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Thiếu thông tin" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email đã tồn tại" });
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    const data = { name, email, role };
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }
    const user = await User.findByIdAndUpdate(req.params.id, data, { new: true });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Đã xóa user' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};


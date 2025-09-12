const PushToken = require('../models/pushToken');
const User = require('../models/user')


exports.savePushToken = async (req, res) => {
  try {
    const { pushToken, deviceInfo } = req.body;
    const userId = req.user.id; // Lấy từ middleware xác thực

    if (!pushToken) {
      return res.status(400).json({ message: 'Push token is required' });
    }

    // Kiểm tra xem token này đã tồn tại chưa
    const existingToken = await PushToken.findOne({ pushToken });

    if (existingToken) {
      // Nếu token đã tồn tại nhưng thuộc user khác, cập nhật userId
      if (existingToken.userId.toString() !== userId) {
        existingToken.userId = userId;
      }
      
      // Cập nhật thông tin device và thời gian sử dụng cuối
      existingToken.deviceInfo = deviceInfo;
      existingToken.lastUsed = new Date();
      existingToken.isActive = true;
      
      await existingToken.save();
      
      return res.json({ 
        message: 'Push token updated successfully',
        tokenId: existingToken._id 
      });
    }

    // Tạo token mới
    const newPushToken = new PushToken({
      userId,
      pushToken,
      deviceInfo,
      isActive: true,
      lastUsed: new Date()
    });

    await newPushToken.save();

    res.status(201).json({ 
      message: 'Push token saved successfully',
      tokenId: newPushToken._id 
    });

  } catch (error) {
    console.error('Error saving push token:', error);
    res.status(500).json({ message: 'Server error while saving push token' });
  }
};

// Lấy tất cả push token của user
exports.getUserPushTokens = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const tokens = await PushToken.find({ 
      userId, 
      isActive: true 
    }).select('-__v');

    res.json({ tokens });
  } catch (error) {
    console.error('Error getting push tokens:', error);
    res.status(500).json({ message: 'Server error while getting push tokens' });
  }
};

// Xóa push token (khi logout hoặc uninstall app)
exports.deletePushToken = async (req, res) => {
  try {
    const { pushToken } = req.body;
    const userId = req.user.id;

    if (!pushToken) {
      return res.status(400).json({ message: 'Push token is required' });
    }

    const result = await PushToken.findOneAndUpdate(
      { pushToken, userId },
      { isActive: false },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ message: 'Push token not found' });
    }

    res.json({ message: 'Push token deactivated successfully' });
  } catch (error) {
    console.error('Error deleting push token:', error);
    res.status(500).json({ message: 'Server error while deleting push token' });
  }
};
const User = require('../models/user')

const cleanupExpiredTokens = async () => {
  try {
    const result = await User.updateMany(
      { 
        tokenExpiry: { $lt: new Date() },
        token: { $ne: null }
      },
      { 
        $unset: { 
          token: 1, 
          tokenExpiry: 1 
        } 
      }
    );
    
    console.log(`Đã xóa ${result.modifiedCount} token hết hạn`);
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
  }
};

// Chạy cleanup mỗi giờ
const startTokenCleanup = () => {
  // Chạy ngay lập tức
  cleanupExpiredTokens();
  
  // Chạy mỗi giờ
  setInterval(cleanupExpiredTokens, 60 * 60 * 1000);
};

module.exports = { cleanupExpiredTokens, startTokenCleanup };
const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // null cho thông báo tất cả user
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['info', 'success', 'warning', 'error', 'system', 'product', 'news'], 
    default: 'info' 
  },
  isRead: { type: Boolean, default: false },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high'], 
    default: 'medium' 
  },
  actionUrl: String, // URL để navigate khi tap notification
  relatedId: String, // ID của sản phẩm/tin tức liên quan
  relatedType: { 
    type: String, 
    enum: ['product', 'news', 'system'] 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema)

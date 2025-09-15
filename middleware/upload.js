const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../utils/cloudinary');
const path = require('path')

const storage = new CloudinaryStorage({
  cloudinary,
  params : async (req, file) => {
    let folder = 'uploads'
    if (req.baseUrl.includes('product')) folder = 'product';
    if (req.baseUrl.includes('slider')) folder = 'slider';
    if (req.baseUrl.includes('bsct')) folder = 'bsct';
    if (req.baseUrl.includes('nndt')) folder = 'nndt';
    if (req.baseUrl.includes('ctgd')) folder = 'ctgd';
    if (req.baseUrl.includes('tintuc')) folder = 'tintuc';

    return {
      folder : folder,
      format : file.mimetype.split('/')[1],
      public_id: path.parse(file.originalname).name,
    };
  }
});

const upload = multer({ storage });

module.exports = upload;

const Slider = require('../models/slider')
const cloudinary = require('../utils/cloudinary')

exports.getSliders = async ( req, res) => {
  const sliders = await Slider.find().sort({createAt : -1});
  res.json(sliders)
}

exports.creacteSliders = async (req, res) => {
  try {
    const {title, link} = req.body;
    if (!req.file) {
      return res.status(400).json({message : "Vui lòng upload ảnh"});
    }
    const slider = new Slider({
      title,
      // isActive: isActive !== undefined ? isActive === "true" || isActive === true : true,
      image: req.file.path,
    });

    await slider.save();
    res.json({message : "Tạo slider thành công", slider});
  } catch (error) {
    res.status(500).json({message : "Lỗi tạo slider", error: error.message})
  }
}


exports.updateSlider = async (req, res) => {
  try {
    const {title, isActive} = req.body;
    const slider = await Slider.findById(req.params.id);
    if (!slider) return res.status(404).json({message : "Không tìm thấy slider"});

    if (req.file ){
      const publicId = slider.image.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`slider/${publicId}`);
      slider.image = req.file.path;
    }

if (title !== undefined) slider.title = title;
    // if (link !== undefined) slider.link = link;
    // if (isActive !== undefined) slider.isActive = (isActive === "true" || isActive === true);

    await slider.save();
    res.json({message : "Cập nhật slider thành công", slider});
  } catch (error) {
    res.status(500).json({message : 'Lỗi cập nhật slider', error: error.message})
  }
}

exports.deleteSlider = async (req, res) => {
  try {
    const slider = await Slider.findById(req.params.id);
    if (!slider) return res.status(404).json({ message: "Không tìm thấy slider" });

    const publicId = slider.image.split("/").pop().split(".")[0];
    await cloudinary.uploader.destroy(`slider/${publicId}`);

    await slider.deleteOne();
    res.json({ message: "Xoá slider thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi xoá slider", error: error.message });
  }
};


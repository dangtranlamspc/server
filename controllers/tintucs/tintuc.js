const TinTuc = require('../../models/tintucs/tintuc');
const CategoryTinTuc = require('../../models/tintucs/categoryTinTuc')
const cloudinary = require('../../utils/cloudinary');


exports.getTinTuc = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search = "", categoryTinTuc } = req.query;
    const filter = { isActive: true };

    if (search && search.trim()) {
      const searchTerm = search.trim();

      // Sử dụng $or để tìm trong nhiều fields
      filter.$or = [
        { title: { $regex: searchTerm, $options: "i" } },
      ];
    }

    if (categoryTinTuc) {
      filter.categoryTinTuc = categoryTinTuc;
    }

    const skip = (page - 1) * pageSize;
    const tintucs = await TinTuc.find(filter)
      .populate("categoryTinTuc", 'name')
      .populate('creatorId', 'email')
      .skip(skip)
      .limit(Number(pageSize))
      .sort({ createdAt: -1 })
      .lean();

    const total = await TinTuc.countDocuments(filter);

    res.json({
      tintucs,
      total,
      page: Number(page)
    })
  } catch (error) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.getTinTucById = async (req, res) => {
  try {
    const tintucs = await TinTuc.findById(req.params.id).populate("categoryTinTuc", "name");
    if (!tintucs) return res.status(404).json({ message: "Không tìm thấy bài viết" });
    res.json(tintucs);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
};


exports.creacteTinTuc = async (req, res) => {
  try {
    let imageUrl = "";
    let imageId = "";
    if (req.file) {
      imageUrl = req.file.path;
      imageId = req.file.filename || req.file.public_id || "";
    }
    const newTinTuc = new TinTuc({
      title: req.body.title,
      summary: req.body.summary,
      description: req.body.description,
      isActive: req.body.isActive,
      isMoi: req.body.isMoi,
      images: imageUrl,
      imageId: imageId,
      categoryTinTuc: req.body.categoryTinTuc,
      creatorId: req.user.id,
    });
    await newTinTuc.save();
    res.status(201).json({ success: true, data: newTinTuc })
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: message.error })
  }
}

exports.updateTinTuc = async (req, res) => {
  try {
    const tintuc = await TinTuc.findById(req.params.id);
    if (!tintuc) return res.status(404).json({ message: 'Không tìm thấy bài viết' });

    let thumnailUrl = tintuc.images;
    let imageId = tintuc.imageId;

    if (req.file) {
      if (tintuc.imageId) {
        await cloudinary.uploader.destroy(tintuc.imageId);
      }

      // const result = await cloudinary.uploader.upload(req.file.path, { folder: "tintuc" });
      // thumnailUrl = result.secure_url;
      // imageId = result.public_id;
      thumnailUrl = req.file.path; // secure_url
      imageId = req.file.filename || req.file.public_id;
    }

    tintuc.title = req.body.title ?? tintuc.title;
    tintuc.description = req.body.description ?? tintuc.description;
    tintuc.isActive = req.body.isActive ?? tintuc.isActive;
    tintuc.isMoi = req.body.isMoi ?? tintuc.isMoi;
    tintuc.summary = req.body.summary ?? tintuc.summary;
    tintuc.images = thumnailUrl;
    tintuc.imageId = imageId;
    tintuc.categoryTinTuc = req.body.categoryTinTuc ?? tintuc.categoryTinTuc;

    await tintuc.save();
    res.json({ tintuc })
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: message.error })
  }
}

exports.deleteTinTuc = async (req, res) => {
  try {
    const tintuc = await TinTuc.findByIdAndDelete(req.params.id);
    if (!tintuc) return res.status(404).json({ message: 'Không tìm thấy bài viết' });

    if (tintuc.imageId) {
      await cloudinary.uploader.destroy(tintuc.imageId);
    }

    await tintuc.deleteOne();
    res.json({ message: "Xóa thành công" });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: message.error })
  }
}


exports.getTinTucByCategory = async (req, res) => {
  try {
    const { categoryTinTucId } = req.params;
    const { page = 1, limit = 10, search = '' } = req.query;

    const query = {
      categoryTinTuc: categoryTinTucId,
      name: { $regex: search, $options: 'i' },
    };

    const tintucs = await TinTuc.find(query)
      .sort({ createdAt: -1 }) // 🔥 Sắp xếp mới nhất trước
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('categoryTinTuc', 'name');

    const total = await TinTuc.countDocuments(query);

    res.json({
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      tintucs,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách theo danh mục', error: error.message });
  }
};

exports.getAllCategoriesTinTuc = async (req, res) => {
  const categoriesTinTuc = await CategoryTinTuc.find();
  res.json(categoriesTinTuc);
};


exports.getNewTinTuc = async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const tintuc = await TinTuc.find({ isMoi: true })
    .sort({ createdAt: -1 })
    .limit(limit)
  res.json(tintuc)
}
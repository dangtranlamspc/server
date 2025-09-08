const ThuVien = require('../../models/thuvien/thuvien');
const CategoryThuVien = require('../../models/thuvien/categoriesThuVien')


exports.getThuVien = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search = "", categoryThuVien } = req.query;
    const filter = { isActive: true };

    if (search && search.trim()) {
      const searchTerm = search.trim();

      // Sử dụng $or để tìm trong nhiều fields
      filter.$or = [
        { title: { $regex: searchTerm, $options: "i" } },
      ];
    }

    if (categoryThuVien) {
      filter.categoryThuVien = categoryThuVien;
    }

    const skip = (page - 1) * pageSize;
    const thuviens = await ThuVien.find(filter)
      .populate("categoryThuVien", 'name')
      .populate('creatorId', 'email')
      .skip(skip)
      .limit(Number(pageSize))
      .sort({ createdAt: -1 })
      .lean();

    const total = await ThuVien.countDocuments(filter);

    res.json({
      thuviens,
      total,
      page: Number(page)
    })
  } catch (error) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.getThuVienById = async (req, res) => {
  try {
    const thuvien = await ThuVien.findById(req.params.id).populate("categoryThuVien", "name");
    if (!thuvien) return res.status(404).json({ message: "Không tìm thấy bài viết" });
    res.json(thuvien);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
};


exports.creacteThuVien = async (req, res) => {
  try {
    const newThuVien = new ThuVien({
      title: req.body.title,
      videoId : req.body.videoId,
      isActive: req.body.isActive,
      isMoi: req.body.isMoi,
      categoryThuVien: req.body.categoryThuVien,
      creatorId: req.user.id,
    });
    await newThuVien.save();
    res.status(201).json(newThuVien)
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: message.error })
  }
}

exports.updateThuVien = async (req, res) => {
  try {
    const thuvien = await ThuVien.findById(req.params.id);
    if (!thuvien) return res.status(404).json({ message: 'Không tìm thấy bài viết' });

    thuvien.title = req.body.title ?? thuvien.title;
    thuvien.videoId = req.body.videoId ?? thuvien.videoId;
    thuvien.isActive = req.body.isActive ?? thuvien.isActive;
    thuvien.isMoi = req.body.isMoi ?? thuvien.isMoi;
    thuvien.categoryThuVien = req.body.categoryThuVien ?? thuvien.categoryThuVien;

    await thuvien.save();
    res.json({ thuvien })
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: message.error })
  }
}

exports.deleteThuVien = async (req, res) => {
  try {
    const thuvien = await ThuVien.findByIdAndDelete(req.params.id);
    if (!thuvien) return res.status(404).json({ message: 'Không tìm thấy bài viết' });
    await thuvien.deleteOne();
    res.json({ message: "Xóa thành công" });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: message.error })
  }
}


exports.getThuVienByCategoryThuVien = async (req, res) => {
  try {
    const { categoryThuVienId } = req.params;
    const { page = 1, limit = 10, search = '' } = req.query;

    const query = {
      categoryThuVien: categoryThuVienId,
      name: { $regex: search, $options: 'i' },
    };

    const thuviens = await ThuVien.find(query)
      .sort({ createdAt: -1 }) // 🔥 Sắp xếp mới nhất trước
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('categoryThuVien', 'name');

    const total = await ThuVien.countDocuments(query);

    res.json({
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      thuviens,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách theo danh mục', error: error.message });
  }
};

exports.getAllCategoriesThuVien = async (req, res) => {
  const categoryThuVien = await CategoryThuVien.find();
  res.json(categoryThuVien);
};


exports.getNewThuVien = async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const thuvien = await ThuVien.find({ isMoi: true })
    .sort({ createdAt: -1 })
    .limit(limit)
  res.json(thuvien)
}




// try {
//   const page = parseInt(req.query.page) || 1;
//   const pageSize = parseInt(req.query.pageSize) || 10;
//   const searchText = req.query.searchText || "";

//   const filter = searchText ? {
//     title : { $regex : searchText, $options : "i"}
//   } : {};

//   // if (categoryBSCT) {
//   //   filter.categoryBSCT = categoryBSCT;
//   // }

//   console.log(filter)

//   const total = await BlogBSCT.countDocuments(filter);

//   const bscts = await BlogBSCT.find(filter)
//     .populate('categoryBSCT', 'name')
//     .populate('creatorId','email')
//     .skip((page - 1) * pageSize)
//     .limit(pageSize)
//     .sort({createdAt : -1});

//   res.json({
//     total,
//     page,
//     bscts,
//   });
// } catch (error) {
//   res.status(500).json({ message: 'Lỗi khi lấy sản phẩm', error: error.message });
// }


const BlogBSCT = require('../../models/bsct/blogBSCT');
const cloudinary = require('../../utils/cloudinary');


exports.getBlogsBSCT = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const searchText = req.query.searchText || "";

    const filter = searchText ? {
      title : { $regex : searchText, $options : "i"}
    } : {};

        const total = await BlogBSCT.countDocuments(filter);

    const bscts = await BlogBSCT.find(filter)
      .populate('categoryBSCT', 'name')
      .populate('creatorId','email')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .sort({createdAt : -1});

    res.json({
      total,
      page,
      bscts,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy sản phẩm', error: error.message });
  }
};

exports.getBlogsBSCTById = async (req, res) => {
  try {
    const bsct = await BlogBSCT.findById(req.params.id).populate("categoryBSCT", "name");
    if (!bsct) return res.status(404).json({ message: "Không tìm thấy bài viết" });
    res.json(bsct);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
};


exports.creacteBlogBSCT = async (req, res) => {
    try {
        let imageUrl = "";
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, { folder: "blogBSCT" })
            imageUrl = result.secure_url;
        }
        const newBlogBSCT = new BlogBSCT({
            title: req.body.title,
            summary : req.body.summary,
            description: req.body.description,
            isActive : req.body,isActive,
            isMoi : req.body.isMoi,
            images: imageUrl,
            categoryBSCT : req.body.categoryBSCT,
            creatorId : req.user.id,
        });

        await newBlogBSCT.save();
        res.status(201).json(newBlogBSCT)
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: message.error })
    }
}

exports.updateBlogBSCT = async (req, res) => {
    try {
        const blogBSCT = await BlogBSCT.findById(req.params.id);
        if (!blogBSCT) return res.status(404).json({message : 'Không tìm thấy bài viết'});

        let thumnailUrl = blogBSCT.images;
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {folder : "blogBSCT"});
            thumnailUrl = result.secure_url;
        }

        blogBSCT.title = req.body.title ?? blogBSCT.title;
        blogBSCT.description  = req.body.description ?? blogBSCT.description;
        blogBSCT.isActive = req.body.isActive ?? blogBSCT.isActive;
        blogBSCT.isMoi = req.body.isMoi ?? blogBSCT.isMoi;
        blogBSCT.summary = req.body.summary ?? blogBSCT.summary;
        blogBSCT.images = thumnailUrl;
        blogBSCT.categoryBSCT = req.body.categoryBSCT ?? blogBSCT.categoryBSCT;

        await blogBSCT.save();
        res.json({blogBSCT})
    } catch (error) {
        res.status(500).json({message : 'Lỗi server', error : message.error})
    }
}

exports.deleteBlogBSCT = async (req, res) => {
    try {
        const blogBSCT = await BlogBSCT.findByIdAndDelete(req.params.id);
        if (!blogBSCT) return res.status(404).json({message : 'Không tìm thấy bài viết'});
        await blogBSCT.deleteOne();
        res.json({ message: "Xóa thành công" });
    } catch (error) {
        res.status(500).json({message : 'Lỗi server', error : message.error})
    }
}


exports.getBSCTByCategoryBSCT = async (req, res) => {
  try {
    const { categoryBSCTId } = req.params;
    const { page = 1, limit = 10, search = '' } = req.query;

    const query = {
      categoryBSCT: categoryBSCTId,
      name: { $regex: search, $options: 'i' },
    };

    const bscts = await BlogBSCT.find(query)
      .sort({ createdAt: -1 }) // 🔥 Sắp xếp mới nhất trước
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('categoryBSCT', 'name');

    const total = await BlogBSCT.countDocuments(query);

    res.json({
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      bscts,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách theo danh mục', error: error.message });
  }
};

exports.getAllCategoriesBSCT = async (req, res) => {
  const categoriesBSCT = await categoryBSCT.find();
  res.json(categoriesBSCT);
};


exports.getNewPostBSCT = async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const postBsct = await BlogBSCT.find({isMoi : true})
    .sort({createdAt : -1})
    .limit(limit)
  res.json(postBsct)
}


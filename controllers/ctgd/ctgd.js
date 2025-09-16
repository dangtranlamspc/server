const ProductCTGD = require('../../models/ctgd/ctgs')
const CategoryCTGD = require('../../models/ctgd/categoryCTGD')
const Favourite = require('../../models/favourite')
const cloudinary = require('../../utils/cloudinary')


// exports.createProductCTGD = async (req, res) => {
//   try {
//     const { name, description, categoryctgd, isActive, isMoi } = req.body;
//     const imageUrls = req.files.map(file => file.path);

//     const product = await ProductCTGD.create({
//       name,
//       description,
//       categoryctgd,
//       images: imageUrls,
//       isActive,
//       isMoi,
//       creatorId: req.user.id,
//     });


//     res.status(201).json({ success: true, message: 'Tạo sản phẩm thành công', product });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Tạo sản phẩm thất bại', error: error.message });
//   }
// };

exports.createProductCTGD = async (req, res) => {
  try {
    const { name, description, categoryctgd, isActive, isMoi } = req.body;

    // Nếu có upload ảnh
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => ({
        url: file.path,        // secure_url từ Cloudinary
        imageId: file.filename // public_id từ Cloudinary
      }));
    }

    const productctgd = await ProductCTGD.create({
      name,
      description,
      categoryctgd,
      isActive,
      isMoi,
      images
    });

    res.status(201).json({
      message: "Tạo sản phẩm thành công",
      productctgd
    });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({
      message: "Lỗi khi tạo sản phẩm",
      error: error.message
    });
  }
};


exports.getProductCTGDs = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search = "", categoryctgd } = req.query;
    const filter = { isActive: true };

    if (search) {
      filter.name = { $regex: search, $options: "i" }; // tìm theo tên
    }

    if (categoryctgd) {
      filter.categoryctgd = categoryctgd; // lọc theo categoryId
    }

    const skip = (page - 1) * pageSize;
    const products = await ProductCTGD.find(filter)
      .populate("categoryctgd", "name")
      .populate("creatorId", "email")
      .skip(skip)
      .limit(Number(pageSize))
      .sort({ createdAt: -1 });

    const total = await ProductCTGD.countDocuments(filter);

    res.json({
      products,
      total,
      page: Number(page),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.getProductCTGDsByFavourite = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search = "", categoryctgd } = req.query;
    const filter = { isActive: true };

    if (search) {
      filter.name = { $regex: search, $options: "i" }; // tìm theo tên
    }

    if (categoryctgd) {
      filter.categoryctgd = categoryctgd; // lọc theo categoryId
    }

    const skip = (page - 1) * pageSize;
    const products = await ProductCTGD.find(filter)
      .populate("categoryctgd", "name")
      .populate("creatorId", "email")
      .skip(skip)
      .limit(Number(pageSize))
      .sort({ createdAt: -1 });

    const favorites = await Favourite.find({ userId: req.user.userId });
    const favoriteProductCTGDIds = favorites.map(fav => fav.productctgdId.toString());

    const productwithFavourites = products.map(productctgd => ({
      ...productctgd.toObject(),
      isFavourite: favoriteProductCTGDIds.includes(productctgd._id.toString())
    }))


    const total = await ProductCTGD.countDocuments(filter);

    res.json({
      products: productwithFavourites,
      total,
      page: Number(page),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
}


// Backend - Controller cập nhật sản phẩm
exports.updateProductCTGD = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await ProductCTGD.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    // 🔑 Nếu model dùng creatorId thì đổi lại
    if (req.user.role !== "admin" && product.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Bạn không có quyền sửa sản phẩm này" });
    }

    let { name, description, categoryctgd, isActive, isMoi, oldImages } = req.body;

    // 🛠️ Fix: đảm bảo oldImages là array
    if (typeof oldImages === "string") {
      try {
        oldImages = JSON.parse(oldImages); // client gửi stringify
      } catch {
        oldImages = []; // fallback
      }
    }
    if (!Array.isArray(oldImages)) {
      oldImages = [];
    }

    // // Debug logs
    // console.log("=== UPDATE PRODUCT DEBUG ===");
    // console.log("Product ID:", id);
    // console.log("Current product images:", product.images);
    // console.log("Old images from frontend:", oldImages);
    // console.log("New files from multer:", req.files?.length || 0);

    // 🆕 Lấy ảnh mới từ multer-storage-cloudinary
    let newImages = [];
    if (req.files && req.files.length > 0) {
      newImages = req.files.map((file) => ({
        url: file.path,         // Cloudinary URL
        imageId: file.filename, // Cloudinary public_id
      }));
      // console.log("New images created:", newImages);
    }

    // 🗑️ Tìm ảnh bị xoá (so sánh với oldImages từ frontend)
    const removedImages = product.images.filter(
      (img) => !oldImages.some((oldImg) => oldImg.imageId === img.imageId)
    );

    // console.log("Images to remove:", removedImages);

    // Xóa ảnh đã remove khỏi Cloudinary
    for (const img of removedImages) {
      if (img.imageId) {
        try {
          await cloudinary.uploader.destroy(img.imageId);
          console.log(`Đã xóa ảnh: ${img.imageId}`);
        } catch (error) {
          console.error(`Lỗi xóa ảnh ${img.imageId}:`, error);
        }
      }
    }

    // ✅ Gộp ảnh còn giữ + ảnh mới
    const updatedImages = [...oldImages, ...newImages];
    // console.log("Final updated images:", updatedImages);

    // 📝 Update dữ liệu
    product.name = name ?? product.name;
    product.description = description ?? product.description;
    product.categoryctgd = categoryctgd ?? product.categoryctgd;
    product.isActive = isActive !== undefined ? isActive : product.isActive;
    product.isMoi = isMoi !== undefined ? isMoi : product.isMoi;
    product.images = updatedImages;

    await product.save();

    // console.log("Product saved with images:", product.images);
    // console.log("=== END DEBUG ===");

    res.json({ message: "Cập nhật sản phẩm thành công", product });
  } catch (error) {
    console.error("Update Product Error:", error);
    res.status(500).json({ message: "Lỗi cập nhật sản phẩm", error: error.message });
  }
};



exports.deleteProductCTGD = async (req, res) => {
  try {
    const product = await ProductCTGD.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

    if (req.user.role !== "admin" && product.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Bạn không có quyền xóa sản phẩm này" });
    }

    // Xoá ảnh trên Cloudinary
    if (product.images && product.images.length > 0) {
      for (const img of product.images) {
        if (img.imageId) {
          await cloudinary.uploader.destroy(img.imageId);
        }
      }
    }

    await product.deleteOne();

    res.json({ message: 'Đã xoá sản phẩm' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi xoá sản phẩm', error: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await ProductCTGD.findById(req.params.id).populate('categoryctgd', 'name');
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy chi tiết', error: error.message });
  }
};

exports.getProductsByCategory = async (req, res) => {
  try {
    const { categoryCTGDId } = req.params;
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search = '' } = req.query;

    if (!categoryCTGDId) {
      return res.status(404).json({
        success: false,
        message: 'CategoryId la bat buoc',
      });
    }

    const categoryctgd = await CategoryCTGD.findById(categoryCTGDId);
    if (!categoryctgd) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOption = {};
    sortOption[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const products = await ProductCTGD.find({
      categoryctgd: categoryCTGDId,
      isActive: true,
      name: { $regex: search, $options: 'i' },
    })
      .populate('categoryctgd', 'name')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))

    const totalProducts = await ProductCTGD.countDocuments({
      categoryctgd: categoryCTGDId,
      isActive: true
    });
    const totalPages = Math.ceil(totalProducts / parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        products,
        categoryctgd,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalProducts,
          hasMore: parseInt(page) < totalPages,
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy sản phẩm',
      error: error.message
    })
  }
}

exports.getAllCategories = async (req, res) => {
  const categories = await CategoryCTGD.find();
  res.json(categories);
};

exports.getProductNew = async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const products = await ProductCTGD.find({ isMoi: true })
    .sort({ createdAt: -1 })
    .limit(limit)
  res.json(products)
};
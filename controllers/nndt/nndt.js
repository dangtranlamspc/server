const ProductNNDT = require('../../models/nndt/nndt')
const CategoryNNDT = require('../../models/nndt/danhmucnndt')
const Favourite = require('../../models/favourite')
const cloudinary = require('../../utils/cloudinary')


exports.createProductNNDT = async (req, res) => {
  try {
      const { name, description, categorynndt, isActive, isMoi } = req.body;
  
      // Nếu có upload ảnh
      let images = [];
      if (req.files && req.files.length > 0) {
        images = req.files.map(file => ({
          url: file.path,        // secure_url từ Cloudinary
          imageId: file.filename // public_id từ Cloudinary
        }));
      }
  
      const productnndt = await ProductNNDT.create({
        name,
        description,
        categorynndt,
        isActive,
        isMoi,
        images
      });
  
      res.status(201).json({
        message: "Tạo sản phẩm thành công",
        productnndt
      });
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({
        message: "Lỗi khi tạo sản phẩm",
        error: error.message
      });
    }
};


exports.getProductNNDTs = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search = "", categorynndt } = req.query;
    const filter = { isActive: true };

    if (search) {
      filter.name = { $regex: search, $options: "i" }; // tìm theo tên
    }

    if (categorynndt) {
      filter.categorynndt = categorynndt; // lọc theo categoryId
    }

    const skip = (page - 1) * pageSize;
    const products = await ProductNNDT.find(filter)
      .populate("categorynndt", "name")
      .populate("creatorId", "email")
      .skip(skip)
      .limit(Number(pageSize))
      .sort({ createdAt: -1 });

    const total = await ProductNNDT.countDocuments(filter);

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

exports.getProductNNDTsByFavourite = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search = "", categorynndt } = req.query;
    const filter = { isActive: true };

    if (search) {
      filter.name = { $regex: search, $options: "i" }; // tìm theo tên
    }

    if (categorynndt) {
      filter.categorynndt = categorynndt; // lọc theo categoryId
    }

    const skip = (page - 1) * pageSize;
    const products = await ProductNNDT.find(filter)
      .populate("categorynndt", "name")
      .populate("creatorId", "email")
      .skip(skip)
      .limit(Number(pageSize))
      .sort({ createdAt: -1 });

    const favorites = await Favourite.find({ userId: req.user.userId });
    const favoriteProductNNDTIds = favorites.map(fav => fav.productnndtId.toString());

    const productwithFavourites = products.map(productnndt => ({
      ...productnndt.toObject(),
      isFavourite: favoriteProductNNDTIds.includes(productnndt._id.toString())
    }))


    const total = await ProductNNDT.countDocuments(filter);

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




// Kiểm tra quyền cập nhật
// if (!req.user.isAdmin && req.user.id !== product.creatorId.toString()) {
//   return res.status(403).json({ message: 'Không có quyền cập nhật' });
// }

exports.updateProductNNDT = async (req, res) => {
  try {
      const { id } = req.params;
      const product = await ProductNNDT.findById(id);
      if (!product) {
        return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
      }
  
      // 🔑 Nếu model dùng creatorId thì đổi lại
      if (req.user.role !== "admin" && product.user.toString() !== req.user.id) {
        return res.status(403).json({ message: "Bạn không có quyền sửa sản phẩm này" });
      }
  
      let { name, description, categorynndt, isActive, isMoi, oldImages } = req.body;
  
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
      product.categorynndt = categorynndt ?? product.categorynndt;
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

exports.deleteProductNNDT = async (req, res) => {
  try {
    const product = await ProductNNDT.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

    if (req.user.role !== "admin" && product.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Bạn không có quyền xóa sản phẩm này" });
    }

    // Xoá ảnh trên Cloudinary
    for (const url of product.images) {
      const publicId = url.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`nndt/${publicId}`);
    }

    await product.deleteOne();

    res.json({ message: 'Đã xoá sản phẩm' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi xoá sản phẩm', error: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await ProductNNDT.findById(req.params.id).populate('categorynndt', 'name');
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy chi tiết', error: error.message });
  }
};

// exports.getProductsByCategory = async (req, res) => {
//   try {
//     const { categoryId } = req.params;
//     const { page = 1, limit = 10, search = '' } = req.query;

//     const query = {
//       category: categoryId,
//       name: { $regex: search, $options: 'i' },
//     };

//     const products = await Product.find({query, isActive : true})
//       .sort({ createdAt: -1 })
//       .skip((page - 1) * limit)
//       .limit(Number(limit))
//       .populate('category', 'name');

//     const total = await Product.countDocuments(query);

//     res.json({
//       total,
//       page: Number(page),
//       totalPages: Math.ceil(total / limit),
//       products,
//     });

//     console.log(products)
//   } catch (error) {
//     res.status(500).json({ message: 'Lỗi khi lấy sản phẩm theo category', error: error.message });
//   }
// };

exports.getProductsByCategory = async (req, res) => {
  try {
    const { categoryNNDTId } = req.params;
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search = '' } = req.query;

    if (!categoryNNDTId) {
      return res.status(404).json({
        success: false,
        message: 'CategoryId la bat buoc',
      });
    }

    const categorynndt = await CategoryNNDT.findById(categoryNNDTId);
    if (!categorynndt) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOption = {};
    sortOption[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const products = await ProductNNDT.find({
      categorynndt: categoryNNDTId,
      isActive: true,
      name: { $regex: search, $options: 'i' },
    })
      .populate('categorynndt', 'name')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))

    const totalProducts = await ProductNNDT.countDocuments({
      categorynndt: categoryNNDTId,
      isActive: true
    });
    const totalPages = Math.ceil(totalProducts / parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        products,
        categorynndt,
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
  const categories = await CategoryNNDT.find();
  res.json(categories);
};

exports.getProductNew = async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const products = await ProductNNDT.find({ isMoi: true })
    .sort({ createdAt: -1 })
    .limit(limit)
  res.json(products)
};
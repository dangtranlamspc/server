const Product = require('../models/product')
const Category = require('../models/category')
const Favourite = require('../models/favourite')
const mongoose = require('mongoose')
const Review = require('../models/review')
const cloudinary = require('../utils/cloudinary')


exports.createProduct = async (req, res) => {
  try {
    const { name, description, category, isActive, isMoi } = req.body;
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => ({
        url: file.path,        // secure_url từ Cloudinary
        imageId: file.filename // public_id từ Cloudinary
      }));
    }

    const product = await Product.create({
      name,
      description,
      category,
      images,
      isActive,
      isMoi,
      creatorId: req.user.id,
    });


    res.status(201).json({ success: true, message: 'Tạo sản phẩm thành công', product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Tạo sản phẩm thất bại', error: error.message });
  }
};


exports.getProducts = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search = "", category } = req.query;
    const filter = { isActive: true };

    if (search) {
      filter.name = { $regex: search, $options: "i" }; // tìm theo tên
    }

    if (category) {
      filter.category = category; // lọc theo categoryId
    }

    const skip = (page - 1) * pageSize;
    const products = await Product.find(filter)
      .populate("category", "name")
      .populate("creatorId", "email")
      .skip(skip)
      .limit(Number(pageSize))
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(filter);

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

exports.getProductsByFavourite = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search = "", category } = req.query;
    const filter = { isActive: true };

    if (search) {
      filter.name = { $regex: search, $options: "i" }; // tìm theo tên
    }

    if (category) {
      filter.category = category; // lọc theo categoryId
    }

    const skip = (page - 1) * pageSize;
    const products = await Product.find(filter)
      .populate("category", "name")
      .populate("creatorId", "email")
      .skip(skip)
      .limit(Number(pageSize))
      .sort({ createdAt: -1 });

    const favorites = await Favourite.find({ userId: req.user.userId });
    const favoriteProductIds = favorites.map(fav => fav.productId.toString());

    const productwithFavourites = products.map(product => ({
      ...product.toObject(),
      isFavourite: favoriteProductIds.includes(product._id.toString())
    }))


    const total = await Product.countDocuments(filter);

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

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    // 🔑 Nếu model dùng creatorId thì đổi lại
    if (req.user.role !== "admin" && product.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Bạn không có quyền sửa sản phẩm này" });
    }

    let { name, description, category, isActive, isMoi, oldImages } = req.body;

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
    product.category = category ?? product.category;
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

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
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
    const product = await Product.findById(req.params.id).populate('category', 'name');
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy chi tiết', error: error.message });
  }
};

exports.getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search = '' } = req.query;

    if (!categoryId) {
      return res.status(404).json({
        success: false,
        message: 'CategoryId la bat buoc',
      });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOption = {};
    sortOption[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const products = await Product.find({
      category: categoryId,
      isActive: true,
      name: { $regex: search, $options: 'i' },
    })
      .populate('category', 'name')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))

    const totalProducts = await Product.countDocuments({
      category: categoryId,
      isActive: true
    });
    const totalPages = Math.ceil(totalProducts / parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        products,
        category,
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
  const categories = await Category.find();
  res.json(categories);
};

exports.getProductNew = async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const products = await Product.find({ isMoi: true })
    .sort({ createdAt: -1 })
    .limit(limit)
  res.json(products)
};
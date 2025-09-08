const CategoryThuVien = require('../../models/thuvien/categoriesThuVien')

exports.getAllCategoriesThuVien = async (req , res) => {
    try {
        const categoriesThuVien = await CategoryThuVien.find();
        res.json(categoriesThuVien);
    } catch (error) {
        res.status(500).json({message : error.message});
    }
}


exports.createCategoryThuVien = async (req , res ) => {
    try {
        const categoryThuVien = new CategoryThuVien(req.body)
        const saved = await categoryThuVien.save();
        res.status(201).json(saved)
    } catch (error) {
        res.status(404).json({message : error.message});
    }
}


exports.getCategoryThuVienById = async (req, res) => {
    try {
        const categoryThuVien = await CategoryThuVien.findById(req.params.id);
        if (!categoryThuVien) return res.status(404).json({message : 'Category not found'})
        res.json(categoryThuVien)
    } catch (error) {
        res.status(404).json({message : error.message});
    }
}

exports.updateCategoryThuVien = async (req, res) => {
    try {
        const updated = await CategoryThuVien.findByIdAndUpdate(req.params.id, req.body, { new : true})
        res.json(updated)
    } catch (error) {
        res.status(404).json({message : error.message});
    }
}

exports.deleteCategoryThuVien = async (req , res) => {
    try {
        await CategoryThuVien.findByIdAndDelete(req.params.id);
        res.json({message : 'Category deleted'})
    } catch (error) {
        res.status(404).json({message : error.message});
    }
}
const CategoryTinTuc = require('../../models/tintucs/categoryTinTuc')

exports.getAllCategories = async (req , res) => {
    try {
        const categories = await CategoryTinTuc.find();
        res.json(categories);
    } catch (error) {
        res.status(500).json({message : error.message});
    }
}


exports.createCategory = async (req , res ) => {
    try {
        const category = new CategoryTinTuc(req.body)
        const saved = await category.save();
        res.status(201).json(saved)
    } catch (error) {
        res.status(404).json({message : error.message});
    }
}


exports.getCategoryById = async (req, res) => {
    try {
        const category = await CategoryTinTuc.findById(req.params.id);
        if (!category) return res.status(404).json({message : 'Category not found'})
        res.json(category)
    } catch (error) {
        res.status(404).json({message : error.message});
    }
}

exports.updateCategory = async (req, res) => {
    try {
        const updated = await CategoryTinTuc.findByIdAndUpdate(req.params.id, req.body, { new : true})
        res.json(updated)
    } catch (error) {
        res.status(404).json({message : error.message});
    }
}

exports.deleteCategory = async (req , res) => {
    try {
        await CategoryTinTuc.findByIdAndDelete(req.params.id);
        res.json({message : 'Category deleted'})
    } catch (error) {
        res.status(404).json({message : error.message});
    }
}
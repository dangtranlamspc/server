const CategoryCTGD = require('../../models/ctgd/categoryCTGD')

exports.getAllCategories = async (req , res) => {
    try {
        const categorieNNDTs = await CategoryCTGD.find();
        res.json(categorieNNDTs);
    } catch (error) {
        res.status(500).json({message : error.message});
    }
}


exports.createCategory = async (req , res ) => {
    try {
        const category = new CategoryCTGD(req.body)
        const saved = await category.save();
        res.status(201).json(saved)
    } catch (error) {
        res.status(404).json({message : error.message});
    }
}


exports.getCategoryById = async (req, res) => {
    try {
        const category = await CategoryCTGD.findById(req.params.id);
        if (!category) return res.status(404).json({message : 'Category not found'})
        res.json(category)
    } catch (error) {
        res.status(404).json({message : error.message});
    }
}

exports.updateCategory = async (req, res) => {
    try {
        const updated = await CategoryCTGD.findByIdAndUpdate(req.params.id, req.body, { new : true})
        res.json(updated)
    } catch (error) {
        res.status(404).json({message : error.message});
    }
}

exports.deleteCategory = async (req , res) => {
    try {
        await CategoryCTGD.findByIdAndDelete(req.params.id);
        res.json({message : 'Category deleted'})
    } catch (error) {
        res.status(404).json({message : error.message});
    }
}
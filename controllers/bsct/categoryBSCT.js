const CategoryBSCT = require('../../models/bsct/categoryBSCT')

exports.getAllCategoriesBSCT = async (req , res) => {
    try {
        const categoriesBSCT = await CategoryBSCT.find();
        res.json(categoriesBSCT);
    } catch (error) {
        res.status(500).json({message : error.message});
    }
}


exports.createCategoryBSCT = async (req , res ) => {
    try {
        const categoryBSCT = new CategoryBSCT(req.body)
        const saved = await categoryBSCT.save();
        res.status(201).json(saved)
    } catch (error) {
        res.status(404).json({message : error.message});
    }
}


exports.getCategoryBSCTById = async (req, res) => {
    try {
        const categoryBSCT = await CategoryBSCT.findById(req.params.id);
        if (!categoryBSCT) return res.status(404).json({message : 'Category not found'})
        res.json(categoryBSCT)
    } catch (error) {
        res.status(404).json({message : error.message});
    }
}

exports.updateCategoryBSCT = async (req, res) => {
    try {
        const updated = await CategoryBSCT.findByIdAndUpdate(req.params.id, req.body, { new : true})
        res.json(updated)
    } catch (error) {
        res.status(404).json({message : error.message});
    }
}

exports.deleteCategoryBSCT = async (req , res) => {
    try {
        await CategoryBSCT.findByIdAndDelete(req.params.id);
        res.json({message : 'Category deleted'})
    } catch (error) {
        res.status(404).json({message : error.message});
    }
}
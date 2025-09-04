const mongoose = require('mongoose')

const blogBSCTSchema = new mongoose.Schema({
    title: {
        type: String,
        require: true,
    },
    summary : {
        type: String,
        require : true,
    },
    description: {
        type: String,
        require: true,
    },
    images: {
        type: String,
        require: true,
    },
    categoryBSCT: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CategoryBSCT',
        require: true,
    },
    isActive : {
        type : Boolean,
        default: true
    },
    isMoi : {
        type : Boolean,
        default : false,
    },
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, {
    timestamps: true
});


module.exports = mongoose.model('BlogBSCT', blogBSCTSchema)
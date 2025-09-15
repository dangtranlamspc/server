const mongoose = require('mongoose')

const categoryTinTucSchema = new mongoose.Schema({
    name : {
        type : String,
        require : true,
        trim : true,
        unique : true,
    },
    description : {
        type : String,
        default : ''
    },
}, {
    timestamps : true,
});

module.exports = mongoose.model('CategoryTinTuc', categoryTinTucSchema)
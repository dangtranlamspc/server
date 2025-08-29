const mongoose = require('mongoose')

const sliderSchema = new mongoose.Schema(  {
    title: { type: String, required: true },
    image: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },);

module.exports = mongoose.model('Slider', sliderSchema);
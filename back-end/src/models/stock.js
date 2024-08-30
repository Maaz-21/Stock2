const mongoose = require('mongoose');

const StockSchema = new mongoose.Schema({
  symbol: { type: String, required: true, unique: true },
  name: { type: String },
  price: { type: Number },
  // Add additional fields as necessary
}, { timestamps: true });

module.exports = mongoose.model('Stock', StockSchema);

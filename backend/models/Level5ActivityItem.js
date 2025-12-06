// src/models/Level5ActivityItem.js
const mongoose = require('mongoose');

const level5ActivityItemSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    trim: true
  },
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  itemDescription: {
    type: String,
    trim: true
  },
  estimatedAmount: {
    type: Number,
    required: true,
    min: 0
  },
  parentItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Level4Activity',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Level5ActivityItem', level5ActivityItemSchema);
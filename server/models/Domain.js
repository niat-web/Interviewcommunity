// server/models/Domain.js
const mongoose = require('mongoose');

const DomainSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Domain name is required'],
    unique: true,
    trim: true
  },
  eventTitle: {
    type: String,
    trim: true,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('Domain', DomainSchema);

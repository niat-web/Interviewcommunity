// server/models/CustomEmailTemplate.js
const mongoose = require('mongoose');

const CustomEmailTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Template name is required'],
    trim: true,
    unique: true,
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
  },
  body: {
    type: String, // Will store HTML content from the Quill editor
    required: [true, 'Email body is required'],
  },
  placeholders: [{
    type: String,
    trim: true,
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }
}, { timestamps: true });

// Helper to extract placeholders like {{name}} or {{report_link}}
const extractPlaceholders = (text) => {
    const regex = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;
    const matches = text.match(regex);
    if (!matches) return [];
    // Deduplicate and clean up (remove {{}} and whitespace)
    return [...new Set(matches.map(p => p.replace(/{{\s*|\s*}}/g, '')))];
};


CustomEmailTemplateSchema.pre('save', function(next) {
    const subjectPlaceholders = extractPlaceholders(this.subject);
    const bodyPlaceholders = extractPlaceholders(this.body);
    this.placeholders = [...new Set([...subjectPlaceholders, ...bodyPlaceholders])];
    next();
});


module.exports = mongoose.model('CustomEmailTemplate', CustomEmailTemplateSchema);

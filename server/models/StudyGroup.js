//server/models/StudyGroup.js

const mongoose = require('mongoose');

// This defines the shape of a "Study Group" document in MongoDB
const studyGroupSchema = new mongoose.Schema({
  course: {
    type: String,
    required: true,
  },
  campus: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    default: "",
  },
  meetingTime: {
    type: String,
    required: true,
  },
  attendees: {
    type: [
      {
        name: {
          type: String,
          required: true,
        },
        email: {
          type: String,
          required: true,
          match: /^[a-zA-Z0-9._%+-]+@(?:mail\.)?valenciacollege\.edu$/,
        },
      }
    ],
    default: [],
  },
  ownerEmail: {
    type: String,
    required: true,
  },
  groupTitle: {
    type: String,
    default: "",
  },  
  updatedBy: {
    type: String,
    default: "",
  },
  createdBy: {
    type: String,
    default: "",
  },
  notes: {
    type: String,
    default: "",
  },
  date: {
    type: Date,
  },
  showOwnerEmail: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true, // Auto adds createdAt and updatedAt
});

module.exports = mongoose.model('StudyGroup', studyGroupSchema);

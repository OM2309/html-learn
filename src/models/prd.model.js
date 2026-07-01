import mongoose from 'mongoose';

const prdSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  goal: {
    type: String,
    required: true,
    trim: true,
  },
  requirements: {
    type: [String],
    default: [],
  },
  edgeCases: {
    type: [String],
    default: [],
  },
  errorStates: {
    type: [String],
    default: [],
  },
  mockServices: {
    type: [String],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const PRD = mongoose.model('PRD', prdSchema);

export default PRD;

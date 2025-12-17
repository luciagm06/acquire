'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PreparedSampleSchema = new Schema({
  features: {
    type: [Number],
    required: true
  },
  featureCount: {
    type: Number,
    required: true
  },
  scalerVersion: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  targetDate: {
    type: Date,
    required: true
  },
  dailyValues: {
    type: [Number],
    required: true
  },
  kunnaMeta: {
    type: Schema.Types.Mixed,
    required: true
  },
  daysUsed: {
    type: [String],
    required: true
  },
  fetchMeta: {
    type: Schema.Types.Mixed,
    required: true
  },
  source: {
    type: String,
    default: 'acquire'
  }
});

module.exports = mongoose.model('PreparedSample', PreparedSampleSchema, 'prepared_samples');
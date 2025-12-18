'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PreparedSampleSchema = new Schema(
  {
    timeStart: {
      type: Date,
      required: true
    },

    timeEnd: {
      type: Date,
      required: true
    },

    timeAsk: {
      type: Date,
      default: Date.now
    },

    features: {
      type: [Number],
      required: true
    }
  },
  {
    versionKey: false
  }
);

module.exports = mongoose.model(
  'PreparedSample',
  PreparedSampleSchema,
  'acquire'
);

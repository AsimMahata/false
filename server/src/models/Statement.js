import mongoose from 'mongoose';

const VersionSchema = new mongoose.Schema(
  {
    version: {
      type: String,
      required: true,
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    created_at: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  { _id: false }
);

const StatementSchema = new mongoose.Schema(
  {
    statement_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      index: true, // Format: YYYY-MM-DD
    },
    status: {
      type: Boolean,
      required: true,
      default: true,
    },
    deleted: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    current_version: {
      type: String,
      required: true,
      default: 'v1',
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      required: true, // Latest encrypted envelope
    },
    versions: {
      type: [VersionSchema],
      default: [],
    },
    created_at: {
      type: Date,
      default: Date.now,
      required: true,
    },
    updated_at: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// Compound index for fast date-based listing of active statements
StatementSchema.index({ date: 1, deleted: 1 });

export const Statement = mongoose.model('Statement', StatementSchema);

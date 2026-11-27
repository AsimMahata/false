import mongoose from 'mongoose';

const ActivityLogSchema = new mongoose.Schema(
  {
    log_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    statement_id: {
      type: String,
      required: false,
      index: true,
    },
    entry_id: {
      type: String,
      required: false,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: ['ADD', 'DELETE', 'EDIT', 'CHANGE_STATUS', 'ADD_DIARY', 'EDIT_DIARY', 'DELETE_DIARY'],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      index: -1, // Sort descending by timestamp
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// Pre-save validation: guarantee that no statement content or plaintext is ever stored in the activity log
ActivityLogSchema.pre('save', function () {
  if (this.metadata && (this.metadata.content || this.metadata.ciphertext || this.metadata.plaintext)) {
    throw new Error('Activity log must never contain statement content.');
  }
});

export const ActivityLog = mongoose.model('ActivityLog', ActivityLogSchema);

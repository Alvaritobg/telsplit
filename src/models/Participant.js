/**
 * Modelo de participante de chat/cuenta.
 * @module models/Participant
 */
const { Schema, model } = require('mongoose');

/**
 * Esquema de participante.
 */
const participantSchema = new Schema(
  {
    chatId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: Number,
      default: null,
    },
    username: {
      type: String,
      default: null,
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    interacted: {
      type: Boolean,
      default: true,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
    activeAccountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      default: null,
    },
  },
  {
    versionKey: false,
  }
);

participantSchema.index(
  { chatId: 1, userId: 1 },
  {
    unique: true,
    partialFilterExpression: { userId: { $type: 'number' } },
  }
);

participantSchema.index(
  { chatId: 1, username: 1 },
  {
    unique: true,
    partialFilterExpression: { username: { $type: 'string' } },
  }
);

module.exports = model('Participant', participantSchema);

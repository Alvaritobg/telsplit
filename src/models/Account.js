/**
 * Modelo de cuenta compartida para gastos.
 * @module models/Account
 */
const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Subdocumento de miembro de cuenta.
 * @typedef {Object} Member
 * @property {number} userId
 * @property {string} [username]
 * @property {string} [displayName]
 * @property {Date} [joinedAt]
 * @property {'owner'|'member'} [role]
 */
const MemberSchema = new Schema({
  userId: { type: Number, required: true },
  username: { type: String },
  displayName: { type: String },
  joinedAt: { type: Date, default: Date.now },
  role: { type: String, enum: ['owner', 'member'], default: 'member' },
});

/**
 * Esquema principal de cuenta.
 */
const AccountSchema = new Schema({
  name: { type: String, required: true, maxlength: 64 },
  ownerUserId: { type: Number, required: true },
  members: { type: [MemberSchema], default: [] },
  inviteCodeHash: { type: String },
  inviteToken: { type: String },
  createdAt: { type: Date, default: Date.now },
});

AccountSchema.index({ inviteToken: 1 }, { unique: true, sparse: true });
AccountSchema.index({ name: 1, ownerUserId: 1 });

/**
 * Modelo de cuenta compartida.
 */
module.exports = mongoose.model('Account', AccountSchema);
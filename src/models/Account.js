const mongoose = require('mongoose');
const { Schema } = mongoose;

const MemberSchema = new Schema({
  userId: { type: Number, required: true },
  username: { type: String },
  displayName: { type: String },
  joinedAt: { type: Date, default: Date.now },
  role: { type: String, enum: ['owner', 'member'], default: 'member' },
});

const AccountSchema = new Schema({
  name: { type: String, required: true, maxlength: 64 },
  ownerUserId: { type: Number, required: true },
  members: { type: [MemberSchema], default: [] },
  inviteCodeHash: { type: String }, // hashed code if set
  inviteToken: { type: String }, // for deep-link join
  createdAt: { type: Date, default: Date.now },
});

AccountSchema.index({ inviteToken: 1 }, { unique: true, sparse: true });
AccountSchema.index({ name: 1, ownerUserId: 1 });

module.exports = mongoose.model('Account', AccountSchema);
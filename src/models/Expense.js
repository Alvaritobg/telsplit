/**
 * Modelo de gasto compartido.
 * @module models/Expense
 */
const { Schema, model } = require('mongoose');

/**
 * Esquema de gasto.
 */
const expenseSchema = new Schema({
  chatId: { type: String, index: true },
  accountId: { type: Schema.Types.ObjectId, ref: 'Account', index: true }, // nullable for legacy/test
  payerName: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  description: { type: String, required: true, trim: true, maxlength: 500 },
  date: { type: Date, default: Date.now, index: true },
}, {
  versionKey: false,
});

/**
 * Modelo de gasto compartido.
 */
module.exports = model('Expense', expenseSchema);

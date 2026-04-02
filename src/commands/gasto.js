const Expense = require('../models/Expense');
const { parseExpenseCommand } = require('../services/expenseParser');
const { ensureParticipantByMention } = require('../services/participants');
const { buildDisplayName } = require('../utils/user');
const { formatMoney } = require('../utils/format');

function getPayerName(ctx, mention) {
  if (mention) {
    return mention.startsWith('@') ? mention : `@${mention}`;
  }

  return buildDisplayName(ctx.from);
}

async function gastoCommand(ctx) {
  try {
    if (!ctx.chat) {
      await ctx.reply('No pude identificar el chat para registrar el gasto.');
      return;
    }

    const input = ctx.message?.text?.replace(/^\/gasto(@\w+)?\s*/i, '') || '';
    const { amount, description, payerMention } = parseExpenseCommand(input);

    const payerName = getPayerName(ctx, payerMention);
    const expense = await Expense.create({
      chatId: String(ctx.chat.id),
      payerName,
      amount,
      description,
      date: new Date(),
    });

    if (payerMention) {
      await ensureParticipantByMention(ctx.chat.id, payerMention);
    }

    await ctx.reply(
      [
        'Gasto registrado correctamente.',
        `Pagador: ${expense.payerName}`,
        `Monto: ${formatMoney(expense.amount)}`,
        `Descripcion: ${expense.description}`,
      ].join('\n')
    );
  } catch (error) {
    if (error.message?.startsWith('Uso:') || error.message?.includes('monto') || error.message?.includes('descripcion')) {
      await ctx.reply(error.message);
      return;
    }

    console.error('Error in /gasto:', error);
    await ctx.reply('No pude registrar el gasto. Intenta nuevamente en unos segundos.');
  }
}

module.exports = {
  gastoCommand,
};

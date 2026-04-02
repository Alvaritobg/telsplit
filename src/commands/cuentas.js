const Expense = require('../models/Expense');
const { calculateBalances } = require('../services/settlement');
const { getParticipantsForSplit } = require('../services/participants');
const { formatMoney } = require('../utils/format');

async function cuentasCommand(ctx) {
  try {
    if (!ctx.chat) {
      await ctx.reply('No pude identificar el chat.');
      return;
    }

    const chatId = String(ctx.chat.id);
    const [expenses, participants] = await Promise.all([
      Expense.find({ chatId }).sort({ date: 1 }).lean(),
      getParticipantsForSplit(chatId),
    ]);

    if (participants.length === 0) {
      await ctx.reply('Aun no hay participantes activos. Escribe cualquier mensaje para entrar en el reparto.');
      return;
    }

    if (expenses.length === 0) {
      await ctx.reply('No hay gastos registrados en este chat. Usa /gasto para agregar uno.');
      return;
    }

    const result = calculateBalances(expenses, participants);

    const lines = [];
    lines.push('Resumen de cuentas');
    lines.push(`Participantes: ${participants.length}`);
    lines.push(`Total gastado: ${formatMoney(result.total)}`);
    lines.push(`Cuota por persona: ${formatMoney(result.share)}`);
    lines.push('');
    lines.push('Balances (Pagado - Cuota):');

    for (const balance of result.balances) {
      const sign = balance.balance >= 0 ? '+' : '-';
      lines.push(
        `- ${balance.name}: pagado ${formatMoney(balance.paid)}, cuota ${formatMoney(balance.share)}, balance ${sign}${formatMoney(Math.abs(balance.balance))}`
      );
    }

    lines.push('');
    lines.push('Liquidacion simplificada:');

    if (result.transfers.length === 0) {
      lines.push('- No hay deudas pendientes.');
    } else {
      for (const transfer of result.transfers) {
        lines.push(`- ${transfer.from} debe ${formatMoney(transfer.amount)} a ${transfer.to}`);
      }
    }

    await ctx.reply(lines.join('\n'));
  } catch (error) {
    console.error('Error in /cuentas:', error);
    await ctx.reply('No pude calcular las cuentas en este momento.');
  }
}

module.exports = {
  cuentasCommand,
};

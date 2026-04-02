const Expense = require('../models/Expense');

async function limpiarCommand(ctx) {
  try {
    if (!ctx.chat) {
      await ctx.reply('No pude identificar el chat.');
      return;
    }

    const chatId = String(ctx.chat.id);
    const result = await Expense.deleteMany({ chatId });

    await ctx.reply(
      `Se limpiaron ${result.deletedCount} gasto(s) de este chat. Puedes empezar de nuevo con /gasto.`
    );
  } catch (error) {
    console.error('Error in /limpiar:', error);
    await ctx.reply('No pude limpiar los registros. Intentalo nuevamente en unos segundos.');
  }
}

module.exports = {
  limpiarCommand,
};

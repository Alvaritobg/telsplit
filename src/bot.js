const { Telegraf } = require('telegraf');
const { gastoCommand } = require('./commands/gasto');
const { cuentasCommand } = require('./commands/cuentas');
const { limpiarCommand } = require('./commands/limpiar');
const { registerInteraction } = require('./services/participants');

function createBot(token) {
  const bot = new Telegraf(token);

  bot.use(async (ctx, next) => {
    await registerInteraction(ctx);
    return next();
  });

  bot.start(async (ctx) => {
    await ctx.reply(
      [
        'Hola, soy TelSplit.',
        'Te ayudo a registrar gastos compartidos y calcular deudas.',
        '',
        'Comandos disponibles:',
        '/gasto <monto> <descripcion> [@usuario]',
        '/cuentas',
        '/limpiar',
      ].join('\n')
    );
  });

  bot.command('gasto', gastoCommand);
  bot.command('cuentas', cuentasCommand);
  bot.command('limpiar', limpiarCommand);

  bot.catch((error, ctx) => {
    console.error(`Unhandled bot error for update ${ctx.update.update_id}:`, error);
  });

  return bot;
}

async function registerTelegramCommands(bot) {
  await bot.telegram.setMyCommands([
    { command: 'gasto', description: 'Registrar un gasto compartido' },
    { command: 'cuentas', description: 'Ver balances y liquidacion' },
    { command: 'limpiar', description: 'Borrar gastos del chat actual' },
  ]);
}

module.exports = {
  createBot,
  registerTelegramCommands,
};

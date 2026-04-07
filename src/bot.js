const { Telegraf } = require('telegraf');
const { gastoCommand } = require('./commands/gasto');
const { cuentasCommand } = require('./commands/cuentas');
const { limpiarCommand } = require('./commands/limpiar');
const {
  nuevaCuentaCommand,
  invitarCuentaCommand,
  invitarCuentaCallback,
  unirCuentaCommand,
  seleccionarCuentaCommand,
  seleccionarCuentaCallback,
  misCuentasCommand,
  listarCuentasCommand,
  cuentaActivaCommand,
} = require('./commands/account');
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
        '👋 <b>Hola, soy TelSplit.</b>',
        'Te ayudo a registrar gastos compartidos y calcular deudas entre varias personas o grupos.\n',
        '✨ <b>Comandos principales:</b>',
        '• <b>/gasto</b> <i>&lt;monto&gt; &lt;descripcion&gt; [@usuario]</i>  —  Añade un gasto. Si mencionas a alguien, esa persona paga.',
        '• <b>/cuentas</b>  —  Muestra el balance y cómo saldar las deudas.',
        '• <b>/limpiar</b>  —  Borra todos los gastos del chat o cuenta activa.\n',
        '👥 <b>Cuentas compartidas:</b>',
        '• <b>/nueva_cuenta</b>  —  Crea una cuenta/grupo para llevar gastos entre varias personas.',
        '• <b>/invitar_cuenta</b>  —  Genera un enlace/token para invitar a otros a tu cuenta.',
        '• <b>/unir_cuenta</b>  —  Únete a una cuenta usando el token de invitación.',
        '• <b>/seleccionar_cuenta</b>  —  Cambia tu cuenta activa para registrar y ver gastos.',
        '• <b>/mis_cuentas</b>  —  Lista las cuentas a las que perteneces.',
        '• <b>/listar_cuentas</b>  —  (admin) Lista todas las cuentas existentes.\n',
        '💡 <i>Puedes usar cuentas para separar gastos por grupo, piso compartido, viaje, etc.</i>',
        'Si no usas cuentas, todo funciona como antes: los gastos se guardan por chat, pero solo tu podras verlos.',
      ].join('\n'),
      { parse_mode: 'HTML' }
    );
  });

  bot.command('gasto', gastoCommand);
  bot.command('cuentas', cuentasCommand);
  bot.command('limpiar', limpiarCommand);
  bot.command('nueva_cuenta', nuevaCuentaCommand);
  bot.command('invitar_cuenta', invitarCuentaCommand);
  bot.command('unir_cuenta', unirCuentaCommand);
  bot.command('seleccionar_cuenta', seleccionarCuentaCommand);
  bot.command('mis_cuentas', misCuentasCommand);
  bot.command('listar_cuentas', listarCuentasCommand);
  bot.command('cuenta_activa', cuentaActivaCommand);

  /**
   * Crea y configura el bot de Telegram.
   * @param {string} token - Token del bot de Telegram
   * @returns {import('telegraf').Telegraf}
   */
  bot.on('callback_query', async (ctx, next) => {
    if (ctx.callbackQuery && ctx.callbackQuery.data && ctx.callbackQuery.data.startsWith('select_account_')) {
      await seleccionarCuentaCallback(ctx);
    } else {
      return next && next();
    }
  });

  bot.on('callback_query', async (ctx, next) => {
    if (ctx.callbackQuery.data.startsWith('invitar_cuenta_')) {
      return invitarCuentaCallback(ctx);
    }
    return next();
  });

  bot.catch((error, ctx) => {
    console.error(`Unhandled bot error for update ${ctx.update.update_id}:`, error);
  });

  return bot;
}

/**
 * Registra los comandos de Telegram para el menú de comandos.
 * @param {import('telegraf').Telegraf} bot
 */
async function registerTelegramCommands(bot) {
  await bot.telegram.setMyCommands([
    { command: 'gasto', description: 'Registrar un gasto compartido' },
    { command: 'cuentas', description: 'Ver balances y liquidacion' },
    { command: 'limpiar', description: 'Borrar gastos del chat actual' },
    { command: 'nueva_cuenta', description: 'Crear una cuenta compartida' },
    { command: 'invitar_cuenta', description: 'Generar enlace de invitación para una cuenta' },
    { command: 'unir_cuenta', description: 'Unirse a una cuenta con token' },
    { command: 'seleccionar_cuenta', description: 'Seleccionar cuenta activa' },
    { command: 'mis_cuentas', description: 'Ver tus cuentas' },
    { command: 'cuenta_activa', description: 'Ver tu cuenta activa actual' },
    { command: 'listar_cuentas', description: 'Listar cuentas (admin)' },
  ]);
}

module.exports = {
  createBot,
  registerTelegramCommands,
};

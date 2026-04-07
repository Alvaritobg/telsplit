/**
 * Muestra la cuenta activa del usuario en el chat actual.
 * @param {import('telegraf').Context} ctx
 */
async function cuentaActivaCommand(ctx) {
  const userId = ctx.from?.id;
  const chatId = String(ctx.chat.id);
  const Participant = require('../models/Participant');

  const participant = await Participant.findOne({ userId, chatId });
  if (!participant || !participant.activeAccountId) {
    await ctx.reply('No tienes ninguna cuenta activa seleccionada. Usa /seleccionar_cuenta para elegir una.');
    return;
  }

  const account = await Account.findById(participant.activeAccountId);
  if (!account) {
    await ctx.reply('La cuenta activa seleccionada ya no existe. Usa /seleccionar_cuenta para elegir otra.');
    return;
  }

  await ctx.replyWithHTML(
    `🏷️ <b>Cuenta activa:</b>\n` +
    `• <b>Nombre:</b> ${account.name}\n` +
    `• <b>Miembros:</b> ${account.members.length}`
  );
}
const Account = require('../models/Account');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const rateLimit = {};
function isRateLimited(userId, command) {
  const key = `${userId}:${command}`;
  const now = Date.now();
  if (!rateLimit[key] || now - rateLimit[key] > 60 * 1000) {
    rateLimit[key] = now;
    return false;
  }
  return true;
}

/**
 * Crea una nueva cuenta/grupo y añade al usuario como owner.
 * @param {import('telegraf').Context} ctx
 */
async function cuentaCrearCommand(ctx) {
  const userId = ctx.from?.id;
  if (!userId) return ctx.reply('No se pudo identificar tu usuario.');
  if (isRateLimited(userId, 'cuenta_crear')) return ctx.reply('Espera unos segundos antes de crear otra cuenta.');

  const args = ctx.message.text.split(' ').slice(1);
  const name = args[0];
  const clave = args[1];
  if (!name || name.length < 3 || name.length > 64) return ctx.reply('El nombre debe tener entre 3 y 64 caracteres.');

  let inviteCodeHash = undefined;
  if (clave) {
    if (clave.length < 4 || clave.length > 32) return ctx.reply('La clave debe tener entre 4 y 32 caracteres.');
    inviteCodeHash = await bcrypt.hash(clave, 8);
  }
  const inviteToken = crypto.randomBytes(16).toString('hex');

  const account = await Account.create({
    name,
    ownerUserId: userId,
    members: [{ userId, username: ctx.from.username ? `@${ctx.from.username}` : null, displayName: ctx.from.first_name, role: 'owner' }],
    inviteCodeHash,
    inviteToken,
  });
  await ctx.reply(`Cuenta creada: ${name}\nID: ${account._id}\nUsa /cuenta_invitar ${account._id} para invitar a otros.`);
}

/**
 * Genera un enlace/token de invitación para una cuenta existente.
 * Solo el owner puede invitar.
 * @param {import('telegraf').Context} ctx
 */
async function cuentaInvitarCommand(ctx) {
  const userId = ctx.from?.id;
  if (!userId) return ctx.reply('No se pudo identificar tu usuario.');
  if (isRateLimited(userId, 'cuenta_invitar')) return ctx.reply('Espera antes de generar otro enlace.');
  const args = ctx.message.text.split(' ').slice(1);
  const accountId = args[0];

  // Si no se pasa argumento, mostrar menú de cuentas donde es owner
  if (!accountId) {
    const accounts = await Account.find({ ownerUserId: userId });
    if (!accounts.length) return ctx.reply('No tienes cuentas donde seas propietario para invitar.');
    return ctx.reply(
      'Selecciona la cuenta para generar el enlace de invitación:',
      {
        reply_markup: {
          inline_keyboard: accounts.map(acc => [{
            text: acc.name,
            callback_data: `invitar_cuenta_${acc._id}`
          }])
        }
      }
    );
  }

  // Flujo clásico: se pasa el ID
  const account = await Account.findById(accountId);
  if (!account) return ctx.reply('Cuenta no encontrada.');
  if (account.ownerUserId !== userId) return ctx.reply('Solo el propietario puede invitar.');
  // Regenera token
  account.inviteToken = crypto.randomBytes(16).toString('hex');
  await account.save();
  let msg = `Enlace de invitación:\nhttps://t.me/${ctx.botInfo.username}?start=join-${account.inviteToken}`;
  if (account.inviteCodeHash) msg += '\nEsta cuenta requiere clave.';
  await ctx.reply(msg);
}

/**
 * Permite a un usuario unirse a una cuenta usando un token (y clave opcional).
 * @param {import('telegraf').Context} ctx
 */
async function cuentaUnirCommand(ctx) {
  const userId = ctx.from?.id;
  if (!userId) return ctx.reply('No se pudo identificar tu usuario.');
  if (isRateLimited(userId, 'cuenta_unir')) return ctx.reply('Espera antes de intentar unirte de nuevo.');
  const args = ctx.message.text.split(' ').slice(1);
  const token = args[0];
  const clave = args[1];
  if (!token) return ctx.reply('Debes indicar el token de invitación.');
  const account = await Account.findOne({ inviteToken: token });
  if (!account) return ctx.reply('Invitación no válida o expirada.');
  if (account.inviteCodeHash) {
    if (!clave) return ctx.reply('Esta cuenta requiere clave. Usa /cuenta_unir <token> <clave>.');
    const ok = await bcrypt.compare(clave, account.inviteCodeHash);
    if (!ok) return ctx.reply('Clave incorrecta.');
  }
  if (account.members.some(m => m.userId === userId)) return ctx.reply('Ya eres miembro de esta cuenta.');
  account.members.push({ userId, username: ctx.from.username ? `@${ctx.from.username}` : null, displayName: ctx.from.first_name });
  await account.save();
  await ctx.reply(`Te has unido a la cuenta: ${account.name}`);
}

/**
 * Permite seleccionar la cuenta activa del usuario, mostrando menú si no se pasa argumento.
 * Guarda la selección en la base de datos.
 * @param {import('telegraf').Context} ctx
 */
async function seleccionarCuentaCommand(ctx) {
  const userId = ctx.from?.id;
  if (!userId) return ctx.reply('No se pudo identificar tu usuario.');
  const args = ctx.message.text.split(' ').slice(1);
  let accountId = args[0];

  // Si no se pasa argumento, mostrar menú de cuentas
  if (!accountId) {
    const accounts = await Account.find({ 'members.userId': userId });
    if (!accounts.length) return ctx.reply('No tienes cuentas para seleccionar.');
    // Mostrar menú con botones
    return ctx.reply(
      'Selecciona una cuenta:',
      {
        reply_markup: {
          inline_keyboard: accounts.map(acc => [{
            text: acc.name,
            callback_data: `select_account_${acc._id}`
          }])
        }
      }
    );
  }

  // Selección directa por ID
  const account = await Account.findById(accountId);
  if (!account) return ctx.reply('Cuenta no encontrada.');
  if (!account.members.some(m => m.userId === userId)) return ctx.reply('No eres miembro de esta cuenta.');

  // Guardar la cuenta activa en Participant
  const Participant = require('../models/Participant');
  const chatId = String(ctx.chat.id);
  let participant = await Participant.findOne({ userId, chatId });
  if (!participant) {
    participant = new Participant({
      userId,
      chatId,
      displayName: ctx.from.first_name || 'Usuario',
      interacted: true,
      lastSeenAt: new Date(),
    });
  }
  participant.activeAccountId = accountId;
  await participant.save();

  await ctx.reply(`Cuenta activa: ${account.name}`);
}
// Handler para callback de selección de cuenta
/**
 * Handler para el callback de selección de cuenta desde el menú inline.
 * Guarda la selección en la base de datos.
 * @param {import('telegraf').Context} ctx
 */
async function seleccionarCuentaCallback(ctx) {
  const userId = ctx.from?.id;
  if (!userId) return ctx.answerCbQuery('No se pudo identificar tu usuario.');
  const data = ctx.callbackQuery.data;
  const match = data.match(/^select_account_(.+)$/);
  if (!match) return ctx.answerCbQuery('Selección inválida.');
  const accountId = match[1];
  const account = await Account.findById(accountId);
  if (!account) return ctx.answerCbQuery('Cuenta no encontrada.');
  if (!account.members.some(m => m.userId === userId)) return ctx.answerCbQuery('No eres miembro de esta cuenta.');
  // Guardar la cuenta activa en Participant
  const Participant = require('../models/Participant');
  const chatId = String(ctx.chat.id);
  let participant = await Participant.findOne({ userId, chatId });
  if (!participant) {
    participant = new Participant({
      userId,
      chatId,
      displayName: ctx.from.first_name || 'Usuario',
      interacted: true,
      lastSeenAt: new Date(),
    });
  }
  participant.activeAccountId = accountId;
  await participant.save();

  await ctx.editMessageText(`Cuenta activa: ${account.name}`);
  await ctx.answerCbQuery('Cuenta seleccionada');
}

/**
 * Lista todas las cuentas a las que pertenece el usuario.
 * @param {import('telegraf').Context} ctx
 */
async function misCuentasCommand(ctx) {
  const userId = ctx.from?.id;
  if (!userId) return ctx.reply('No se pudo identificar tu usuario.');
  const accounts = await Account.find({ 'members.userId': userId });
  if (!accounts.length) return ctx.reply('No tienes cuentas.');
  let msg = 'Tus cuentas:\n';
  for (const acc of accounts) {
    msg += `- ${acc.name} (ID: ${acc._id})\n`;
  }
  await ctx.reply(msg);
}


/**
 * Lista todas las cuentas del sistema (solo admin).
 * @param {import('telegraf').Context} ctx
 */
async function listarCuentasCommand(ctx) {
  const userId = ctx.from?.id;
  const ADMIN_ID = process.env.ADMIN_ID ? Number(process.env.ADMIN_ID) : null;
  if (!ADMIN_ID || userId !== ADMIN_ID) return ctx.reply('Solo el administrador puede listar todas las cuentas.');
  const accounts = await Account.find().limit(10);
  let msg = 'Cuentas existentes:\n';
  for (const acc of accounts) {
    msg += `- ${acc.name} (ID: ${acc._id})\n`;
  }
  await ctx.reply(msg);
}

// Callback para generar enlace de invitación desde el menú inline
async function invitarCuentaCallback(ctx) {
  const userId = ctx.from?.id;
  if (!userId) return ctx.answerCbQuery('No se pudo identificar tu usuario.');
  const data = ctx.callbackQuery.data;
  const match = data.match(/^invitar_cuenta_(.+)$/);
  if (!match) return ctx.answerCbQuery('Selección inválida.');
  const accountId = match[1];
  const account = await Account.findById(accountId);
  if (!account) return ctx.reply('Cuenta no encontrada.');
  if (account.ownerUserId !== userId) return ctx.reply('Solo el propietario puede invitar.');
  // Regenera token
  account.inviteToken = crypto.randomBytes(16).toString('hex');
  await account.save();
  let msg = `Enlace de invitación:\nhttps://t.me/${ctx.botInfo.username}?start=join-${account.inviteToken}`;
  if (account.inviteCodeHash) msg += '\nEsta cuenta requiere clave.';
  await ctx.reply(msg);
  await ctx.answerCbQuery('Enlace generado.');
}

module.exports = {
  nuevaCuentaCommand: cuentaCrearCommand,
  invitarCuentaCommand: cuentaInvitarCommand,
  invitarCuentaCallback,
  unirCuentaCommand: cuentaUnirCommand,
  seleccionarCuentaCommand,
  seleccionarCuentaCallback,
  misCuentasCommand,
  listarCuentasCommand,
  cuentaActivaCommand,
};

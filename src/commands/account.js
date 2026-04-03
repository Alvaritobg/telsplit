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

async function cuentaInvitarCommand(ctx) {
  const userId = ctx.from?.id;
  if (!userId) return ctx.reply('No se pudo identificar tu usuario.');
  if (isRateLimited(userId, 'cuenta_invitar')) return ctx.reply('Espera antes de generar otro enlace.');
  const args = ctx.message.text.split(' ').slice(1);
  const accountId = args[0];
  if (!accountId) return ctx.reply('Debes indicar el ID de la cuenta.');
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

async function seleccionarCuentaCommand(ctx) {
  const userId = ctx.from?.id;
  if (!userId) return ctx.reply('No se pudo identificar tu usuario.');
  const args = ctx.message.text.split(' ').slice(1);
  const accountId = args[0];
  if (!accountId) return ctx.reply('Debes indicar el ID de la cuenta.');
  const account = await Account.findById(accountId);
  if (!account) return ctx.reply('Cuenta no encontrada.');
  if (!account.members.some(m => m.userId === userId)) return ctx.reply('No eres miembro de esta cuenta.');
  // Guardar en session o base de datos real (aquí solo ejemplo en memoria)
  ctx.session = ctx.session || {};
  ctx.session.activeAccountId = accountId;
  await ctx.reply(`Cuenta activa: ${account.name}`);
}

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

module.exports = {
  nuevaCuentaCommand: cuentaCrearCommand,
  invitarCuentaCommand: cuentaInvitarCommand,
  unirCuentaCommand: cuentaUnirCommand,
  seleccionarCuentaCommand,
  misCuentasCommand,
  listarCuentasCommand,
};

function parseExpenseCommand(input) {
  const raw = (input || '').trim();
  if (!raw) {
    throw new Error('Uso: /gasto <monto> <descripcion> [@usuario]');
  }

  const amountMatch = raw.match(/^(-?\d+(?:[.,]\d+)?)\s+/);
  if (!amountMatch) {
    throw new Error('Debes indicar un monto valido al inicio. Ejemplo: /gasto 25.50 cena');
  }

  const amount = Number(amountMatch[1].replace(',', '.'));
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('El monto debe ser un numero mayor que 0.');
  }

  const remainder = raw.slice(amountMatch[0].length).trim();
  if (!remainder) {
    throw new Error('Debes incluir una descripcion del gasto.');
  }

  const payerMentionMatch = remainder.match(/\s(@[A-Za-z0-9_]{5,})\s*$/);
  const payerMention = payerMentionMatch ? payerMentionMatch[1] : null;

  const description = payerMention
    ? remainder.slice(0, remainder.length - payerMention.length).trim()
    : remainder;

  if (!description) {
    throw new Error('La descripcion no puede quedar vacia.');
  }

  return {
    amount,
    description,
    payerMention,
  };
}

module.exports = {
  parseExpenseCommand,
};

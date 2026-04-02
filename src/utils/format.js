function formatMoney(value) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(value);
}

function toCents(value) {
  return Math.round(value * 100);
}

function fromCents(value) {
  return value / 100;
}

module.exports = {
  formatMoney,
  toCents,
  fromCents,
};

const { fromCents, toCents } = require('../utils/format');

function calculateBalances(expenses, participantNames) {
  if (!participantNames || participantNames.length === 0) {
    return {
      total: 0,
      share: 0,
      balances: [],
      transfers: [],
    };
  }

  const totalCents = expenses.reduce((acc, expense) => acc + toCents(expense.amount), 0);
  const paidByName = new Map(participantNames.map((name) => [name, 0]));

  for (const expense of expenses) {
    if (!paidByName.has(expense.payerName)) {
      paidByName.set(expense.payerName, 0);
    }
    paidByName.set(expense.payerName, paidByName.get(expense.payerName) + toCents(expense.amount));
  }

  const count = participantNames.length;
  const baseShare = Math.floor(totalCents / count);
  const remainder = totalCents - baseShare * count;

  const balancesInCents = participantNames.map((name, index) => {
    const share = baseShare + (index < remainder ? 1 : 0);
    const paid = paidByName.get(name) || 0;

    return {
      name,
      paid,
      share,
      balance: paid - share,
    };
  });

  const transfers = simplifyTransfers(balancesInCents);

  return {
    total: fromCents(totalCents),
    share: fromCents(totalCents / count),
    balances: balancesInCents.map((item) => ({
      name: item.name,
      paid: fromCents(item.paid),
      share: fromCents(item.share),
      balance: fromCents(item.balance),
    })),
    transfers,
  };
}

function simplifyTransfers(balancesInCents) {
  const debtors = balancesInCents
    .filter((person) => person.balance < 0)
    .map((person) => ({ ...person, remaining: -person.balance }))
    .sort((a, b) => b.remaining - a.remaining);

  const creditors = balancesInCents
    .filter((person) => person.balance > 0)
    .map((person) => ({ ...person, remaining: person.balance }))
    .sort((a, b) => b.remaining - a.remaining);

  const transfers = [];

  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];

    const settled = Math.min(debtor.remaining, creditor.remaining);

    if (settled > 0) {
      transfers.push({
        from: debtor.name,
        to: creditor.name,
        amount: fromCents(settled),
      });
    }

    debtor.remaining -= settled;
    creditor.remaining -= settled;

    if (debtor.remaining === 0) {
      debtorIndex += 1;
    }

    if (creditor.remaining === 0) {
      creditorIndex += 1;
    }
  }

  return transfers;
}

module.exports = {
  calculateBalances,
};

function buildDisplayName(user) {
  if (!user) {
    return 'Desconocido';
  }

  if (user.username) {
    return `@${user.username}`;
  }

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
  return fullName || `Usuario ${user.id}`;
}

module.exports = {
  buildDisplayName,
};

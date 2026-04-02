const Participant = require('../models/Participant');
const { buildDisplayName } = require('../utils/user');

async function registerInteraction(ctx) {
  if (!ctx.chat || !ctx.from || ctx.from.is_bot) {
    return;
  }

  const chatId = String(ctx.chat.id);
  const userId = ctx.from.id;
  const username = ctx.from.username ? `@${ctx.from.username}` : null;
  const displayName = buildDisplayName(ctx.from);

  try {
    await Participant.findOneAndUpdate(
      { chatId, userId },
      {
        $set: {
          chatId,
          userId,
          username,
          displayName,
          interacted: true,
          lastSeenAt: new Date(),
        },
      },
      {
        upsert: true,
        new: true,
      }
    );
  } catch (error) {
    console.error('Error registering participant interaction:', error.message);
  }
}

async function ensureParticipantByMention(chatId, mention) {
  if (!chatId || !mention) {
    return;
  }

  const normalizedMention = mention.startsWith('@') ? mention : `@${mention}`;

  await Participant.findOneAndUpdate(
    { chatId: String(chatId), username: normalizedMention },
    {
      $set: {
        chatId: String(chatId),
        username: normalizedMention,
        displayName: normalizedMention,
        lastSeenAt: new Date(),
      },
      $setOnInsert: {
        interacted: false,
      },
    },
    {
      upsert: true,
      new: true,
    }
  );
}

async function getParticipantsForSplit(chatId) {
  const participants = await Participant.find({
    chatId: String(chatId),
    interacted: true,
  })
    .sort({ displayName: 1 })
    .lean();

  return participants.map((item) => item.displayName);
}

module.exports = {
  registerInteraction,
  ensureParticipantByMention,
  getParticipantsForSplit,
};

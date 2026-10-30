export const ALIENTO_EMOJIS = {
  fuego: '🔥',
  fuerza: '💪',
  aplauso: '👏',
  corazon: '❤️',
  estrella: '⭐',
} as const;

export type AlientoEmojiId = keyof typeof ALIENTO_EMOJIS;

export const ALIENTO_EMOJI_IDS = Object.keys(ALIENTO_EMOJIS) as AlientoEmojiId[];

export const ALIENTO_RATE_LIMIT_MS = 10_000;

export function esAlientoEmojiValido(emojiId: string): emojiId is AlientoEmojiId {
  return emojiId in ALIENTO_EMOJIS;
}

export function emojiDeAliento(emojiId: AlientoEmojiId): string {
  return ALIENTO_EMOJIS[emojiId];
}

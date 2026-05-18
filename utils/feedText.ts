const decodeEntity = (entity: string) => {
  const namedEntities: Record<string, string> = {
    amp: '&',
    apos: "'",
    gt: '>',
    ldquo: '"',
    lsquo: "'",
    mdash: '-',
    nbsp: ' ',
    ndash: '-',
    quot: '"',
    rdquo: '"',
    rsquo: "'",
    lt: '<',
  };

  if (entity.startsWith('#x')) {
    const code = Number.parseInt(entity.slice(2), 16);
    return Number.isFinite(code) ? String.fromCodePoint(code) : `&${entity};`;
  }

  if (entity.startsWith('#')) {
    const code = Number.parseInt(entity.slice(1), 10);
    return Number.isFinite(code) ? String.fromCodePoint(code) : `&${entity};`;
  }

  return namedEntities[entity] || `&${entity};`;
};

export const cleanFeedText = (value?: string) =>
  (value || '')
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&([a-zA-Z]+|#[0-9]+|#x[0-9a-fA-F]+);/g, (_, entity: string) => decodeEntity(entity))
    .replace(/={3,}/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^n this episode\b/i, 'In this episode')
    .replace(/^[^A-Za-z0-9"']+/, '')
    .trim();

export const excerptFeedText = (value?: string, max = 240) => {
  const clean = cleanFeedText(value);
  return clean.length > max ? `${clean.slice(0, max).trim()}...` : clean;
};

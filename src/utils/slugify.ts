const normalizeSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9一-鿿]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const slugifyStr = (str: string): string => normalizeSlug(str);

export const slugifyAll = (arr: string[]) => arr.map(str => slugifyStr(str));

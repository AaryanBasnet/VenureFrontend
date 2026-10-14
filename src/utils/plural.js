// "1 guest", "2 guests". Pass the plural form for words that do not just add an s ("inquiry", "inquiries").
export const plural = (n, word, pluralWord = `${word}s`) => `${n} ${Number(n) === 1 ? word : pluralWord}`;

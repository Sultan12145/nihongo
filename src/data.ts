import type { GrammarPoint, KanjiCard, Lesson, VocabularyCard } from './types'

const today = new Date().toISOString().slice(0, 10)

export const lessons: Lesson[] = [
  { id: 1, title: 'りんご', subtitle: 'Яблоки и сельское хозяйство', status: 'active', progress: 38, wordCount: 18, grammarCount: 5, kanjiCount: 12 },
  { id: 2, title: 'スーパーマーケット', subtitle: 'Покупки и магазины', status: 'available', progress: 0, wordCount: 22, grammarCount: 4, kanjiCount: 10 },
  { id: 3, title: '日本人と洋服', subtitle: 'Одежда и привычки', status: 'locked', progress: 0, wordCount: 20, grammarCount: 4, kanjiCount: 11 },
  { id: 4, title: '日本の国土 — 山と川', subtitle: 'География Японии', status: 'locked', progress: 0, wordCount: 24, grammarCount: 5, kanjiCount: 13 },
  { id: 5, title: '桜の花', subtitle: 'Сакура и времена года', status: 'locked', progress: 0, wordCount: 19, grammarCount: 4, kanjiCount: 10 },
]

export const vocabulary: VocabularyCard[] = [
  {
    id: 'v1', lesson: 1, written: '産地', reading: 'さんち', meanings: ['район производства', 'место происхождения продукции'],
    examples: [
      { japanese: '青森県はりんごの産地として有名です。', reading: 'あおもりけんはりんごのさんちとしてゆうめいです。', translation: 'Префектура Аомори известна как район выращивания яблок.' },
      { japanese: 'このお茶の産地は静岡です。', reading: 'このおちゃのさんちはしずおかです。', translation: 'Место производства этого чая — Сидзуока.' },
    ], note: '産 — производить; 地 — место, земля.', due: today, interval: 0,
  },
  {
    id: 'v2', lesson: 1, written: '栽培', reading: 'さいばい', meanings: ['выращивание', 'культивирование'],
    examples: [
      { japanese: 'この地方では米を栽培しています。', reading: 'このちほうではこめをさいばいしています。', translation: 'В этой местности выращивают рис.' },
      { japanese: '温室で野菜を栽培する。', reading: 'おんしつでやさいをさいばいする。', translation: 'Выращивать овощи в теплице.' },
    ], note: 'Употребляется для намеренного выращивания сельскохозяйственных культур.', due: today, interval: 0,
  },
  {
    id: 'v3', lesson: 1, written: '旬', reading: 'しゅん', meanings: ['сезон наилучшего вкуса продукта', 'самое подходящее время'],
    examples: [
      { japanese: '秋はりんごが旬を迎えます。', reading: 'あきはりんごがしゅんをむかえます。', translation: 'Осенью наступает сезон яблок.' },
      { japanese: '旬の魚はおいしい。', reading: 'しゅんのさかなはおいしい。', translation: 'Сезонная рыба вкусная.' },
    ], note: 'Не просто «время года», а период, когда продукт особенно свеж и вкусен.', due: today, interval: 0,
  },
]

export const grammar: GrammarPoint[] = [
  {
    id: 'g1', lesson: 1, title: 'Nとして', explanation: 'Показывает роль, качество или статус, в котором выступает человек или предмет.', formation: 'Существительное + として',
    examples: [
      { japanese: '青森県はりんごの産地として有名です。', translation: 'Префектура Аомори известна как район выращивания яблок.' },
      { japanese: '留学生として日本へ来ました。', translation: 'Я приехал в Японию в качестве иностранного студента.' },
    ], due: today,
  },
  {
    id: 'g2', lesson: 1, title: 'Nだけ', explanation: 'Ограничивает множество: «только N». В зависимости от контекста может нести нейтральный оттенок.', formation: 'Существительное + だけ',
    examples: [
      { japanese: '一人だけ来ませんでした。', translation: 'Только один человек не пришёл.' },
      { japanese: '水だけ飲みました。', translation: 'Я выпил только воду.' },
    ], due: today,
  },
  {
    id: 'g3', lesson: 1, title: '～なければ、～ない', explanation: 'Условная конструкция: если условие не выполнено, результат невозможен.', formation: 'V-ない → V-なければ + отрицательный результат',
    examples: [
      { japanese: '秋の終わりでなければ、食べられない。', translation: 'Это нельзя есть, если ещё не конец осени.' },
      { japanese: '急がなければ、間に合わない。', translation: 'Если не поторопиться, не успеем.' },
    ], due: today,
  },
]

export const kanji: KanjiCard[] = [
  { id: 'k1', lesson: 1, character: '産', meanings: ['производить', 'рождать'], onyomi: ['サン'], kunyomi: ['う-む', 'う-まれる'], examples: [{ word: '産地', reading: 'さんち', translation: 'район производства' }, { word: '生産', reading: 'せいさん', translation: 'производство' }], strokes: 11, due: today },
  { id: 'k2', lesson: 1, character: '栽', meanings: ['сажать', 'выращивать'], onyomi: ['サイ'], kunyomi: [], examples: [{ word: '栽培', reading: 'さいばい', translation: 'выращивание' }, { word: '盆栽', reading: 'ぼんさい', translation: 'бонсай' }], strokes: 10, due: today },
  { id: 'k3', lesson: 1, character: '旬', meanings: ['декада', 'лучший сезон'], onyomi: ['ジュン', 'シュン'], kunyomi: [], examples: [{ word: '旬', reading: 'しゅん', translation: 'сезон продукта' }, { word: '上旬', reading: 'じょうじゅん', translation: 'первая декада месяца' }], strokes: 6, due: today },
]

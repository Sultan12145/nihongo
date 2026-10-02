export type View = 'home' | 'lessons' | 'lesson' | 'words' | 'grammar' | 'kanji' | 'books' | 'editor' | 'progress' | 'settings'

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy'

export interface VocabularyCard {
  id: string
  lesson: number
  written: string
  reading: string
  meanings: string[]
  examples: Array<{ japanese: string; reading: string; translation: string }>
  note?: string
  due: string
  interval: number
}

export interface GrammarPoint {
  id: string
  lesson: number
  title: string
  explanation: string
  formation: string
  examples: Array<{ japanese: string; translation: string }>
  due: string
}

export interface KanjiCard {
  id: string
  lesson: number
  character: string
  meanings: string[]
  onyomi: string[]
  kunyomi: string[]
  examples: Array<{ word: string; reading: string; translation: string }>
  strokes: number
  due: string
}

export interface Lesson {
  id: number
  title: string
  subtitle: string
  status: 'available' | 'active' | 'locked'
  progress: number
  wordCount: number
  grammarCount: number
  kanjiCount: number
}

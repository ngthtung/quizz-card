export type Flashcard = {
  id: string;
  languageId: string;
  mainText: string;
  variant1: string;
  variant2: string;
  variant3: string;
  meaning: string;
  notes?: string;
  tags: string[];
  rememberedCount: number;
  forgottenCount: number;
  lastReviewedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateFlashcardInput = {
  languageId: string;
  mainText: string;
  variant1?: string;
  variant2?: string;
  variant3?: string;
  meaning?: string;
  notes?: string;
  tags?: string[];
};

export type UpdateFlashcardInput = Partial<
  Omit<
    Flashcard,
    'id' | 'createdAt' | 'updatedAt' | 'rememberedCount' | 'forgottenCount'
  >
>;

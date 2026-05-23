export type ImportRow = {
  language?: string;
  mainText?: string;
  variant1?: string;
  variant2?: string;
  variant3?: string;
  meaning?: string;
  notes?: string;
  tags?: string | string[];
};

export type ImportResult = {
  imported: number;
  errors: { row: number; message: string }[];
  createdLanguages: string[];
};

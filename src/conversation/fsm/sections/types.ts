export type SectionId = 
  | 'WELCOME'
  | 'LANGUAGE_SELECTION'
  | 'PERSONAL_INFO'
  | 'SUMMARY'
  | 'EXPERIENCE'
  | 'EDUCATION'
  | 'SKILLS'
  | 'PROJECTS'
  | 'CERTIFICATIONS'
  | 'LANGUAGES'
  | 'HOBBIES'
  | 'REFERENCES'
  | 'REVIEW';

export interface FieldDefinition {
  id: string;
  name: { en: string; sw: string };
  required: boolean;
  prompt: { en: string; sw: string };
}

export interface SectionDefinition {
  id: SectionId;
  name: { en: string; sw: string };
  order: number;
  required: boolean;
  fields: FieldDefinition[];
  introPrompt: { en: string; sw: string };
  isMultiItem: boolean; // e.g. multiple experiences
}

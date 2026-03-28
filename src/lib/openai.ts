import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

export interface AuthenticityResult {
  authenticityScore: number;
  labelMatchScore: number;
  matrixNumberScore: number;
  typographyScore: number;
  serialRangeScore: number;
  authenticityNotes: string;
  labelMatchJustification: string;
  matrixNumberJustification: string;
  typographyJustification: string;
  serialRangeJustification: string;
}

export interface ConditionResult {
  conditionScore: number;
  vinylSurfaceScore: number;
  sleeveScore: number;
  labelConditionScore: number;
  edgesScore: number;
  conditionNotes: string;
  surfaceJustification: string;
  sleeveJustification: string;
  labelJustification: string;
  edgesJustification: string;
}

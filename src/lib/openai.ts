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
}

export interface ConditionResult {
  conditionScore: number;
  vinylSurfaceScore: number;
  sleeveScore: number;
  labelConditionScore: number;
  edgesScore: number;
  conditionNotes: string;
}

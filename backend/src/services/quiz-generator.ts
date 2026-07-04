import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";

const QuizQuestionSchema = z.object({
  word: z.string().describe("The target vocabulary word from the passage"),
  sentence: z
    .string()
    .describe(
      "The original sentence from the passage where the target word has been replaced with ____ (four underscores) to create a fill-in-the-blank question",
    ),
  options: z
    .array(z.string())
    .length(4)
    .describe(
      "Four answer choices — the correct word plus three plausible distractors that fit the context grammatically and semantically",
    ),
  correctAnswer: z
    .string()
    .describe("The correct word that fills the blank (must exactly match one of the options)"),
});

const QuizOutputSchema = z.object({
  questions: z
    .array(QuizQuestionSchema)
    .length(5)
    .describe("Exactly five quiz questions derived from the passage"),
});

type QuizOutput = z.infer<typeof QuizOutputSchema>;

function buildModel(): ChatOpenAI {
  return new ChatOpenAI({
    apiKey: process.env.SILICONFLOW_API_KEY,
    modelName: "zai-org/GLM-5.2",
    temperature: 0.7,
    configuration: {
      baseURL: "https://api.siliconflow.cn/v1",
    },
  });
}

const quizPrompt = PromptTemplate.fromTemplate(`
You are an expert English-language quiz generator for learners.  Given a passage of text, complete the following tasks:

1. Identify exactly 5 words that are the most meaningful to learn — prioritise intermediate-to-advanced vocabulary.
2. For each word, copy the **exact original sentence** that contains it, then replace the target word with ____ to create a fill-in-the-blank question.
3. Provide four answer options: the correct word plus three plausible distractors.  All distractors must be grammatically compatible with the blank and semantically reasonable in context.
4. Return the results in the structured JSON format defined below.

Passage:
---
{stageContent}
---
`);

export async function generateQuizzesFromStageContent(
  stageContent: string,
): Promise<QuizOutput["questions"]> {
  const model = buildModel();
  const chain = quizPrompt.pipe(model.withStructuredOutput(QuizOutputSchema));

  const trimmed = stageContent.slice(0, 6000);
  const result = await chain.invoke({ stageContent: trimmed });

  return result.questions;
}

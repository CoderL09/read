import type { ISentenceChunk } from "../models/SenseChunk.js";

function splitIntoSentences(text: string): string[] {
  // Split on sentence-ending punctuation followed by whitespace and a capital letter
  const raw = text.replace(/([.!?]["')\]]*)\s+(?=[A-Z"'(])/g, "$1\u0001");
  // Split on paragraph boundaries
  const segments = raw.split(/\u0001|\n\n+/);

  return segments
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => s.length > 3);
}

function chunkSentence(sentence: string): string[] {
  let result = sentence;

  // 1. Relative clauses: "..., who/which/that ..."
  result = result.replace(
    /([,;])?\s+(?=(?:who|which|that|whom|whose)\s)/gi,
    " / ",
  );

  // 2. Subordinating conjunctions
  result = result.replace(
    /([,;])?\s+(?=(?:because|although|though|whereas|while|unless|until|since|after|before|once|whenever|whereas|whereby|if|when|where)\s)/gi,
    " / ",
  );

  // 3. Coordinating conjunctions joining clauses
  result = result.replace(
    /([,;])?\s+(?=(?:and|but|or|nor|yet|so)\s+(?:the|a|an|this|that|these|those|it|he|she|they|we|I|you|there|here|he's|she's|it's|they're|there's|there're)\b)/gi,
    " / ",
  );

  // 4. Participial phrases: "..., standing quietly", "..., lost in thought"
  result = result.replace(
    /([,;])\s+(?=(?:standing|sitting|lying|walking|running|looking|staring|gazing|waiting|thinking|knowing|feeling|hoping|wondering|trying|holding|carrying|wearing|smiling|laughing|crying|turning|moving|falling|rising|hanging|floating|passing|leaving|arriving|finding|seeking|searching|struggling|fighting|seeming|appearing|remaining|becoming|growing|getting)\s)/gi,
    " / ",
  );

  // 5. Infinitive phrases used adverbially: "... / to find his way"
  result = result.replace(
    /([,;])\s+(?=(?:to\s+(?:find|see|make|get|take|keep|give|bring|tell|show|help|let|allow|protect|save|avoid|prevent|stop|start|begin|continue|learn|teach|understand|discover|create|build|become|prove|ensure)))/gi,
    " / ",
  );

  // 6. Prepositional phrases at natural boundaries
  result = result.replace(
    /([,;])\s+(?=(?:in|on|at|to|for|with|from|by|about|into|through|during|after|before|over|under|between|within|without|toward|towards|upon|across|along|around|behind|beyond|against|among|amongst)\s+(?:the|a|an|my|your|his|her|our|their|its)\b)\s*/gi,
    " / ",
  );

  // Clean up double slashes
  result = result.replace(/\s*\/\s*\/\s*/g, " / ");

  const chunks = result
    .split(/\s*\/\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return normalizeRhythmChunks(sentence, chunks);
}

const functionWordOnly = /^(?:a|an|the|to|of|for|with|from|by|at|in|on|and|but|or|that|who|which)$/i;
const trailingConnector = /\b(?:out of|away from|up to|down to|back to|over to|through to|into|onto|with|from|for|to|of|at|by|up|down|out|off|away|back|over|through)$/i;
const leadingParticle = /^(?:up|down|out|off|away|back|over|through|into|onto)\b/i;
const leadingObject = /^(?:the|a|an|this|that|these|those|my|your|his|her|our|their|its)\b/i;

export function normalizeRhythmChunks(sentence: string, input: string[]): string[] {
  const chunks = input.map((chunk) => chunk.replace(/\s+/g, " ").trim()).filter(Boolean);
  const merged: string[] = [];

  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    const words = chunk.split(/\s+/);

    if ((words.length === 1 || functionWordOnly.test(chunk)) && index < chunks.length - 1) {
      chunks[index + 1] = `${chunk} ${chunks[index + 1]}`;
      continue;
    }

    const previous = merged[merged.length - 1];
    if (previous && (trailingConnector.test(previous) || (leadingParticle.test(chunk) && previous.split(/\s+/).length <= 4) || (leadingObject.test(chunk) && /\b\w+(?:ing|ed)$/.test(previous)))) {
      merged[merged.length - 1] = `${previous} ${chunk}`;
      continue;
    }

    merged.push(chunk);
  }

  const reconstructed = merged.join(" ").replace(/\s+/g, " ").trim();
  const original = sentence.replace(/\s+/g, " ").trim();
  return reconstructed === original ? merged : [original];
}

export function parseLocalSenseGroups(content: string): ISentenceChunk[] {
  const sentences = splitIntoSentences(content);

  return sentences.map((sentence) => {
    const chunks = chunkSentence(sentence);
    return {
      originalSentence: sentence,
      chunks: chunks.length > 0 ? chunks : [sentence],
    };
  });
}

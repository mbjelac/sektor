import sektorWordsText from "../assets/sektor-words.txt?raw";
import { RandomNumber } from "./randomNumber";

// Every sektor is made with a name of its own, so that nobody has to think one up before taking it
// up: two words off the game's own list of words, joined with a dash.
export function generateSektorName(): string {
  return takePreparedSektorName() ?? sektorNameFrom(SEKTOR_WORDS, Math.random);
}

// Two words drawn from those given, never the same one twice.
export function sektorNameFrom(words: string[], randomNumber: RandomNumber): string {
  const remainingWords = [...words];
  const firstWord = remainingWords.splice(Math.floor(randomNumber() * remainingWords.length), 1)[0];
  const secondWord = remainingWords[Math.floor(randomNumber() * remainingWords.length)];
  return `${firstWord}-${secondWord}`;
}

const SEKTOR_WORDS: string[] = sektorWordsText.split("\n").map(word => word.trim()).filter(word => word !== "");

// Names sektors are made with instead of drawing any from the words. Nothing in the game lays out a
// single one, so every name a player ever sees is drawn; a test lays them out to make sektors of
// names it knows. They arrive on the window because a test runs outside the page and that is the
// only way into it, and they are picked up here as the page loads, which is after the test has laid
// them out.
const preparedSektorNames: string[] = (globalThis as unknown as { preparedSektorNames?: string[] }).preparedSektorNames ?? [];

function takePreparedSektorName(): string | undefined {
  if (preparedSektorNames.length === 0) return undefined;

  // The prepared names are gone round rather than used up, so that a test which makes more sektors
  // than it laid out names for still never falls through to drawing them.
  const preparedSektorName = preparedSektorNames.shift()!;
  preparedSektorNames.push(preparedSektorName);

  return preparedSektorName;
}

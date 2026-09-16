// Every sektor is made with a name of its own, so that nobody has to think one up before taking it
// up: two words off a word service, joined with a dash.
const RANDOM_WORD_URL = "https://random-word-api.herokuapp.com/word?number=2";

// A sektor made while the word service is out of reach is left nameless and goes by its id, which
// is what a sektor did before it was made with a name at all.
export async function generateSektorName(): Promise<string | null> {
  try {
    const response = await fetch(RANDOM_WORD_URL);
    if (!response.ok) return null;

    const words = await response.json() as string[];
    if (words.length === 0) return null;

    return words.join("-");
  } catch {
    return null;
  }
}

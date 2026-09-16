// Every sektor is made with a name of its own, so that nobody has to think one up before taking it
// up: two words off a word service, joined with a dash.
const RANDOM_WORD_URL = "https://random-word-api.herokuapp.com/word?number=2";

// A sektor made while the word service is out of reach is left nameless and goes by its id, which
// is what a sektor did before it was made with a name at all.
export async function generateSektorName(): Promise<string | null> {
  const preparedSektorName = takePreparedSektorName();
  if (preparedSektorName !== undefined) return preparedSektorName;

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

// Names sektors are made with instead of asking the word service for any. Nothing in the game lays
// out a single one, so every name a player ever sees came off the service; a test lays them out to
// make sektors of names it knows, without reaching over the network for them. They arrive on the
// window because a test runs outside the page and that is the only way into it, and they are picked
// up here as the page loads, which is after the test has laid them out.
const preparedSektorNames: string[] = (window as unknown as { preparedSektorNames?: string[] }).preparedSektorNames ?? [];

function takePreparedSektorName(): string | undefined {
  if (preparedSektorNames.length === 0) return undefined;

  // The prepared names are gone round rather than used up, so that a test which makes more sektors
  // than it laid out names for still never falls through to the service.
  const preparedSektorName = preparedSektorNames.shift()!;
  preparedSektorNames.push(preparedSektorName);

  return preparedSektorName;
}

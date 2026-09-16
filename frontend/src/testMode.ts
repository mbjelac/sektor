// A test sektor is made up on the spot, out of made-up buildings, resources, properties and levels,
// so that a test never rests on whatever the game happens to be balanced at. The mode is asked for
// in the address, so that it can also be opened by hand while working on the game; a built game
// never enters it, whatever is asked of it.
export const isTestMode = import.meta.env.DEV && new URLSearchParams(window.location.search).get("test") === "true";

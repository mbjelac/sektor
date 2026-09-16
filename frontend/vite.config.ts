import { defineConfig } from "vite";

// The game is three pages, not one: the list a player lands on, the login which lets them in, and
// the map of a single sektor. Only the page named as an entry is built, so all three are named
// here — a build without them leaves a player nowhere to log in and nothing to build on.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        list: "index.html",
        login: "login.html",
        sektor: "sektor.html",
      },
    },
  },
});

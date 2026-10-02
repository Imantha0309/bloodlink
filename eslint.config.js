// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    // `server/` is a standalone Node backend with its own tsconfig and its own
    // lint setup — the Expo/React Native rules here do not apply to it.
    ignores: ["dist/*", "server/**"],
  }
]);

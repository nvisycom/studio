import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  entry: ["src/index.ts", "src/constants.ts", "src/utilities.ts"],
  splitting: false,
  sourcemap: true,
  dts: true,

  format: "esm",
  platform: "neutral",
  cjsInterop: false,
});

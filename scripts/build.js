import * as path from "path";
import * as fs from "fs/promises";
import esbuild from "esbuild";

const OUT_DIR = path.resolve("./out");

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  await esbuild.build({
    entryPoints: ["tests/index.js"],
    outdir: path.join(OUT_DIR, "tests"),
    bundle: true,
    write: true,
    format: "esm",
    target: "es2020",
    external: ["/qpdf.js"],
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

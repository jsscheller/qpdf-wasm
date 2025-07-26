import * as path from "path";
import * as fs from "fs/promises";
import { run } from "runish";

const OUT_DIR = path.resolve("./out/release");
const { LIVE } = process.env;

async function main() {
  await fs.rm(OUT_DIR, { force: true, recursive: true });
  await fs.mkdir(OUT_DIR, { recursive: true });

  for (const filePath of [
    "out/qpdf.js",
    "out/qpdf.wasm",
    "package.json",
    "README.md",
    "LICENSE",
  ]) {
    await fs.cp(filePath, path.join(OUT_DIR, path.basename(filePath)));
  }

  const otp = process.argv.find((x) => x.startsWith("--otp="));
  await run(
    "npm",
    ["publish", "--access=public"].concat(LIVE ? [otp] : ["--dry-run"]),
    { cwd: OUT_DIR },
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

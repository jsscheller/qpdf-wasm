import * as path from "path";
import * as fs from "fs/promises";
import { run } from "runish";

const LIB_DIR = path.resolve("./lib");

async function main() {
  await fs.mkdir(LIB_DIR, { recursive: true });

  const libs = [
    [
      "jpeg-turbo",
      "https://github.com/libjpeg-turbo/libjpeg-turbo",
      "7723f50f3f66b9da74376e6d8badb6162464212c",
    ],
    [
      "zlib",
      "https://github.com/madler/zlib",
      "51b7f2abdade71cd9bb0e7a373ef2610ec6f9daf",
    ],
    [
      "qpdf",
      "https://github.com/qpdf/qpdf",
      "856d32c610334855d30e96d25eb5f9636fb62f08",
    ],
  ];
  for (const [name, repo, hash] of libs) {
    process.chdir(LIB_DIR);
    await gitClone(name, repo, hash);
  }
}

async function gitClone(name, repo, hash) {
  const exists = await fs
    .access(name)
    .then(() => true)
    .catch(() => false);
  if (exists) return;

  console.log(`git cloning ${name} - ${repo} - ${hash}`);
  await run("git", ["init", name]);
  process.chdir(path.join(LIB_DIR, name));
  await run("git", ["fetch", "--depth", "1", repo, hash]);
  await run("git", ["checkout", "FETCH_HEAD"]);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import { test } from "uvu";
import init from "/qpdf.js";
import * as assert from "uvu/assert";

let qpdf;

test("merge", async function () {
  await initQpdf([await download("baked-alaska.pdf")]);
  qpdf.callMain([
    "input/baked-alaska.pdf",
    "--pages",
    ".",
    "1",
    "--",
    "output/merge.pdf",
  ]);
  await assertExists("output/merge.pdf");
});

async function download(asset) {
  const blob = await fetch(`/assets/${asset}`).then((x) => x.blob());
  return new File([blob], asset, { type: blob.type });
}

async function initQpdf(input) {
  qpdf = await init({
    locateFile: (x) => (x.endsWith(".js") ? "/qpdf.js" : "/qpdf.wasm"),
  });
  qpdf.FS.mkdir("/input");
  const mount = input[0] && input[0].data ? { blobs: input } : { files: input };
  qpdf.FS.mount(qpdf.WORKERFS, mount, "/input");
  qpdf.FS.mkdir("/output");
}

async function assertExists(path) {
  const buf = qpdf.FS.readFile(path);
  assert.ok(buf.length > 0);
}

test.run();

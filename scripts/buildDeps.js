import * as path from "path";
import * as os from "os";
import * as fs from "fs/promises";
import * as fss from "fs";
import { run } from "runish";

const OUT_DIR = path.resolve("./out");
const LIB_DIR = path.resolve("./lib");
const JS_DIR = path.resolve("./js");
const NPROC = Math.min(os.cpus().length, 5);
const { RELEASE } = process.env;

async function main() {
  const PKG_CONFIG_PATH = `${OUT_DIR}/lib/pkgconfig`;
  let CFLAGS = "-pthread -sUSE_PTHREADS -msimd128";
  if (RELEASE) {
    CFLAGS += " -Oz -flto";
  } else {
    CFLAGS += " -Os --profiling";
  }
  Object.assign(process.env, {
    CPPFLAGS: `-I${OUT_DIR}/include`,
    LDFLAGS: `-L${OUT_DIR}/lib`,
    PKG_CONFIG_PATH,
    EM_PKG_CONFIG_PATH: PKG_CONFIG_PATH,
    CFLAGS,
    CXXFLAGS: CFLAGS,
    TOOLCHAIN_FILE: `${process.env.EMSDK}/upstream/emscripten/cmake/Modules/Platform/Emscripten.cmake`,
    STRIP: "llvm-strip",
  });

  await fs.mkdir(OUT_DIR, { recursive: true });

  const libs = [
    ["zlib", buildZlib],
    ["jpeg-turbo", buildJpegTurbo],
    ["qpdf", buildQpdf],
  ];
  for (const [name, build] of libs) {
    console.log(`\n\n\nbuilding ${name}...\n\n\n`);
    process.chdir(path.join(LIB_DIR, name));
    await gitClean();
    if (fss.existsSync("configure")) {
      await run("chmod", ["+x", "configure"]);
    }
    await build();
  }

  process.chdir(path.join(LIB_DIR, "qpdf"));

  await run("emcc", [
    ...process.env.LDFLAGS.split(" "),
    ...process.env.CPPFLAGS.split(" "),
    ...process.env.CFLAGS.split(" "),
    ...process.env.CXXFLAGS.split(" "),
    ...(RELEASE
      ? ["--closure", "1"]
      : ["-sASSERTIONS=2", "-sSAFE_HEAP=1", "-sSTACK_OVERFLOW_CHECK=2"]),
    "--pre-js",
    path.join(JS_DIR, "pre.js"),
    "--post-js",
    path.join(JS_DIR, "post.js"),
    "-sALLOW_MEMORY_GROWTH=1",
    "-sEXPORTED_RUNTIME_METHODS=[callMain,FS,WORKERFS,ENV]",
    "-sINCOMING_MODULE_JS_API=[noInitialRun,noFSInit,locateFile,preRun,instantiateWasm,quit,noExitRuntime,onExit]",
    "-sEXPORTED_FUNCTIONS=_main",
    "-sSTACK_SIZE=1MB",
    "-sNO_DISABLE_EXCEPTION_CATCHING=1",
    "-sMODULARIZE=1",
    "-sEXPORT_ES6=1",
    "-sEXPORT_NAME=init",
    "-sDYNAMIC_EXECUTION=0",
    "-sPTHREAD_POOL_SIZE=navigator.hardwareConcurrency",
    "-sENVIRONMENT=worker",
    // Use `locateFile` instead of `import.meta` (see `pre.js`)
    "-sUSE_ES6_IMPORT_META=0",
    "-sINITIAL_MEMORY=67108864",
    "-o",
    `${OUT_DIR}/qpdf.js`,
    path.join(LIB_DIR, "qpdf/build/libqpdf/libqpdf.a"),
    path.join(LIB_DIR, "qpdf/qpdf/qpdf.cc"),
    `-I${path.join(LIB_DIR, "qpdf/include")}`,
    "-lworkerfs.js",
    "-ljpeg",
    "-lz",
  ]);
}

async function buildZlib() {
  await run("emconfigure", ["./configure", `--prefix=${OUT_DIR}`, "--static"]);
  await run("emmake", ["make", `-j${NPROC}`, "install"]);
}

async function buildJpegTurbo() {
  await run("emcmake", [
    "cmake",
    ".",
    `-DCMAKE_INSTALL_PREFIX=${OUT_DIR}`,
    "-DENABLE_SHARED=off",
    "-DWITH_SIMD=1",
    "-DCMAKE_BUILD_TYPE=Release",
    `-DCMAKE_C_FLAGS=${process.env.CFLAGS}`,
  ]);
  await run("emmake", ["make", `-j${NPROC}`, "install"]);
}

async function buildQpdf() {
  await run("emcmake", [
    "cmake",
    "-S",
    ".",
    "-B",
    "build",
    `-DCMAKE_INSTALL_PREFIX=${OUT_DIR}`,
    "-DCMAKE_BUILD_TYPE=Release",
    "-DRANDOM_DEVICE=/dev/random",
  ]);
  await run("cmake", ["--build", "build"]);
}

async function gitClean() {
  await run("git", ["clean", "-xdf"]);
  await run("git", ["checkout", "."]);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

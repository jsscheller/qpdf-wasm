# qpdf-wasm

`qpdf` compiled to WASM via Emscripten. This doesn't expose the `qpdf` library - just the CLI.

```sh
npm install --save @jspawn/qpdf-wasm
```

Note: `qpdf` is compiled using the `USE_INSECURE_RANDOM` flag which means any encryption performed by the program should be considered insecure. This will hopefully change in the future.

## Examples

See the `tests` directory for examples.

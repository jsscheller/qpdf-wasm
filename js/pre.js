// Fixes closure JSC_UNDEFINED_VARIABLE error
let process, fs;

Module["noInitialRun"] = true;
if (Module["locateFile"]) _scriptName = Module["locateFile"]("qpdf.js");

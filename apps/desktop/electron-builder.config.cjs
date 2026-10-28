// Forge compiles the shell and its local renderers; electron-builder packages those same outputs.
// One NSIS installer embeds both x86 and x64. Electron 43 is the last line providing both runtimes.
// Run with `bun run make:windows`; see docs/deployment.md.
const requested = process.env.ORYX_WINDOWS_ARCH;
const architectures = requested === "ia32" ? ["ia32"] : requested === "x64" ? ["x64"] : ["ia32", "x64"];
module.exports = {
  appId: "com.kumateck.oryx-live-desktop",
  productName: "Oryx Live Desktop",
  executableName: "OryxLiveDesktop",
  artifactName: requested === "ia32" ? "OryxLiveDesktop-Setup-x86.${ext}" : "OryxLiveDesktop-Setup.${ext}",
  directories: { output: "out/make/nsis" },
  electronVersion: "43.8.3",
  asar: true,
  files: [".vite/**/*", "build/**/*", "package.json"],
  win: { target: [{ target: "nsis", arch: architectures }], icon: "build/icon.ico" },
  nsis: {
    oneClick: false,
    perMachine: false,
    allowElevation: true,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: "always",
    createStartMenuShortcut: true,
    shortcutName: "Oryx Live Desktop",
    runAfterFinish: true,
    installerIcon: "build/icon.ico",
    uninstallerIcon: "build/icon.ico",
    installerHeaderIcon: "build/icon.ico",
    deleteAppDataOnUninstall: false,
  },
  publish: null,
};

// Windows installer (NSIS) for the shell that Electron Forge has already packaged into out/.
// Forge builds and packages (Vite bundles, icon, asar); electron-builder only wraps that folder in an installer.
// Run with `bun run make:windows`; see docs/deployment.md.
module.exports = {
  appId: "com.kumateck.oryx-live-desktop",
  productName: "Oryx Live Desktop",
  executableName: "OryxLiveDesktop",
  artifactName: "OryxLiveDesktop-Setup.${ext}",
  directories: { output: "out/make/nsis" },
  win: { target: [{ target: "nsis", arch: ["x64"] }], icon: "build/icon.ico" },
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

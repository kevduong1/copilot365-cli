{
  autoPatchelfHook,
  fd,
  importNpmLock,
  lib,
  libxcb,
  makeWrapper,
  nodejs_22,
  ripgrep,
  source,
  stdenv,
  wl-clipboard,
  xclip,
}:

let
  nodejs = nodejs_22;
  packageJson = lib.importJSON (source + "/packages/coding-agent/package.json");
  # Lockfile root for the coding agent's packaged installation. It pins the
  # runtime dependency tree and is kept in sync with package-lock.json by
  # `npm run check`.
  installLock = source + "/packages/coding-agent/install-lock";

  workspacePackages = stdenv.mkDerivation {
    pname = "gcode-workspace-packages";
    inherit (packageJson) version;
    src = source;

    npmDeps = importNpmLock { npmRoot = source; };
    npmRebuildFlags = [ "--ignore-scripts" ];

    nativeBuildInputs = [
      nodejs
      importNpmLock.npmConfigHook
    ];

    buildPhase = ''
      runHook preBuild
      npm run build:offline
      runHook postBuild
    '';

    installPhase = ''
      runHook preInstall

      pack_package() {
        local package_dir="$1"
        local output_name="$2"
        local tarball

        tarball="$(cd "$package_dir" && npm pack --ignore-scripts --silent --pack-destination "$TMPDIR")"
        mv "$TMPDIR/$tarball" "$out/$output_name.tgz"
      }

      mkdir -p "$out"
      pack_package packages/telemetry telemetry
      pack_package packages/ai ai
      pack_package packages/tui tui
      pack_package packages/agent agent
      pack_package packages/codemode codemode
      pack_package packages/mcp mcp
      pack_package packages/coding-agent coding-agent

      runHook postInstall
    '';
  };

  npmDeps = importNpmLock {
    npmRoot = installLock;
    # The install lock points internal packages at registry releases. Replace
    # them with the packages built from this checkout.
    packageSourceOverrides = {
      "node_modules/@gcode/agent-core" = workspacePackages + "/agent.tgz";
      "node_modules/@gcode/ai" = workspacePackages + "/ai.tgz";
      "node_modules/@gcode/codemode" = workspacePackages + "/codemode.tgz";
      "node_modules/gcode" = workspacePackages + "/coding-agent.tgz";
      "node_modules/@gcode/mcp" = workspacePackages + "/mcp.tgz";
      "node_modules/@gcode/telemetry" = workspacePackages + "/telemetry.tgz";
      "node_modules/@gcode/tui" = workspacePackages + "/tui.tgz";
    };
  };
in
stdenv.mkDerivation {
  pname = "gcode";
  inherit (packageJson) version;
  src = installLock;
  inherit npmDeps;

  npmRebuildFlags = [ "--ignore-scripts" ];

  nativeBuildInputs = [
    nodejs
    importNpmLock.npmConfigHook
    makeWrapper
  ]
  ++ lib.optionals stdenv.hostPlatform.isLinux [ autoPatchelfHook ];

  buildInputs = [ nodejs ] ++ lib.optionals stdenv.hostPlatform.isLinux [
    stdenv.cc.cc.lib
    libxcb
  ];

  dontBuild = true;
  dontStrip = true;

  installPhase = ''
    runHook preInstall

    mkdir -p "$out/lib/gcode" "$out/bin"
    cp -R . "$out/lib/gcode"

    # The wrapper runs gcode with an absolute Node path. Append Node
    # so shells started by the bash tool keep the user's Node installation.
    # fd, ripgrep,
    # and the clipboard tools are gcode's own dependencies and take precedence.
    makeWrapper ${nodejs}/bin/node "$out/bin/gcode" \
      --add-flags "$out/lib/gcode/node_modules/gcode/dist/bundle/cli.js" \
      --suffix PATH : ${lib.makeBinPath [ nodejs ]} \
      --prefix PATH : ${
        lib.makeBinPath (
          [
            fd
            ripgrep
          ]
          ++ lib.optionals stdenv.hostPlatform.isLinux [
            wl-clipboard
            xclip
          ]
        )
      }

    runHook postInstall
  '';

  doInstallCheck = true;
  installCheckPhase = ''
    runHook preInstallCheck
    test "$("$out/bin/gcode" --version)" = "${packageJson.version}"
    # Load host-platform TUI helpers directly so missing native dependencies
    # fail the build rather than silently disabling clipboard support.
    ${nodejs}/bin/node -e \
      "const fs = require('node:fs');
       const path = require('node:path');
       const dir = '$out/lib/gcode/node_modules/@gcode/tui/native/' + process.platform + '/prebuilds/' + process.platform + '-' + process.arch;
       if (fs.existsSync(dir)) {
         for (const file of fs.readdirSync(dir)) {
           if (file.endsWith('.node')) require(path.join(dir, file));
         }
       }"
    ${nodejs}/bin/node -e \
      "require('$out/lib/gcode/node_modules/@silvia-odwyer/photon-node')"
    runHook postInstallCheck
  '';

  meta = {
    description = packageJson.description;
    license = lib.licenses.mit;
    mainProgram = "gcode";
    platforms = [
      "aarch64-darwin"
      "aarch64-linux"
      "x86_64-darwin"
      "x86_64-linux"
    ];
    sourceProvenance = with lib.sourceTypes; [
      fromSource
      binaryNativeCode
    ];
  };
}

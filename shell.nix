with (import <nixpkgs> {});
mkShell {
  buildInputs = [
    bundler
    (vscode-with-extensions.override {
      vscodeExtensions = with pkgs.vscode-extensions; [
	      eamodio.gitlens
	      yzhang.markdown-all-in-one
        jnoortheen.nix-ide
	      streetsidesoftware.code-spell-checker
      ];
    })
  ];
}

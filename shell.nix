with (import <nixpkgs> {});
mkShell {
  shellHook = ''
    zsh
  '';
  buildInputs = [
    clang
    ruby_3_0
    # (vscode-with-extensions.override {
    #   vscodeExtensions = with pkgs.vscode-extensions; [
	  #     eamodio.gitlens
	  #     yzhang.markdown-all-in-one
    #     jnoortheen.nix-ide
	  #     streetsidesoftware.code-spell-checker
    #   ];
    # })
  ];
}

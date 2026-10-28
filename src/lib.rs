use zed_extension_api::{self as zed, settings::LspSettings, LanguageServerId, Worktree};

struct GenexprExtension;

impl zed::Extension for GenexprExtension {
    fn new() -> Self {
        Self
    }

    fn language_server_command(
        &mut self,
        id: &LanguageServerId,
        worktree: &Worktree,
    ) -> zed::Result<zed::Command> {
        let binary = LspSettings::for_worktree(id.as_ref(), worktree)?.binary;
        let command = binary
            .as_ref()
            .and_then(|settings| settings.path.clone())
            .or_else(|| worktree.which("genexpr-language-server"))
            .ok_or_else(|| {
                "GenExpr language server not found. Run scripts/bootstrap.sh in the extension \
                 checkout, then run node scripts/zed-settings.mjs and copy its output into \
                 Zed's settings. Alternatively put genexpr-language-server on PATH."
                    .to_string()
            })?;

        Ok(zed::Command {
            command,
            args: binary
                .as_ref()
                .and_then(|settings| settings.arguments.clone())
                .unwrap_or_else(|| vec!["--stdio".into()]),
            env: binary
                .and_then(|settings| settings.env)
                .map(|env| env.into_iter().collect())
                .unwrap_or_default(),
        })
    }

    fn language_server_initialization_options(
        &mut self,
        id: &LanguageServerId,
        worktree: &Worktree,
    ) -> zed::Result<Option<zed::serde_json::Value>> {
        Ok(LspSettings::for_worktree(id.as_ref(), worktree)?.initialization_options)
    }
}

zed::register_extension!(GenexprExtension);

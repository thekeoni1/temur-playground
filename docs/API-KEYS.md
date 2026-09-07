# Getting an API key

**Set a spending cap on your provider account first. The sandbox spends
real money against your key.**

Every provider below charges per request. A cap is the only thing that
turns a mistake into a small one, and it takes a minute to set.

The setup wizard in the sandbox offers four hosted providers. They are
listed here in the order the wizard lists them. None is recommended over
the others; pick the one you already have an account with.

| Provider | Where keys are issued |
| --- | --- |
| Anthropic | <https://platform.claude.com/settings/keys> |
| OpenAI | <https://platform.openai.com/settings/organization/api-keys> |
| Google Gemini | <https://aistudio.google.com/apikey> |
| xAI | <https://console.x.ai/> (API keys, under your team) |

Each URL was taken from that provider's own current documentation rather
than from memory. Consoles get reorganised; if a link has moved, the
provider's docs are the authority, not this page.

The xAI row names the console rather than a deeper link on purpose: xAI's
quickstart links a path containing a team name, and that name is not the
same for every account.

## After you have the key

Paste it at the wizard's hidden prompt. That prompt shows nothing at all
while you type or paste, which is correct and not a hang. Paste with
`Ctrl-Shift-V`; plain `Ctrl-V` sends a control byte to the terminal
instead of pasting.

## When you are finished

The sandbox is a throwaway machine and forgets everything when you close
the tab, but your key still exists at the provider until you remove it.
Delete it from the console you created it in.

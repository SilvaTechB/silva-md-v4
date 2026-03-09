# Silva MD Bot

A modular WhatsApp bot built with Baileys (multi-device), featuring an admin dashboard web interface.

## Architecture

- **Runtime**: Node.js 20
- **Entry point**: `silva.js`
- **Web dashboard**: `smm/silva.html` — served via Express at port 5000
- **Plugins**: `plugins/` directory — loaded dynamically on start
- **Config**: `config.js` reads from `config.env` (if present) or environment variables
- **Session storage**: `session/` directory (multi-file auth state)

## Key Components

| File/Dir         | Purpose                                         |
|------------------|-------------------------------------------------|
| `silva.js`       | Main entry — connects to WhatsApp, runs Express |
| `handler.js`     | Message handler & command dispatcher            |
| `config.js`      | Config reader (env vars / config.env)           |
| `plugins/`       | Individual feature plugins (commands)           |
| `lib/`           | Shared utilities and functions                  |
| `utils/`         | Delay, safeSend, warmupGroup helpers            |
| `smm/silva.html` | Admin dashboard (served as static file)         |

## Environment Variables

See `sample.env` for the full list. Key ones:

- `SESSION_ID` — WhatsApp session (required). Format: `Silva~<base64-gzip>`
- `OWNER_NUMBER` — Bot owner's WhatsApp number
- `PREFIX` — Command prefix (default `.`)
- `MODE` — `public`, `private`, or `both`
- `PORT` — HTTP server port (set to `5000` for Replit)

## Workflow

- **Command**: `node silva.js`
- **Port**: 5000 (Express web dashboard)
- **Output type**: webview

## Deployment

- **Target**: VM (always-running — maintains WhatsApp connection)
- **Run**: `node silva.js`

## Notes

- The bot requires a `SESSION_ID` secret to connect to WhatsApp. Without it, the web dashboard still runs but the bot won't connect.
- Session data is stored in the `session/` directory.
- Plugins are hot-reloadable (on some commands).

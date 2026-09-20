# Tab Manager Plus 6.0.0

> A fork of the original Tab Manager extension — actively maintained, bug-fixed, and ready for Firefox, Chrome, and Brave.

Search through your tabs instantly, save windows for later, limit open tabs per window — and many more.

![Tab Manager Plus](images/browsers64.png)

---

## About This Fork

This is a community-maintained fork of the original **Tab Manager** Chrome extension by [stefanXO](https://github.com/stefanXO/Tab-Manager). The original extension is no longer actively maintained and contains known bugs. This fork extends the original with a new view type, many new features, TypeScript safety, and active bug fixes.

## Supported Browsers

| Browser | Status |
|---------|--------|
| Firefox | ✅ Supported (MV3, see `manifest-firefox.json`) |
| Chrome  | ✅ Supported |
| Brave   | ✅ Supported (Chrome extension format) |

## Installation

### Firefox
Load unpacked in `about:debugging` using the `package-firefox/` directory, or build with:
```bash
pnpm install && pnpm run build && pnpm run package:firefox
```

### Chrome & Brave
Load unpacked in `chrome://extensions/` (enable Developer Mode) using the `package-chrome/` directory, or build with:
```bash
pnpm install && pnpm run build && pnpm run package:chrome
```

## Building

```bash
pnpm install
pnpm run build      # Bundle TS/TSX → dist/
pnpm run typecheck  # TypeScript check (no emit)
pnpm test           # Run unit tests
```

### Packaging

```bash
pnpm run package:firefox   # → package-firefox/
pnpm run package:chrome    # → package-chrome/ (Chrome & Brave)
```

## Features

- Instant tab search across all windows
- Window save/restore for later
- Tab count limits per window
- Duplicate tab finder
- Session management (save/restore named sessions with tags)
- Autosave on close + periodic alarms
- Responsive UI with dark/fun/normal themes

## License

MPLv2

## Privacy

No tracking of any user data.

# Security & Intellectual Property Policy

## 🛡️ Security Architecture of NeyroNetbook

NeyroNetbook is engineered with a strict **Local-First, Zero-Knowledge** security paradigm:

1. **Zero-Telemetry & Zero-Cloud Storage:**
   - No user notes, finance records, shift schedules, or vault keys are ever sent to external cloud servers.
   - All cryptographic hashes and Merkle roots are computed locally in-memory.

2. **Cryptographically Isolated P2P Protocol:**
   - P2P synchronization over local Wi-Fi requires a shared high-entropy **Secret Pairing Key (PIN)**.
   - Untrusted peers or scanners on the same network subnet are rejected immediately at the initial authentication handshake.

3. **Anti-Decompilation & Client Protection:**
   - Production bundles are minified with aggressive symbol stripping (`esbuild`, `drop: ['console', 'debugger']`).
   - Source Maps (`*.map`) are strictly excluded from distribution.
   - Electron production runtime disables DevTools and blocks debugging shortcuts (`F12`, `Ctrl+Shift+I`, `Ctrl+U`).

## 🛑 Intellectual Property & Anti-Piracy Notice

The source code, trademarks, icons, UI components, and branding are the intellectual property of **hellmorvin** (@hellmorvin).
- Cloned binaries, cracked distributions, or third-party repositories impersonating official releases are unauthorized.
- Official distributions are published exclusively via:
  **https://github.com/hellmorvin/NyronNetbook**

## 🔒 Reporting a Vulnerability

If you discover a security issue or vulnerability in NeyroNetbook, please report it privately:
- Open a private security advisory via GitHub Security tab or contact the maintainer.
- We appreciate responsible disclosure and address verified vulnerabilities promptly.

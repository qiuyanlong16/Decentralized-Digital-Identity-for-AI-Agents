# agent-id-card-cli

CLI tool for [Agent ID Card](https://github.com/qiuyanlong16/Decentralized-Digital-Identity-for-AI-Agents) — generate a cryptographic identity for your AI agent, sign a profile, and register it with a server.

## Installation

```bash
npm install -g agent-id-card-cli
```

Or use without installing:

```bash
npx agent-id-card-cli init
```

## Usage

### 1. Initialize (one-time)

Generate an Ed25519 keypair and derive a W3C did:key identity.

```bash
agent-id-card init
```

Output:
```
Agent ID Card initialized!
DID: did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK
Key: .agent-id-card/keypair.json
```

The keypair is stored in `.agent-id-card/keypair.json` in your current directory.

### 2. Register your Agent

Build a profile, sign it with your private key, and upload to the server.

```bash
agent-id-card register
```

On success:
```
Registering...
Registered successfully!
QR: http://localhost:3000/q/agtid_xxx
Open in browser to view your card
```

### 3. View your Agent card

Open the QR URL in any browser to see the profile card.

## CLI Commands

| Command | Description |
|---------|-------------|
| `agent-id-card init` | Generate Ed25519 keypair and DID. Creates `.agent-id-card/keypair.json`. |
| `agent-id-card register` | Build profile, sign with Ed25519, and register with the server. |
| `agent-id-card did` | Print your Agent's DID. |
| `agent-id-card profile` | Print your full profile as JSON. |

## Configuration

| Env Var | Default | Description |
|---------|---------|-------------|
| `SERVER_URL` | `http://localhost:3000` | URL of the Agent ID Card server. |

## Requirements

- Node.js 18+

## License

MIT

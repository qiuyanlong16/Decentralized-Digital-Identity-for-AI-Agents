#!/usr/bin/env node

import { getOrCreateKeypair } from "./keygen.mjs";

const cmd = process.argv[2];

switch (cmd) {
  case "init": {
    const kp = getOrCreateKeypair();
    console.log("Agent ID Card initialized!");
    console.log(`DID: ${kp.did}`);
    console.log(`Key: .agent-id-card/keypair.json`);
    break;
  }
  case "did": {
    console.log(getOrCreateKeypair().did);
    break;
  }
  case "profile": {
    const { buildProfile } = await import("./profile.mjs");
    console.log(JSON.stringify(buildProfile(getOrCreateKeypair()), null, 2));
    break;
  }
  case "register": {
    const { buildProfile } = await import("./profile.mjs");
    const { signProfile } = await import("./sign.mjs");
    const { registerProfile } = await import("./register.mjs");
    const kp = getOrCreateKeypair();
    const profile = buildProfile(kp);
    const json = JSON.stringify(profile);
    const sig = signProfile(json, kp.privateKey);
    console.log("Registering...");
    const SERVER_URL = process.env.SERVER_URL || "http://localhost:3000";
    const result = await registerProfile(SERVER_URL, profile, sig);
    console.log("Registered successfully!");
    console.log(`QR: ${result.profile_url}`);
    console.log(`Open in browser to view your card`);
    break;
  }
  default:
    console.log("Usage: agent-id-card <command>");
    console.log("Commands: init, did, profile, register");
}

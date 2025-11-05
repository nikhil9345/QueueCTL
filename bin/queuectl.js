#!/usr/bin/env node
import("../src/cli/index.js")
  .catch(err => {
    console.error("❌ Failed to start CLI:", err);
    process.exit(1);
  });

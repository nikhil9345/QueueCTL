import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.resolve(__dirname, "../../../persisted/config.json");

function loadConfig() {
  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify({}, null, 2));
  }
  const raw = fs.readFileSync(configPath);
  return JSON.parse(raw);
}

function saveConfig(config) {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

export async function setConfig(key, value) {
  const config = loadConfig();
  config[key] = value;
  saveConfig(config);
  console.log(`⚙️  Config updated: ${key} = ${value}`);
}

export async function getConfig(key) {
  const config = loadConfig();
  if (key in config) {
    console.log(`${key} = ${config[key]}`);
  } else {
    console.log(`No config found for key: ${key}`);
  }
}


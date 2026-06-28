import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";

function parseDotEnv(text) {
  const values = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index === -1) continue;
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

const envFile = new URL("../.env", import.meta.url);
const fileEnv = existsSync(envFile) ? parseDotEnv(await readFile(envFile, "utf8")) : {};
const pick = (key) => process.env[key] || fileEnv[key] || "";
const env = {
  VITE_SUPABASE_URL: pick("VITE_SUPABASE_URL"),
  VITE_SUPABASE_ANON_KEY: pick("VITE_SUPABASE_ANON_KEY"),
  VITE_STRIPE_PAYMENT_LINK: pick("VITE_STRIPE_PAYMENT_LINK"),
  VITE_CHECKOUT_ENDPOINT: pick("VITE_CHECKOUT_ENDPOINT")
};

await writeFile(
  new URL("../env-config.js", import.meta.url),
  "window.WSMT_ENV = " + JSON.stringify(env, null, 2) + ";\n",
  "utf8"
);

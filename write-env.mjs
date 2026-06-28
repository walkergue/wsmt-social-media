import { writeFile } from "node:fs/promises";

const env = {
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || "",
  VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || "",
  VITE_STRIPE_PAYMENT_LINK: process.env.VITE_STRIPE_PAYMENT_LINK || "",
  VITE_CHECKOUT_ENDPOINT: process.env.VITE_CHECKOUT_ENDPOINT || ""
};

await writeFile(
  new URL("../env-config.js", import.meta.url),
  "window.WSMT_ENV = " + JSON.stringify(env, null, 2) + ";\n",
  "utf8"
);

// testEnv.js
import dotenv from "dotenv";
dotenv.config();

console.log("SYSTEM_PRIVATE_KEY:", process.env.SYSTEM_PRIVATE_KEY);
console.log("GANACHE_URL:", process.env.GANACHE_URL);

import hre from "hardhat";
import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();

const { ethers } = hre;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with address:", deployer.address);

  // Deploy FindToken
  const Token = await ethers.getContractFactory("FindToken");
  const token = await Token.deploy();
  await token.waitForDeployment();
  const tokenAddr = await token.getAddress();
  console.log("FindToken deployed at:", tokenAddr);

  // Deploy TokenTransaction
  const TxContract = await ethers.getContractFactory("TokenTransaction");
  const txContract = await TxContract.deploy(tokenAddr);
  await txContract.waitForDeployment();
  const txAddr = await txContract.getAddress();
  console.log("Transaction contract deployed at:", txAddr);

  // -------------------------------------------------------------------
  // SAVE DEPLOYED ADDRESSES INTO .env (AUTO-WRITE)
  // -------------------------------------------------------------------
  const envPath = ".env";
  let env = fs.readFileSync(envPath, "utf8");

  // Replace existing OR add new values
  env = updateEnv(env, "TOKEN_CONTRACT_ADDRESS", tokenAddr);
  env = updateEnv(env, "TRANSACTION_CONTRACT_ADDRESS", txAddr);

  fs.writeFileSync(envPath, env);
  console.log("✔ Updated .env with deployed addresses");
}

function updateEnv(env, key, value) {
  const line = `${key}=${value}`;
  const regex = new RegExp(`^${key}=.*$`, "m");

  if (regex.test(env)) {
    // Replace existing
    return env.replace(regex, line);
  } else {
    // Add new line
    return env + `\n${line}`;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

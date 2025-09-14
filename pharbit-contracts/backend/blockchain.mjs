import { ethers } from "ethers";
import fs from "fs";
import path from "path";

export function getProvider() {
  const rpcUrl = process.env.MUMBAI_RPC_URL || "http://127.0.0.1:8545";
  return new ethers.JsonRpcProvider(rpcUrl);
}

export function getSigner(provider) {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) return null;
  return new ethers.Wallet(pk, provider);
}

export function getArtifact(name) {
  const artifactPath = path.resolve(process.cwd(), `artifacts/contracts/${name}.sol/${name}.json`);
  if (!fs.existsSync(artifactPath)) throw new Error(`Artifact not found for ${name}`);
  return JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
}

export function getContract(address, name, providerOrSigner) {
  const artifact = getArtifact(name);
  return new ethers.Contract(address, artifact.abi, providerOrSigner);
}

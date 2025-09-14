import fs from 'fs';
import path from 'path';
import { connect, signers, identities, hash } from '@hyperledger/fabric-gateway';
import grpc from '@grpc/grpc-js';

export async function createFabricGateway() {
  const profilePath = process.env.FABRIC_CONNECTION_PROFILE;
  const channelName = process.env.FABRIC_CHANNEL;
  const chaincodeName = process.env.FABRIC_CHAINCODE;
  const certPath = process.env.FABRIC_CERT;
  const keyPath = process.env.FABRIC_KEY;

  if (!profilePath || !fs.existsSync(profilePath)) {
    throw new Error('FABRIC_CONNECTION_PROFILE not found.');
  }
  if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    throw new Error('FABRIC_CERT or FABRIC_KEY not found.');
  }

  const cp = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
  const peerName = Object.keys(cp.peers)[0];
  const peer = cp.peers[peerName];

  // TLS root cert
  const tlsCert = peer.tlsCACerts?.pem || fs.readFileSync(peer.tlsCACerts?.path || '', 'utf8');
  const tlsCredentials = grpc.credentials.createSsl(Buffer.from(tlsCert));

  const client = new grpc.Client(peer.url.replace('grpcs://', ''), tlsCredentials, {
    'grpc.ssl_target_name_override': peerName,
  });

  const certPem = fs.readFileSync(certPath);
  const keyPem = fs.readFileSync(keyPath);
  const identity = identities.x509Identity(cp.organizations[Object.keys(cp.organizations)[0]].mspid, certPem);
  const signer = signers.newPrivateKeySigner(identities.privateKeyFromPem(keyPem));

  const gateway = await connect({
    client,
    identity,
    signer,
    hash: hash.SHA256,
  });

  const network = await gateway.getNetwork(channelName);
  const contract = network.getContract(chaincodeName);

  return { gateway, network, contract };
}

export async function withContract(fn) {
  const gw = await createFabricGateway();
  try {
    return await fn(gw.contract);
  } finally {
    gw.gateway.close();
  }
}

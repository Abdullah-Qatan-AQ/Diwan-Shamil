window.chainReady=(async()=>{
  const {HDKey}=await import('https://esm.sh/@scure/bip32@1.5.0?bundle');
  const {bech32,base58}=await import('https://esm.sh/@scure/base@1.1.7?bundle');
  const {ed25519}=await import('https://esm.sh/@noble/curves@1.9.7/ed25519?bundle');
  const {ripemd160}=await import('https://esm.sh/@noble/hashes@1.7.2/ripemd160?bundle');
  const hash160=bytes=>ripemd160(new Uint8Array(crypto.subtle.digest('SHA-256',bytes)));
  const hexToBytes=h=>{h=h.replace(/^0x/,'');return Uint8Array.from(h.match(/.{1,2}/g).map(x=>parseInt(x,16)))};
  const hmac=async(key,data)=>{const k=await crypto.subtle.importKey('raw',key,{name:'HMAC',hash:'SHA-512'},false,['sign']);return new Uint8Array(await crypto.subtle.sign('HMAC',k,data))};
  const hardened=i=>i+0x80000000;
  async function slip10(seed,path){let I=await hmac(new TextEncoder().encode('ed25519 seed'),seed),key=I.slice(0,32),chain=I.slice(32);for(const i of path){const b=new Uint8Array(37);b[0]=0;b.set(key,1);new DataView(b.buffer).setUint32(33,hardened(i),false);I=await hmac(chain,b);key=I.slice(0,32);chain=I.slice(32)}return key}
  return async seedHex=>{
    const seed=hexToBytes(seedHex),child=HDKey.fromMasterSeed(seed).derive("m/84'/0'/0'/0/0");
    if(!child.publicKey)throw Error('Bitcoin public key derivation failed');
    const sha=new Uint8Array(await crypto.subtle.digest('SHA-256',child.publicKey));
    const h160=ripemd160(sha);
    const btc=bech32.encode('tb',[0,...bech32.toWords(h160)],90);
    const solKey=await slip10(seed,[44,501,0,0]),sol=base58.encode(ed25519.getPublicKey(solKey));
    return {bitcoin:btc,bitcoinPrivateKey:child.privateKey?Array.from(child.privateKey):null,solana:sol};
  };
})().catch(e=>{console.error('Chain helpers unavailable',e);return null});

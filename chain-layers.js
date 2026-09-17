/* Independent transaction builders. No method broadcasts automatically. */
const ERC20_ABI=['function balanceOf(address) view returns (uint256)','function decimals() view returns (uint8)','function symbol() view returns (string)','function allowance(address,address) view returns (uint256)','function approve(address,uint256) returns (bool)','function transfer(address,uint256) returns (bool)'];
const erc20Contract=(address,runner)=>new ethers.Contract(address,ERC20_ABI,runner);
async function erc20Info(provider,token,owner,spender){
  if(!ethers.isAddress(token)||!ethers.isAddress(owner))throw Error('عنوان عقد أو مالك ERC-20 غير صحيح');
  const c=erc20Contract(token,provider), decimals=await c.decimals(), symbol=await c.symbol();
  const result={token,symbol,decimals,balance:await c.balanceOf(owner)};
  if(spender){if(!ethers.isAddress(spender))throw Error('عنوان spender غير صحيح');result.allowance=await c.allowance(owner,spender)}
  return result;
}
async function erc20Transfer(signer,token,to,amount,decimals){
  if(!ethers.isAddress(to))throw Error('عنوان المستلم غير صحيح');
  const value=ethers.parseUnits(String(amount),decimals), c=erc20Contract(token,signer);
  return c.transfer.populateTransaction(to,value);
}
async function approveExact(signer,token,spender,amount,decimals){
  if(!ethers.isAddress(spender))throw Error('عنوان spender غير صحيح');
  return erc20Contract(token,signer).approve.populateTransaction(spender,ethers.parseUnits(String(amount),decimals));
}
async function allowance(provider,token,owner,spender){return erc20Contract(token,provider).allowance(owner,spender)}
async function simulate(provider,tx){
  if(!tx?.to)throw Error('بيانات معاملة ناقصة');
  await provider.call(tx); return true;
}
async function tronTrc20Info(tronWeb,token,owner){
  if(!tronWeb.isAddress(token)||!tronWeb.isAddress(owner))throw Error('عنوان TRON غير صحيح');
  const c=await tronWeb.contract().at(token);
  const [decimals,symbol,balance]=await Promise.all([c.decimals().call(),c.symbol().call(),c.balanceOf(owner).call()]);
  return {token,owner,decimals:Number(decimals),symbol,balance:String(balance)};
}
async function tronTrc20Transfer(tronWeb,token,to,amount,decimals){
  if(!tronWeb.isAddress(token)||!tronWeb.isAddress(to))throw Error('عنوان TRC-20 غير صحيح');
  const c=await tronWeb.contract().at(token); return c.transfer(to,String(BigInt(Math.round(Number(amount)*10**decimals))).toString()).transaction();
}
async function solanaNativeTransfer(web3,from,to,lamports){
  const source=new web3.PublicKey(from), destination=new web3.PublicKey(to);
  return new web3.Transaction().add(web3.SystemProgram.transfer({fromPubkey:source,toPubkey:destination,lamports:BigInt(lamports)}));
}
async function solanaSplTransfer(spl,web3,connection,mint,owner,to,amount,decimals){
  const mintKey=new web3.PublicKey(mint), ownerKey=new web3.PublicKey(owner), toKey=new web3.PublicKey(to);
  const source=await spl.getOrCreateAssociatedTokenAccount(connection,mintKey,ownerKey,ownerKey);
  const destination=await spl.getOrCreateAssociatedTokenAccount(connection,mintKey,toKey,toKey);
  return spl.createTransferInstruction(source.address,destination.address,ownerKey,BigInt(Math.round(Number(amount)*10**decimals)));
}
async function bitcoinPsbt(bitcoin,network,utxos,to,amountSats,change){
  if(!bitcoin||!bitcoin.Psbt)throw Error('Bitcoin library غير محملة');
  const psbt=new bitcoin.Psbt({network}); let total=0;
  for(const u of utxos){psbt.addInput({hash:u.txid,index:u.vout,witnessUtxo:{script:Buffer.from(u.script,'hex'),value:BigInt(u.value)}});total+=Number(u.value)}
  if(total<amountSats)throw Error('رصيد UTXO غير كافٍ');
  psbt.addOutput({address:to,value:amountSats}); if(change&&total-amountSats>0)psbt.addOutput({address:change,value:total-amountSats});
  return psbt;
}
window.CryptoLayers={ERC20_ABI,erc20Info,erc20Transfer,approveExact,allowance,simulate,tronTrc20Info,tronTrc20Transfer,solanaNativeTransfer,solanaSplTransfer,bitcoinPsbt};

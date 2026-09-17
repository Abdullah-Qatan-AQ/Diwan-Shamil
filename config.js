window.CRYPTO_HUB_CONFIG = {
  storageKey:'crypto_hub_v2_encrypted',
  networkModeKey:'crypto_hub_network_mode',
  defaultNetworkMode:'mainnet',
  activeNetworkKeys:['ethereum','bnb'],
  ads:{provider:'A-Ads',unitId:'2455510'},
  referralLinks:{
    freecash:'https://freecash.com/r/377TY6', faucetpay:'https://faucetpay.io/r/10151849', timebucks:'https://timebucks.com/?refID=230048987', cointiply:'https://cointiply.mobi/QW9zy0', coinpayz:'https://coinpayz.xyz/r/818836', viefaucet:'https://viefaucet.com?r=6a9f5fc3ceaac88d2429c4a8'
  },
  earnSites:[
    {id:'freecash',name:'Freecash',symbol:'F',color:'mint',tag:'PTC · Offers',description:'منصة تجمع الاستبيانات والعروض والألعاب في مكان واحد.',url:'https://freecash.com/',referralKey:'freecash'},
    {id:'faucetpay',name:'FaucetPay',symbol:'F',color:'violet',tag:'Micro-wallet',description:'محفظة وخدمة تجميع للمدفوعات الصغيرة من مواقع الكسب.',url:'https://faucetpay.io/',referralKey:'faucetpay'},
    {id:'timebucks',name:'TimeBucks',symbol:'T',color:'amber',tag:'PTC · Surveys',description:'مهام صغيرة واستبيانات ومشاهدة محتوى عبر رابط التسجيل المباشر.',url:'https://timebucks.com/',referralKey:'timebucks'},
    {id:'cointiply',name:'Cointiply',symbol:'C',color:'pink',tag:'Faucet · Offers',description:'عروض ومهام ومكافآت كريبتو من منصة خارجية مستقلة.',url:'https://cointiply.com/',referralKey:'cointiply'},
    {id:'coinpayz',name:'CoinPayz',symbol:'P',color:'violet',tag:'Faucet · PTC',description:'موقع خارجي لمهام PTC والفوسيت ومكافآت العملات الرقمية.',url:'https://coinpayz.xyz/',referralKey:'coinpayz'},
    {id:'viefaucet',name:'VieFaucet',symbol:'V',color:'amber',tag:'Faucet · Offers',description:'منصة خارجية للفوسيت والعروض مع رابط التسجيل الخاص بك.',url:'https://viefaucet.com/',referralKey:'viefaucet'}
  ],
  networkProfiles:{
    testnet:{
      ethereum:{name:'Ethereum Sepolia',symbol:'ETH',chainId:11155111,rpcUrl:'https://ethereum-sepolia-rpc.publicnode.com',testnet:true},
      bnb:{name:'BNB Chain Testnet',symbol:'tBNB',chainId:97,rpcUrl:'https://bsc-testnet-rpc.publicnode.com',testnet:true},
      polygon:{name:'Polygon Amoy',symbol:'POL',chainId:80002,rpcUrl:'https://polygon-amoy-bor-rpc.publicnode.com',testnet:true},
      arbitrum:{name:'Arbitrum Sepolia',symbol:'ETH',chainId:421614,rpcUrl:'https://arbitrum-sepolia-rpc.publicnode.com',testnet:true},
      avalanche:{name:'Avalanche Fuji',symbol:'AVAX',chainId:43113,rpcUrl:'https://avalanche-fuji-c-chain-rpc.publicnode.com',testnet:true},
      tron:{name:'TRON Shasta',symbol:'tTRX',rpcUrl:'https://api.shasta.trongrid.io',testnet:true},
      bitcoin:{name:'Bitcoin Testnet',symbol:'tBTC',apiBase:'https://mempool.space/testnet/api',testnet:true},
      solana:{name:'Solana Devnet',symbol:'SOL',rpcUrl:'https://api.devnet.solana.com',testnet:true}
    },
    mainnet:{
      ethereum:{name:'Ethereum',symbol:'ETH',chainId:1,rpcUrl:'https://cloudflare-eth.com',testnet:false},
      bnb:{name:'BNB Chain',symbol:'BNB',chainId:56,rpcUrl:'https://bsc-dataseed.binance.org',testnet:false},
      polygon:{name:'Polygon',symbol:'POL',chainId:137,rpcUrl:'https://polygon-rpc.com',testnet:false},
      arbitrum:{name:'Arbitrum One',symbol:'ETH',chainId:42161,rpcUrl:'https://arb1.arbitrum.io/rpc',testnet:false},
      avalanche:{name:'Avalanche C-Chain',symbol:'AVAX',chainId:43114,rpcUrl:'https://api.avax.network/ext/bc/C/rpc',testnet:false},
      tron:{name:'TRON Mainnet',symbol:'TRX',rpcUrl:'https://api.trongrid.io',testnet:false},
      bitcoin:{name:'Bitcoin',symbol:'BTC',apiBase:'https://mempool.space/api',testnet:false},
      solana:{name:'Solana Mainnet',symbol:'SOL',rpcUrl:'https://api.mainnet-beta.solana.com',testnet:false}
    }
  },
  networks:null,
  tokens:{},
  dex:{provider:'Uniswap/PancakeSwap/0x',zeroExApiBase:'',zeroExApiKey:'',routerAddresses:{},slippageBps:50},
  safety:{allowUnlimitedApprovals:false,requireSimulation:true,requireExactChainId:true}
};

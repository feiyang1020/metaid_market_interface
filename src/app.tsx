
import VConsole from 'vconsole';
window.METAID_MARKET_NETWORK = (process.env.METAID_MARKET_NETWORK || "mainnet") as API.Network;
if(window.METAID_MARKET_NETWORK === 'testnet'){
    const vConsole = new VConsole();
}

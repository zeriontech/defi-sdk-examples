"use strict";
//https://github.com/ethereum/web3.js/
const Web3 = require('web3');
const DeFiSdkAbi = require('../defi-sdk-abi');
const BN = require('bignumber.js')

const nodeUrl = 'https://eth-mainnet.zerion.io/';
const DeFiSdkAddress = '0x06FE76B2f432fdfEcAEf1a7d4f6C3d41B5861672';
const userAddress = '0x42b9dF65B219B3dD36FF330A4dD8f327A6Ada990';

let ethereumNode = new Web3.providers.HttpProvider(nodeUrl)
let web3 = new Web3(ethereumNode);

let defiSdk = new web3.eth.Contract(DeFiSdkAbi, DeFiSdkAddress);

(async () => {

    function getNormalizedNumber(number, decimals) {
        return new BN(number).dividedBy(
            new BN(10).pow(decimals)
        );
    }

    // List of available protocols
    let protocols = await defiSdk.methods.getProtocolNames().call();
    console.log('Available adapters', protocols);
    console.log('___________________________');

    // Protocol metadata
    let protocolMetaData = await  defiSdk.methods.getProtocolMetadata('Aave').call();
    console.log(protocolMetaData);
    console.log('Protocol', {
        'Name:': protocolMetaData.name,
        'Description:': protocolMetaData.description,
        'Website:': protocolMetaData.websiteURL,
        'Logo:': protocolMetaData.iconURL,
        'Version:': protocolMetaData.version
    });
    console.log('___________________________');

    // User balances on selected protocols or use getBalances(userAddress) for all protocols at once
    let balancesOnSelectedProtocols = await defiSdk.methods.getProtocolBalances(
        userAddress, ['Aave', 'Compound', 'Synthetix', 'PoolTogether']
    ).call();

    balancesOnSelectedProtocols.forEach((protocol) => {
        // The top level has protocol and adapters information
        console.log('Protocol:', protocol.metadata.name);
        protocol.adapterBalances.forEach((protocolBalances) => {
            // Each adapter could either be an Asset or Debt on the protocol
            console.log('Balance type:', protocolBalances.metadata.adapterType);
            protocolBalances.balances.forEach((balance) => {
                // Inside of each adapter there is an info about the asset and the balance
                let position = {
                    'Token': balance.base.metadata.name,
                    'Balance': getNormalizedNumber(balance.base.amount, balance.base.metadata.decimals).toString()
                };

                // If asset is a derivative then there will be underlying assets
                if(balance.underlying.length > 0) {
                    let underlying = [];
                    balance.underlying.forEach((asset) => {
                        underlying.push({
                            'Token': asset.metadata.name,
                            'Balance': getNormalizedNumber(
                                asset.amount, asset.metadata.decimals
                            ).toString()
                        })
                    });
                    position['Underlying'] = underlying
                }

                console.log('Position:', position);
            })
        })
        console.log('___________________________');
    });

    // Decode derivative into underlyings (Uniswap cDAI ETH as an example)
    let derivative = await defiSdk.methods.getFinalFullTokenBalance(
        "Uniswap V1 pool token",
        '0x34E89740adF97C3A9D3f63Cc2cE4a914382c230b'
    ).call()

    console.log('Token', derivative.base.metadata.name);

    if(derivative.underlying.length > 0) {
        let components = [];

        derivative.underlying.forEach((component) => {
            components.push(
                {
                    'Component': component.metadata.name,
                    'Amount': getNormalizedNumber(component.amount, component.metadata.decimals).toString(),
                    'Symbol': component.metadata.symbol
                }
            )
        });

        console.log('Consists of ', components);
    } else {
        console.log('Is base token');
    }

})();




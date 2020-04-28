"use strict";
//https://docs.ethers.io/ethers.js/html/
const ethers = require('ethers');
const DeFiSdkAbi = require('../defi-sdk-abi')
const BN = require('bignumber.js')

const nodeUrl = 'https://cloudflare-eth.com';
const DeFiSdkAddress = '0x06FE76B2f432fdfEcAEf1a7d4f6C3d41B5861672';
const userAddress = '0x42b9dF65B219B3dD36FF330A4dD8f327A6Ada990';

let ethereumNode = new ethers.providers.JsonRpcProvider(nodeUrl);

let defiSdk = new ethers.Contract(DeFiSdkAddress, DeFiSdkAbi, ethereumNode);

(async () => {

    function getNormalizedNumber(number, decimals) {
        return new BN(number).dividedBy(
            new BN(10).pow(decimals)
        );
    }

    // List of available protocols
    let protocols = await defiSdk.getProtocolNames()
    console.log('Available adapters', protocols);
    console.log('___________________________');

    // Protocol metadata
    let protocolMetaData = await  defiSdk.getProtocolMetadata('Aave');
    console.log('Protocol', {
        'Name:': protocolMetaData.name,
        'Description:': protocolMetaData.description,
        'Website:': protocolMetaData.websiteURL,
        'Logo:': protocolMetaData.iconURL,
        'Version:': protocolMetaData.version.toNumber()
    });
    console.log('___________________________');

    // User balances on selected protocols or use getBalances(userAddress) for all protocols at once
    let balancesOnSelectedProtocols = await defiSdk.getProtocolBalances(
        userAddress, ['Aave', 'Compound', 'Synthetix', 'PoolTogether']
    );

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
                    'Balance': getNormalizedNumber(balance.base.amount.toString(), balance.base.metadata.decimals).toString()
                };

                // If asset is a derivative then there will be underlying assets
                if(balance.underlying.length > 0) {
                    let underlying = [];
                    balance.underlying.forEach((asset) => {
                        underlying.push({
                            'Component': asset.metadata.name,
                            'Amount': getNormalizedNumber(
                                asset.amount.toString(), asset.metadata.decimals
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
    let derivative = await defiSdk.getFinalFullTokenBalance(
        "Uniswap V1 pool token",
        '0x34E89740adF97C3A9D3f63Cc2cE4a914382c230b'
    );

    console.log('Token', derivative.base.metadata.name);

    if(derivative.underlying.length > 0) {
        let components = [];

        derivative.underlying.forEach((component) => {
            components.push(
                {
                    'Component': component.metadata.name,
                    'Amount': getNormalizedNumber(component.amount.toString(), component.metadata.decimals).toString(),
                    'Symbol': component.metadata.symbol
                }
            )
        });

        console.log('Consists of ', components);
    } else {
        console.log('Is base token');
    }

})();




import { ethers } from 'ethers';
import { useState, useEffect } from 'react';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../contracts/config';
import WalletConnectProvider from '@walletconnect/web3-provider';

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

export function useContract() {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string>('');
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [wcProvider, setWcProvider] = useState<WalletConnectProvider | null>(null);

  const initWalletConnect = async () => {
    const wcProvider = new WalletConnectProvider({
      rpc: {
        56: 'https://bsc-dataseed.binance.org'
      },
      chainId: 56
    });

    setWcProvider(wcProvider);
    
    // Subscribe to accounts change
    wcProvider.on('accountsChanged', (accounts: string[]) => {
      if (accounts.length > 0) {
        setAddress(accounts[0]);
      } else {
        setAddress('');
        setConnected(false);
      }
    });

    // Subscribe to chainId change
    wcProvider.on('chainChanged', (chainId: number) => {
      setChainId(chainId);
    });

    // Subscribe to session disconnection
    wcProvider.on('disconnect', () => {
      setAddress('');
      setConnected(false);
    });

    return wcProvider;
  };

  const connect = async () => {
    try {
      setIsConnecting(true);

      if (isMobile) {
        // Utiliser WalletConnect sur mobile
        const wcProviderInstance = wcProvider || await initWalletConnect();
        await wcProviderInstance.enable();
        
        const web3Provider = new ethers.providers.Web3Provider(wcProviderInstance);
        const signer = web3Provider.getSigner();
        const address = await signer.getAddress();
        const chainId = await web3Provider.getNetwork().then(network => network.chainId);
        
        setProvider(web3Provider);
        setSigner(signer);
        setAddress(address);
        setChainId(chainId);
        setConnected(true);
        
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        setContract(contract);
      } else {
        // Utiliser MetaMask sur desktop
        if (typeof window.ethereum === 'undefined') {
          throw new Error('Please install MetaMask');
        }

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send('eth_requestAccounts', []);
        
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        const chainId = await provider.getNetwork().then(network => network.chainId);
        
        setProvider(provider);
        setSigner(signer);
        setAddress(address);
        setChainId(chainId);
        setConnected(true);
        
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        setContract(contract);
      }
    } catch (error) {
      console.error('Connection error:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (wcProvider) {
        wcProvider.disconnect();
      }
    };
  }, [wcProvider]);

  return {
    contract,
    connected,
    address,
    chainId,
    connect,
    provider,
    isConnecting
  };
}
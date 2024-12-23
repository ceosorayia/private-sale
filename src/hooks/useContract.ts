import { useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../contracts/config';
import toast from 'react-hot-toast';

export function useContract() {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string>('');
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(provider);
      
      // Gestionnaires d'événements pour les changements de réseau et de compte
      const handleChainChanged = () => {
        window.location.reload();
      };

      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // L'utilisateur s'est déconnecté
          setConnected(false);
          setAddress('');
          setSigner(null);
          setContract(null);
        } else if (accounts[0] !== address) {
          // Nouveau compte sélectionné
          window.location.reload();
        }
      };

      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('accountsChanged', handleAccountsChanged);

      // Nettoyage des écouteurs d'événements
      return () => {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [address]);

  useEffect(() => {
    const checkNetwork = async () => {
      if (provider) {
        try {
          const network = await provider.getNetwork();
          setChainId(network.chainId);
        } catch (error) {
          console.error('Error checking network:', error);
          setChainId(null);
        }
      }
    };
    checkNetwork();
  }, [provider]);

  const connect = useCallback(async () => {
    if (!provider) {
      toast.error('Please install MetaMask to use this application');
      return;
    }

    try {
      setIsConnecting(true);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();
      
      if (network.chainId !== 56) { // BSC Mainnet
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x38' }], // BSC Mainnet
          });
        } catch (switchError: any) {
          // Si le réseau n'est pas configuré, on propose de l'ajouter
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0x38',
                  chainName: 'Binance Smart Chain',
                  nativeCurrency: {
                    name: 'BNB',
                    symbol: 'BNB',
                    decimals: 18
                  },
                  rpcUrls: ['https://bsc-dataseed.binance.org/'],
                  blockExplorerUrls: ['https://bscscan.com/']
                }]
              });
            } catch (addError) {
              console.error('Error adding BSC network:', addError);
              toast.error('Failed to add BSC network to MetaMask');
              return;
            }
          } else {
            console.error('Error switching network:', switchError);
            toast.error('Failed to switch to BSC network');
            return;
          }
        }
      }
      
      setSigner(signer);
      setAddress(address);
      setConnected(true);

      // Initialiser le contrat après la connexion
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      setContract(contract);
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      if (error.code === 4001) {
        toast.error('Please accept the connection request in MetaMask');
      } else {
        toast.error('Failed to connect wallet');
      }
    } finally {
      setIsConnecting(false);
    }
  }, [provider]);

  return { 
    contract, 
    connected, 
    address, 
    chainId, 
    connect,
    isConnecting,
    provider 
  };
}
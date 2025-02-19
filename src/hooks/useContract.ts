import { ethers } from 'ethers';
import { useState, useEffect } from 'react';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../contracts/config';
import WalletConnectProvider from '@walletconnect/web3-provider';
import toast from 'react-hot-toast';

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const metamaskAppUrl = `https://metamask.app.link/dapp/${window.location.host}`;
const metamaskPlayStoreUrl = 'https://play.google.com/store/apps/details?id=io.metamask';
const metamaskAppStoreUrl = 'https://apps.apple.com/us/app/metamask/id1438144202';
const metamaskExtensionUrl = 'https://metamask.io/download.html';

export function useContract() {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string>('');
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [wcProvider, setWcProvider] = useState<WalletConnectProvider | null>(null);

  useEffect(() => {
    const detectProvider = async () => {
      let detectedProvider;
      
      // Attendre que le provider soit injecté
      if (typeof window.ethereum !== 'undefined') {
        detectedProvider = window.ethereum;
      } else if (typeof window['web3'] !== 'undefined') {
        // Fallback pour d'anciennes versions
        detectedProvider = window['web3'].currentProvider;
      } else {
        console.log('No Ethereum provider detected');
        return;
      }

      const provider = new ethers.providers.Web3Provider(detectedProvider);
      setProvider(provider);
      
      // Initialiser le contrat en lecture seule avec le provider
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      setContract(contract);
      
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
    };
    detectProvider();
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

  useEffect(() => {
    const checkExistingConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        
        try {
          // Vérifier si des comptes sont déjà connectés
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
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
            
            // Vérifier que le contrat existe à l'adresse spécifiée
            try {
              const code = await provider.getCode(CONTRACT_ADDRESS);
              if (code === '0x') {
                console.error('No contract found at address:', CONTRACT_ADDRESS);
                toast.error('Contract not found at specified address');
                return;
              }
            } catch (error) {
              console.error('Error checking contract:', error);
              toast.error('Failed to verify contract');
              return;
            }

            // Initialiser le contrat avec le signer pour les transactions
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
            
            setSigner(signer);
            setAddress(address);
            setConnected(true);
            setContract(contract);
          }
        } catch (error) {
          console.error('Error checking existing connection:', error);
        }
      }
    };

    checkExistingConnection();
  }, []);

  const connect = async () => {
    try {
      setIsConnecting(true);
      
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const isMetaMaskBrowser = window.ethereum?.isMetaMask;

      if (isMobile) {
        if (isMetaMaskBrowser) {
          // Si on est déjà dans l'app MetaMask, on se connecte directement
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          
          try {
            await window.ethereum.request({
              method: 'eth_requestAccounts'
            });
            
            const signer = provider.getSigner();
            const address = await signer.getAddress();
            const network = await provider.getNetwork();
            
            if (network.chainId !== 56) {
              try {
                await window.ethereum.request({
                  method: 'wallet_switchEthereumChain',
                  params: [{ chainId: '0x38' }]
                });
              } catch (switchError: any) {
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

            // Vérifier que le contrat existe
            const code = await provider.getCode(CONTRACT_ADDRESS);
            if (code === '0x') {
              console.error('No contract found at address:', CONTRACT_ADDRESS);
              toast.error('Contract not found at specified address');
              return;
            }

            // Initialiser le contrat avec le signer
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
            
            setSigner(signer);
            setAddress(address);
            setConnected(true);
            setContract(contract);
            
          } catch (error: any) {
            console.error('Failed to connect wallet:', error);
            if (error.code === 4001) {
              toast.error('Please accept the connection request in MetaMask');
            } else {
              toast.error('Failed to connect wallet');
            }
          }
        } else {
          // Si on n'est pas dans l'app MetaMask, on essaie d'ouvrir l'app
          window.location.href = metamaskAppUrl;
          
          // Si après un court délai nous sommes toujours sur la même page,
          // cela signifie que MetaMask n'est pas installé
          setTimeout(() => {
            if (document.hidden || document.visibilityState === 'hidden') {
              // L'app MetaMask s'est ouverte
              return;
            }
            // MetaMask n'est pas installé, redirection vers le store
            window.location.href = /Android/i.test(navigator.userAgent) 
              ? metamaskPlayStoreUrl 
              : metamaskAppStoreUrl;
          }, 1000);
        }
      } else {
        // Sur navigateur desktop
        if (!window.ethereum) {
          // Si MetaMask n'est pas installé, on redirige vers la page de téléchargement
          window.location.href = metamaskExtensionUrl;
          return;
        }
        
        // Si MetaMask est installé, on procède à la connexion
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        
        try {
          await window.ethereum.request({
            method: 'eth_requestAccounts'
          });
          
          const signer = provider.getSigner();
          const address = await signer.getAddress();
          const network = await provider.getNetwork();
          
          if (network.chainId !== 56) {
            try {
              await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x38' }]
              });
            } catch (switchError: any) {
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

          // Vérifier que le contrat existe
          const code = await provider.getCode(CONTRACT_ADDRESS);
          if (code === '0x') {
            console.error('No contract found at address:', CONTRACT_ADDRESS);
            toast.error('Contract not found at specified address');
            return;
          }

          // Initialiser le contrat avec le signer
          const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
          
          setSigner(signer);
          setAddress(address);
          setConnected(true);
          setContract(contract);
          
        } catch (error: any) {
          console.error('Failed to connect wallet:', error);
          if (error.code === 4001) {
            toast.error('Please accept the connection request in MetaMask');
          } else {
            toast.error('Failed to connect wallet');
          }
        }
      }
    } catch (error) {
      console.error('Connection error:', error);
      toast.error('Failed to connect');
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

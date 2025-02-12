import React from 'react';
import { useContract } from './hooks/useContract';
import { useBalance } from './hooks/useBalance';
import toast, { Toaster } from 'react-hot-toast';
import { ContractInfo } from './components/ContractInfo';
import { BuyForm } from './components/BuyForm';
import { TokenPrice } from './components/TokenPrice';
import { formatAddress } from './utils/formatters';

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

function App() {
  const { contract, connected, address, chainId, connect, provider } = useContract();
  const { balance } = useBalance(provider, address);

  const isWrongNetwork = chainId !== null && chainId !== 56;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-black text-white flex items-center justify-center">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl shadow-lg p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold">SRA Token</h1>
                <p className="text-sm text-gray-400">Private sale</p>
              </div>
              {connected ? (
                <div className="flex items-center text-sm bg-gray-700/50 backdrop-blur rounded-full px-4 py-2">
                  <img src="/metamask.svg" alt="MetaMask" className="w-4 h-4 mr-2" />
                  {formatAddress(address)}
                </div>
              ) : (
                <button
                  onClick={connect}
                  className="flex items-center bg-blue-600 hover:bg-blue-700 rounded-full px-4 py-2 text-sm transition-colors"
                >
                  <img src="/metamask.svg" alt="MetaMask" className="w-5 h-5 mr-2" />
                  {isMobile ? 'Open MetaMask' : 'Connect'}
                </button>
              )}
            </div>

            {isWrongNetwork && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                Veuillez vous connecter au réseau BSC
              </div>
            )}

            {connected && !isWrongNetwork && (
              <>
                <TokenPrice />
                <ContractInfo contract={contract} />
                <BuyForm 
                  contract={contract} 
                  balance={balance} 
                  account={address}
                />
              </>
            )}

            {!connected && isMobile && (
              <div className="mt-4 text-sm text-gray-400">
                <p className="mb-2">
                  1. Install MetaMask if you haven't already
                </p>
                <p>
                  2. Open this page in MetaMask's browser
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
}

export default App;

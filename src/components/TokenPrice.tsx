import React, { useState, useEffect } from 'react';
import { useContract } from '../hooks/useContract';
import { formatBNB } from '../utils/formatters';
import { RefreshCw } from 'lucide-react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { MIN_BNB_CONTRIBUTION, MAX_BNB_CONTRIBUTION } from '../contracts/config';
import { setTokensPerBNB } from '../utils/tokenPrice';

export function TokenPrice() {
  const { contract } = useContract();
  const [maxBnb, setMaxBnb] = useState<string>(MAX_BNB_CONTRIBUTION.toString());
  const [minBnb, setMinBnb] = useState<string>(MIN_BNB_CONTRIBUTION.toString());
  const [tokensPerBnb, setTokensPerBnb] = useState<string>('--');
  const [tokensPerBNB, setTokensPerBNB] = useState<string>('--'); 
  const [isLoading, setIsLoading] = useState(false);

  const fetchLimits = async () => {
    if (!contract) {
      console.log('TokenPrice: Contract not initialized');
      return;
    }

    setIsLoading(true);
    console.log('TokenPrice: Fetching limits...', {
      contractAddress: contract.address,
      providerNetwork: await contract.provider.getNetwork()
    });

    try {
      // Fetch tokensPerBNB
      console.log('TokenPrice: Fetching tokensPerBNB...');
      const tokensPerBnbWei = await contract.tokensPerBNB();
      console.log('TokenPrice: tokensPerBnbWei:', tokensPerBnbWei.toString());
      
      const formattedTokensPerBnb = ethers.utils.formatEther(tokensPerBnbWei);
      console.log('TokenPrice: Formatted values:', {
        tokensPerBnb: formattedTokensPerBnb
      });

      setTokensPerBnb(formattedTokensPerBnb);
      setTokensPerBNB(formattedTokensPerBnb); 

    } catch (error: any) {
      console.error('TokenPrice: Error fetching limits:', {
        error,
        message: error.message,
        code: error.code,
        reason: error.reason
      });
      toast.error(`Error fetching token price information: ${error.message}`);
      setTokensPerBnb('--');
      setTokensPerBNB('--'); 
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('TokenPrice: Component mounted/updated', { contract: !!contract });
    fetchLimits();
    const interval = setInterval(fetchLimits, 30000);
    return () => clearInterval(interval);
  }, [contract]);

  return (
    <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Purchase Information</span>
          <button
            onClick={fetchLimits}
            disabled={isLoading}
            className="p-1 hover:bg-blue-500/20 rounded-full transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-4">
        <div>
          <div className="text-sm text-gray-400">Minimum</div>
          <div className="text-lg font-medium text-white">
            {minBnb} BNB
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-400">Maximum</div>
          <div className="text-lg font-medium text-white">
            {maxBnb} BNB
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-400">1 BNB =</div>
          <div className="text-lg font-medium text-white">
            {tokensPerBnb === '--' ? '--' : Number(tokensPerBnb).toLocaleString()} SRA
          </div>
        </div>
      </div>
    </div>
  );
}
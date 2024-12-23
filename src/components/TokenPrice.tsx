import React, { useState, useEffect } from 'react';
import { useContract } from '../hooks/useContract';
import { formatBNB } from '../utils/formatters';
import { RefreshCw } from 'lucide-react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

export function TokenPrice() {
  const { contract } = useContract();
  const [maxBnb, setMaxBnb] = useState<string>('5');
  const [minBnb, setMinBnb] = useState<string>('0.1');
  const [tokensPerBnb, setTokensPerBnb] = useState<string>('3500');
  const [isLoading, setIsLoading] = useState(false);

  const fetchLimits = async () => {
    if (!contract) {
      console.log('TokenPrice: Contract not initialized');
      return;
    }

    setIsLoading(true);
    console.log('TokenPrice: Fetching limits...');

    try {
      const [maxBnbWei, minBnbWei, tokensPerBnbWei] = await Promise.all([
        contract.maxBnbPerUser(),
        contract.minBnbPerUser(),
        contract.tokensPerBNB()
      ]);

      const formattedMaxBnb = ethers.utils.formatEther(maxBnbWei);
      const formattedMinBnb = ethers.utils.formatEther(minBnbWei);
      const formattedTokensPerBnb = ethers.utils.formatEther(tokensPerBnbWei);

      console.log('TokenPrice: Fetched values', {
        maxBnb: formattedMaxBnb,
        minBnb: formattedMinBnb,
        tokensPerBnb: formattedTokensPerBnb
      });

      setMaxBnb(formattedMaxBnb);
      setMinBnb(formattedMinBnb);
      setTokensPerBnb(formattedTokensPerBnb);

    } catch (error) {
      console.error('TokenPrice: Error fetching limits:', error);
      toast.error('Error fetching token price information');
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
            {Number(tokensPerBnb).toLocaleString()} SRA
          </div>
        </div>
      </div>
    </div>
  );
}
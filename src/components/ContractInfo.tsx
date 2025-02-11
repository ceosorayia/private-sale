import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { CONTRACT_ADDRESS } from '../contracts/config';

interface ContractInfoProps {
  contract: ethers.Contract | null;
}

export function ContractInfo({ contract }: ContractInfoProps) {
  const [remainingTokens, setRemainingTokens] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(false);
  const [saleActive, setSaleActive] = useState(false);

  const fetchContractData = async () => {
    if (!contract) {
      console.log('Contract not initialized');
      return;
    }
    
    setIsLoading(true);
    console.log('Fetching contract data...', {
      contractAddress: contract.address,
      providerNetwork: await contract.provider.getNetwork()
    });

    try {
      // Fetch remaining tokens
      const remaining = await contract.remainingSRATokens();
      console.log('Remaining tokens raw:', remaining.toString());
      
      // Fetch sale status
      const active = await contract.saleActive();
      console.log('Sale active status:', active);
      
      const formattedRemaining = ethers.utils.formatEther(remaining);
      console.log('Formatted remaining tokens:', formattedRemaining);
      
      setRemainingTokens(formattedRemaining);
      setSaleActive(active);
    } catch (error: any) {
      console.error('Error fetching contract data:', {
        error,
        errorMessage: error.message,
        code: error.code,
        reason: error.reason
      });
      toast.error(`Error fetching contract data: ${error.message}`);
      setRemainingTokens('--');
      setSaleActive(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('ContractInfo mounted/updated', { contract: !!contract });
    fetchContractData();
    const interval = setInterval(fetchContractData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [contract]);

  return (
    <div className="bg-gray-700/50 backdrop-blur rounded-lg p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Information</h2>
        <button 
          onClick={fetchContractData}
          disabled={isLoading}
          className="p-2 hover:bg-gray-600 rounded-full transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Remaining tokens</span>
          <span className="font-medium">
            {remainingTokens === '--' ? '--' : `${Number(remainingTokens).toLocaleString()} SRA`}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Sale status</span>
          <span className={`font-medium ${saleActive ? 'text-green-400' : 'text-red-400'}`}>
            {saleActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Contract</span>
          <a 
            href={`https://bscscan.com/address/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-blue-400 hover:text-blue-300 transition-colors"
          >
            {`${CONTRACT_ADDRESS.slice(0, 6)}...${CONTRACT_ADDRESS.slice(-4)}`}
          </a>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Clock, Gift } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatBNB } from '../utils/formatters';

interface VestingInfoProps {
  contract: ethers.Contract | null;
  account: string | null;
}

interface VestingData {
  totalAmount: ethers.BigNumber;
  claimedAmount: ethers.BigNumber;
  claimableNow: ethers.BigNumber;
  nextUnlock: ethers.BigNumber;
}

export function VestingInfo({ contract, account }: VestingInfoProps) {
  const [vestingData, setVestingData] = useState<VestingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  const fetchVestingInfo = async () => {
    if (!contract || !account) {
      console.log('VestingInfo: Contract or account not available', { contract, account });
      return;
    }

    try {
      setIsLoading(true);
      console.log('VestingInfo: Fetching vesting info for account', account);
      const info = await contract.getVestingInfo(account);
      console.log('VestingInfo: Received data', info);
      
      setVestingData({
        totalAmount: info.totalAmount,
        claimedAmount: info.claimedAmount,
        claimableNow: info.claimableNow,
        nextUnlock: info.nextUnlock,
      });
    } catch (error) {
      console.error('Error fetching vesting info:', error);
      setVestingData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('VestingInfo: Component mounted/updated', { contract, account });
    fetchVestingInfo();
    // Rafraîchir toutes les 60 secondes
    const interval = setInterval(fetchVestingInfo, 60000);
    return () => clearInterval(interval);
  }, [contract, account]);

  if (!vestingData && !isLoading) {
    console.log('VestingInfo: No vesting data available');
    return (
      <div className="space-y-4 mt-8">
        <div className="bg-gray-800/50 backdrop-blur rounded-lg p-4">
          <h2 className="text-xl font-semibold text-gray-200">Vesting Information</h2>
          <p className="text-sm text-gray-400 mt-2">
            No vesting information available. Buy tokens to see details here.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 mt-8">
        <div className="bg-gray-800/50 backdrop-blur rounded-lg p-4">
          <h2 className="text-xl font-semibold text-gray-200">Vesting Information</h2>
          <p className="text-sm text-gray-400 mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  const handleClaim = async () => {
    if (!contract || !vestingData || vestingData.claimableNow.eq(0)) return;

    try {
      setIsClaiming(true);
      const tx = await contract.claimTokens();
      
      toast.promise(tx.wait(), {
        loading: 'Claiming tokens...',
        success: 'Tokens claimed successfully!',
        error: 'Error claiming tokens'
      });

      await tx.wait();
      fetchVestingInfo();
    } catch (error: any) {
      console.error('Error claiming tokens:', error);
      toast.error(error.message || 'Error claiming tokens');
    } finally {
      setIsClaiming(false);
    }
  };

  const formatTimestamp = (timestamp: ethers.BigNumber) => {
    const date = new Date(timestamp.toNumber() * 1000);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="space-y-4 mt-8">
      <div className="bg-gray-800/50 backdrop-blur rounded-lg p-4 space-y-4">
        <h2 className="text-xl font-semibold text-gray-200">Vesting Information</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-400">Total purchased</p>
            <p className="text-lg text-gray-200">{formatBNB(vestingData.totalAmount)} SRA</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Already claimed</p>
            <p className="text-lg text-gray-200">{formatBNB(vestingData.claimedAmount)} SRA</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Available now</p>
            <p className="text-lg text-gray-200">{formatBNB(vestingData.claimableNow)} SRA</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Remaining to claim</p>
            <p className="text-lg text-gray-200">{formatBNB(vestingData.totalAmount.sub(vestingData.claimedAmount))} SRA</p>
          </div>
        </div>

        {vestingData.nextUnlock.gt(0) && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="w-4 h-4" />
            <span>Next unlock: {formatTimestamp(vestingData.nextUnlock)}</span>
          </div>
        )}

        {vestingData.claimableNow.gt(0) && (
          <button
            onClick={handleClaim}
            disabled={isClaiming}
            className="w-full mt-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white rounded-lg p-3 flex items-center justify-center gap-2 transition-colors"
          >
            <Gift className="w-5 h-5" />
            {isClaiming ? 'Claiming...' : `Claim ${formatBNB(vestingData.claimableNow)} SRA`}
          </button>
        )}
      </div>
    </div>
  );
}

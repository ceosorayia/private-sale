import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { parseAmount, formatBNB } from '../utils/formatters';
import { getErrorMessage } from '../utils/errors';
import { calculateTokenAmount } from '../utils/tokenPrice';
import { VestingInfo } from './VestingInfo';

interface BuyFormProps {
  contract: ethers.Contract | null;
  balance: ethers.BigNumber;
  account: string | null;
}

export function BuyForm({ contract, balance, account }: BuyFormProps) {
  const [bnbAmount, setBnbAmount] = useState('');
  const [saleActive, setSaleActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [estimatedGas, setEstimatedGas] = useState<string>('');

  useEffect(() => {
    const checkContractStatus = async () => {
      if (!contract) return;
      try {
        const [active, emergency] = await Promise.all([
          contract.saleActive(),
          contract.emergencyMode()
        ]);
        setSaleActive(active);
        setIsEmergencyMode(emergency);
      } catch (error) {
        console.error('Error checking contract status:', error);
      }
    };

    checkContractStatus();
  }, [contract]);

  const validateTransaction = (): boolean => {
    if (isEmergencyMode) {
      toast.error('The contract is currently in emergency mode. Transactions are temporarily suspended.');
      return false;
    }
    
    if (!bnbAmount || isNaN(Number(bnbAmount)) || Number(bnbAmount) <= 0) {
      toast.error('Please enter a valid amount greater than 0');
      return false;
    }

    const amount = Number(bnbAmount);
    if (amount < 0.1) {
      toast.error('Minimum contribution is 0.1 BNB');
      return false;
    }
    if (amount > 5) {
      toast.error('Maximum contribution is 5 BNB');
      return false;
    }

    return true;
  };

  const estimateGasFees = async (amount: string) => {
    if (!contract || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setEstimatedGas('');
      return;
    }

    try {
      const provider = contract.provider;
      const signer = contract.signer;
      const address = await signer.getAddress();
      
      const amountInWei = parseAmount(amount);
      const balance = await provider.getBalance(address);
      
      if (balance.lt(amountInWei)) {
        const balanceInBNB = formatBNB(balance);
        setEstimatedGas(`Insufficient balance (${balanceInBNB} BNB)`);
        return;
      }

      const feeData = await provider.getFeeData();
      if (!feeData.maxFeePerGas || !feeData.maxPriorityFeePerGas) {
        throw new Error('Unable to get network fee data');
      }
      
      const gasEstimate = await contract.estimateGas.buyTokens({
        value: amountInWei
      });

      const gasCost = gasEstimate.mul(feeData.maxFeePerGas);
      const totalCost = gasCost.add(amountInWei);
      
      if (balance.lt(totalCost)) {
        const totalNeeded = formatBNB(totalCost);
        const currentBalance = formatBNB(balance);
        setEstimatedGas(`Need ${totalNeeded} BNB (have ${currentBalance} BNB)`);
        return;
      }

      const gasCostInBNB = ethers.utils.formatEther(gasCost);
      const bnbPrice = 250; // Prix approximatif du BNB en USD
      const gasUSD = Number(gasCostInBNB) * bnbPrice;

      setEstimatedGas(`Gas: ~$${gasUSD.toFixed(2)}`);
    } catch (error) {
      console.error('Gas estimation error:', error);
      setEstimatedGas('Unable to estimate gas');
    }
  };

  useEffect(() => {
    estimateGasFees(bnbAmount);
  }, [bnbAmount, contract]);

  const buyTokens = async () => {
    if (!contract || !bnbAmount) return;
    
    if (!validateTransaction()) {
      return;
    }

    try {
      setIsLoading(true);
      
      const provider = contract.provider;
      const feeData = await provider.getFeeData();
      
      if (!feeData.maxFeePerGas || !feeData.maxPriorityFeePerGas) {
        throw new Error('Unable to get network fee data');
      }

      const tx = await contract.buyTokens({
        value: parseAmount(bnbAmount),
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
      });
      
      toast.promise(tx.wait(), {
        loading: 'Transaction in progress...',
        success: 'Tokens bought successfully!',
        error: (err) => getErrorMessage(err)
      });

      const receipt = await tx.wait();
      if (receipt.status === 1) {
        setBnbAmount('');
        // Forcer une mise à jour des données
        estimateGasFees('');
      }
    } catch (error: any) {
      console.error('Error buying tokens:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {isEmergencyMode && (
        <div className="p-4 bg-red-500/20 border border-red-500 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-300">
            The contract is in emergency mode. Transactions are temporarily suspended.
          </p>
        </div>
      )}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="block text-sm text-gray-300">Amount in BNB</label>
          {estimatedGas && (
            <span className={`text-sm ${estimatedGas.includes('Balance') || estimatedGas.includes('Need') ? 'text-yellow-400' : 'text-gray-400'}`}>
              {estimatedGas}
            </span>
          )}
        </div>
        <input
          type="number"
          value={bnbAmount}
          onChange={(e) => setBnbAmount(e.target.value)}
          placeholder="0.0"
          disabled={!saleActive || isLoading}
          className="w-full bg-gray-700/50 backdrop-blur rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
        />
        {Number(bnbAmount) > 0 && (
          <div className="text-sm text-gray-300">
            ≈ {calculateTokenAmount(bnbAmount)} SRA
          </div>
        )}
      </div>

      <button
        onClick={buyTokens}
        disabled={!saleActive || isLoading || isEmergencyMode}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white rounded-lg p-3 flex items-center justify-center gap-2 transition-colors"
      >
        Buy SRA
      </button>

      {account && <VestingInfo contract={contract} account={account} />}
    </div>
  );
}
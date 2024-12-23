import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export function useBalance(provider: ethers.providers.Web3Provider | null, address: string | null) {
  const [balance, setBalance] = useState<ethers.BigNumber>(ethers.BigNumber.from(0));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let intervalId: NodeJS.Timer;

    const fetchBalance = async () => {
      if (!provider || !address) {
        setBalance(ethers.BigNumber.from(0));
        setError(null);
        return;
      }
      
      if (!mounted) return;
      setIsLoading(true);
      setError(null);

      try {
        const balance = await provider.getBalance(address);
        if (!mounted) return;
        setBalance(balance);
      } catch (error: any) {
        if (!mounted) return;
        console.error('Error fetching balance:', error);
        setError(error?.message || 'Failed to fetch balance');
        setBalance(ethers.BigNumber.from(0));
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchBalance();
    intervalId = setInterval(fetchBalance, 10000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [provider, address]);

  return { balance, isLoading, error };
}
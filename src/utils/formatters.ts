import { ethers } from 'ethers';

export const formatAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatBNB = (amount: ethers.BigNumber | string): string => {
  const value = typeof amount === 'string' ? amount : amount.toString();
  return Number(ethers.utils.formatEther(value)).toLocaleString(undefined, {
    maximumFractionDigits: 6
  });
};

export const parseAmount = (amount: string): ethers.BigNumber => {
  return ethers.utils.parseEther(amount);
};
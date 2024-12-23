import { ethers } from 'ethers';

const TOKEN_PRICE_RATIO = 3500; // 3500 SRA = 1 BNB

export const calculateTokenAmount = (bnbAmount: string): string => {
  if (!bnbAmount || isNaN(Number(bnbAmount))) return '0';
  return (Number(bnbAmount) * TOKEN_PRICE_RATIO).toLocaleString();
};

export const formatTokenPrice = (): string => {
  return `${TOKEN_PRICE_RATIO.toLocaleString()} SRA = 1 BNB`;
};
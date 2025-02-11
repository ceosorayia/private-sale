import { ethers } from 'ethers';

let currentTokensPerBNB = 3500; // Valeur par défaut

export const setTokensPerBNB = (value: string) => {
  const numValue = Number(value);
  if (!isNaN(numValue)) {
    currentTokensPerBNB = numValue;
  }
};

export const calculateTokenAmount = (bnbAmount: string): string => {
  if (!bnbAmount || isNaN(Number(bnbAmount))) return '0';
  return (Number(bnbAmount) * currentTokensPerBNB).toLocaleString();
};

export const formatTokenPrice = (): string => {
  return `${currentTokensPerBNB.toLocaleString()} SRA = 1 BNB`;
};
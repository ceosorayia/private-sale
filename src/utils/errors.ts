export const getErrorMessage = (error: any): string => {
  // Vérifier les erreurs de fonds insuffisants
  if (error?.data?.message?.includes('insufficient funds') || 
      error?.message?.includes('insufficient funds')) {
    return 'Insufficient BNB balance for this transaction';
  }

  // Vérifier les erreurs de rejet de transaction
  if (error?.code === 4001 || error?.message?.includes('user rejected')) {
    return 'Transaction rejected by user';
  }

  // Vérifier les erreurs de gas
  if (error?.message?.includes('gas') || error?.data?.message?.includes('gas')) {
    return 'Gas estimation failed. Your transaction might fail or the network is congested';
  }

  // Vérifier les erreurs de réseau
  if (error?.message?.includes('network') || error?.code === 'NETWORK_ERROR') {
    return 'Network error. Please check your connection and try again';
  }

  // Erreurs spécifiques au contrat
  if (error?.reason) {
    return error.reason;
  }

  // Erreurs avec message détaillé
  if (error?.data?.message) {
    return error.data.message;
  }

  // Message d'erreur simple
  if (error?.message && typeof error.message === 'string') {
    return error.message;
  }

  // Message par défaut
  return 'An error occurred during the transaction. Please try again';
};
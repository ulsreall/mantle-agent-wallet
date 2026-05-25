import { useState, useEffect, useCallback } from 'react';

interface WalletState {
  address: string | null;
  balance: string | null;
  chainId: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

const MANTLE_CHAIN_ID = '0x1388'; // 5000 in hex

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    balance: null,
    chainId: null,
    isConnected: false,
    isConnecting: false,
    error: null,
  });

  const getBalance = useCallback(async (address: string) => {
    try {
      const balanceHex = await (window as any).ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      });
      const balanceWei = parseInt(balanceHex, 16);
      return (balanceWei / 1e18).toFixed(4);
    } catch {
      return '0.0000';
    }
  }, []);

  const updateState = useCallback(async (accounts: string[]) => {
    if (accounts.length === 0) {
      setState({
        address: null,
        balance: null,
        chainId: null,
        isConnected: false,
        isConnecting: false,
        error: null,
      });
      return;
    }

    const address = accounts[0];
    const chainId = await (window as any).ethereum.request({ method: 'eth_chainId' });
    const balance = await getBalance(address);

    setState({
      address,
      balance,
      chainId,
      isConnected: true,
      isConnecting: false,
      error: null,
    });
  }, [getBalance]);

  const connect = useCallback(async () => {
    if (!(window as any).ethereum) {
      setState(prev => ({
        ...prev,
        error: 'No wallet detected. Please install MetaMask.',
        isConnecting: false,
      }));
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const accounts = await (window as any).ethereum.request({
        method: 'eth_requestAccounts',
      });
      await updateState(accounts);
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: err?.message || 'Failed to connect wallet',
      }));
    }
  }, [updateState]);

  const disconnect = useCallback(() => {
    setState({
      address: null,
      balance: null,
      chainId: null,
      isConnected: false,
      isConnecting: false,
      error: null,
    });
  }, []);

  const switchToMantle = useCallback(async () => {
    try {
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: MANTLE_CHAIN_ID }],
      });
    } catch (switchError: any) {
      // Chain not added, try to add it
      if (switchError?.code === 4902) {
        await (window as any).ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: MANTLE_CHAIN_ID,
              chainName: 'Mantle Mainnet',
              nativeCurrency: { name: 'MNT', symbol: 'MNT', decimals: 18 },
              rpcUrls: ['https://rpc.mantle.xyz'],
              blockExplorerUrls: ['https://mantlescan.xyz'],
            },
          ],
        });
      }
    }
  }, []);

  // Auto-connect if already authorized
  useEffect(() => {
    const eth = (window as any).ethereum;
    if (!eth) return;

    eth.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
      if (accounts.length > 0) {
        updateState(accounts);
      }
    }).catch(() => {});
  }, [updateState]);

  // Listen for account / chain changes
  useEffect(() => {
    const eth = (window as any).ethereum;
    if (!eth) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        updateState(accounts);
      }
    };

    const handleChainChanged = () => {
      // Re-fetch everything on chain change
      eth.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
        if (accounts.length > 0) updateState(accounts);
      });
    };

    eth.on('accountsChanged', handleAccountsChanged);
    eth.on('chainChanged', handleChainChanged);

    return () => {
      eth.removeListener('accountsChanged', handleAccountsChanged);
      eth.removeListener('chainChanged', handleChainChanged);
    };
  }, [updateState, disconnect]);

  const truncateAddress = useCallback((addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    switchToMantle,
    truncateAddress,
    isMantleNetwork: state.chainId === MANTLE_CHAIN_ID,
  };
}

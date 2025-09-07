import { 
  ContractHelpers, 
  ContractError, 
  ADDRESSES,
  getIDOContract,
  getPAUDollarContract,
  getTruthTokenContract
} from '@/lib/contracts';
import { ethers } from 'ethers';

// Mock ethers
jest.mock('ethers', () => ({
  formatUnits: jest.fn(),
  parseUnits: jest.fn(),
  Contract: jest.fn(),
}));

describe('ContractHelpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('formatTokenAmount', () => {
    it('should format token amount correctly', () => {
      (ethers.formatUnits as jest.Mock).mockReturnValue('1.5');
      
      const result = ContractHelpers.formatTokenAmount('1500000000000000000', 18);
      
      expect(ethers.formatUnits).toHaveBeenCalledWith('1500000000000000000', 18);
      expect(result).toBe('1.5');
    });

    it('should use default decimals of 18', () => {
      (ethers.formatUnits as jest.Mock).mockReturnValue('1.0');
      
      ContractHelpers.formatTokenAmount('1000000000000000000');
      
      expect(ethers.formatUnits).toHaveBeenCalledWith('1000000000000000000', 18);
    });
  });

  describe('parseTokenAmount', () => {
    it('should parse token amount correctly', () => {
      const mockBigInt = BigInt('1500000000000000000');
      (ethers.parseUnits as jest.Mock).mockReturnValue(mockBigInt);
      
      const result = ContractHelpers.parseTokenAmount('1.5', 18);
      
      expect(ethers.parseUnits).toHaveBeenCalledWith('1.5', 18);
      expect(result).toBe(mockBigInt);
    });

    it('should use default decimals of 18', () => {
      const mockBigInt = BigInt('1000000000000000000');
      (ethers.parseUnits as jest.Mock).mockReturnValue(mockBigInt);
      
      ContractHelpers.parseTokenAmount('1.0');
      
      expect(ethers.parseUnits).toHaveBeenCalledWith('1.0', 18);
    });
  });

  describe('formatAddress', () => {
    it('should format address correctly with default length', () => {
      const address = '0x1234567890123456789012345678901234567890';
      const result = ContractHelpers.formatAddress(address);
      
      expect(result).toBe('0x1234...7890');
    });

    it('should format address with custom length', () => {
      const address = '0x1234567890123456789012345678901234567890';
      const result = ContractHelpers.formatAddress(address, 6);
      
      expect(result).toBe('0x1234...567890');
    });

    it('should return original address if too short', () => {
      const shortAddress = '0x1234';
      const result = ContractHelpers.formatAddress(shortAddress);
      
      expect(result).toBe('0x1234');
    });
  });

  describe('getGasEstimate', () => {
    it('should return gas estimate from contract', async () => {
      const mockContract = {
        testMethod: {
          estimateGas: jest.fn().mockResolvedValue(BigInt('150000'))
        }
      };
      
      const result = await ContractHelpers.getGasEstimate(
        mockContract as any, 
        'testMethod', 
        ['arg1'], 
        {}
      );
      
      expect(mockContract.testMethod.estimateGas).toHaveBeenCalledWith('arg1', {});
      expect(result).toBe(BigInt('150000'));
    });

    it('should return default gas limit on estimation failure', async () => {
      const mockContract = {
        testMethod: {
          estimateGas: jest.fn().mockRejectedValue(new Error('Estimation failed'))
        }
      };
      
      const result = await ContractHelpers.getGasEstimate(
        mockContract as any, 
        'testMethod'
      );
      
      expect(result).toBe(ethers.parseUnits('500000', 'wei'));
    });
  });

  describe('waitForTransaction', () => {
    it('should wait for transaction confirmation', async () => {
      const mockReceipt = { status: 1, hash: '0xabcd' };
      const mockTx = {
        wait: jest.fn().mockResolvedValue(mockReceipt)
      };
      
      const result = await ContractHelpers.waitForTransaction(mockTx as any, 2);
      
      expect(mockTx.wait).toHaveBeenCalledWith(2);
      expect(result).toBe(mockReceipt);
    });

    it('should use default confirmation count of 1', async () => {
      const mockReceipt = { status: 1, hash: '0xabcd' };
      const mockTx = {
        wait: jest.fn().mockResolvedValue(mockReceipt)
      };
      
      await ContractHelpers.waitForTransaction(mockTx as any);
      
      expect(mockTx.wait).toHaveBeenCalledWith(1);
    });

    it('should throw error if receipt is null', async () => {
      const mockTx = {
        wait: jest.fn().mockResolvedValue(null)
      };
      
      await expect(
        ContractHelpers.waitForTransaction(mockTx as any)
      ).rejects.toThrow('Transaction receipt is null');
    });
  });
});

describe('ContractError', () => {
  it('should create ContractError with message', () => {
    const error = new ContractError('Test error');
    
    expect(error.message).toBe('Test error');
    expect(error.name).toBe('ContractError');
    expect(error.code).toBeUndefined();
  });

  it('should create ContractError with code and transaction', () => {
    const mockTx = { hash: '0x1234' };
    const error = new ContractError('Test error', 'USER_REJECTED', mockTx as any);
    
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('USER_REJECTED');
    expect(error.transaction).toBe(mockTx);
  });

  describe('fromError', () => {
    it('should handle CALL_EXCEPTION error', () => {
      const originalError = {
        code: 'CALL_EXCEPTION',
        reason: 'execution reverted'
      };
      
      const contractError = ContractError.fromError(originalError);
      
      expect(contractError.message).toBe('Contract call failed: execution reverted');
      expect(contractError.code).toBe('CALL_EXCEPTION');
    });

    it('should handle INSUFFICIENT_FUNDS error', () => {
      const originalError = {
        code: 'INSUFFICIENT_FUNDS',
        message: 'insufficient funds'
      };
      
      const contractError = ContractError.fromError(originalError);
      
      expect(contractError.message).toBe('Insufficient funds for transaction');
      expect(contractError.code).toBe('INSUFFICIENT_FUNDS');
    });

    it('should handle USER_REJECTED error', () => {
      const originalError = {
        code: 'USER_REJECTED',
        message: 'user rejected transaction'
      };
      
      const contractError = ContractError.fromError(originalError);
      
      expect(contractError.message).toBe('Transaction rejected by user');
      expect(contractError.code).toBe('USER_REJECTED');
    });

    it('should handle NETWORK_ERROR', () => {
      const originalError = {
        code: 'NETWORK_ERROR',
        message: 'network is down'
      };
      
      const contractError = ContractError.fromError(originalError);
      
      expect(contractError.message).toBe('Network error: network is down');
      expect(contractError.code).toBe('NETWORK_ERROR');
    });

    it('should handle unknown errors', () => {
      const originalError = {
        message: 'unknown error'
      };
      
      const contractError = ContractError.fromError(originalError);
      
      expect(contractError.message).toBe('unknown error');
    });

    it('should handle errors without message', () => {
      const originalError = {};
      
      const contractError = ContractError.fromError(originalError);
      
      expect(contractError.message).toBe('Unknown contract error');
    });
  });
});

describe('Contract Factory Functions', () => {
  const mockProvider = {} as any;
  const mockSigner = {} as any;

  beforeEach(() => {
    (ethers.Contract as jest.Mock).mockClear();
  });

  it('should create IDO contract with correct parameters', () => {
    getIDOContract(mockProvider);
    
    expect(ethers.Contract).toHaveBeenCalledWith(
      ADDRESSES.IDOContract,
      expect.any(Array), // IDOContractABI
      mockProvider
    );
  });

  it('should create PAU Dollar contract with correct parameters', () => {
    getPAUDollarContract(mockSigner);
    
    expect(ethers.Contract).toHaveBeenCalledWith(
      ADDRESSES.PAUDollar,
      expect.any(Array), // PAUDollarABI
      mockSigner
    );
  });

  it('should create TRUTH Token contract with correct parameters', () => {
    getTruthTokenContract(mockProvider);
    
    expect(ethers.Contract).toHaveBeenCalledWith(
      ADDRESSES.TruthToken,
      expect.any(Array), // TruthTokenABI
      mockProvider
    );
  });
});

describe('ADDRESSES', () => {
  it('should have correct PAU Dollar address', () => {
    expect(ADDRESSES.PAUDollar).toBe('0xDd7639e3920426de6c59A1009C7ce2A9802d0920');
  });

  it('should have placeholder addresses for other contracts', () => {
    expect(ADDRESSES.TruthToken).toBe('0x0000000000000000000000000000000000000000');
    expect(ADDRESSES.IDOContract).toBe('0x0000000000000000000000000000000000000000');
    expect(ADDRESSES.VestingContract).toBe('0x0000000000000000000000000000000000000000');
  });
});
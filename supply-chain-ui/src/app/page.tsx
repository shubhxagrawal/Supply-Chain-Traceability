'use client'; // This is required for Next.js 13+ to mark a component as a Client Component

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// --- IMPORTANT ---
// 1. PASTE YOUR DEPLOYED CONTRACT ADDRESS HERE
const contractAddress = "0x60e53c68d935F10294Ab75b72c7a1eF4c825fc47";

// 2. PASTE YOUR CONTRACT'S ABI HERE
const contractABI = [
  // Paste the ABI array you copied from SupplyChain.json


  
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "itemId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "enum SupplyChain.State",
          "name": "newState",
          "type": "uint8"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "actor",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "name": "ItemStateChanged",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_itemId",
          "type": "uint256"
        }
      ],
      "name": "getItemHistory",
      "outputs": [
        {
          "components": [
            {
              "internalType": "enum SupplyChain.State",
              "name": "state",
              "type": "uint8"
            },
            {
              "internalType": "address",
              "name": "actor",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "timestamp",
              "type": "uint256"
            }
          ],
          "internalType": "struct SupplyChain.TrackingRecord[]",
          "name": "",
          "type": "tuple[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_name",
          "type": "string"
        }
      ],
      "name": "itemHarvested",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_itemId",
          "type": "uint256"
        }
      ],
      "name": "itemProcessed",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_itemId",
          "type": "uint256"
        }
      ],
      "name": "itemReceived",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_itemId",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "_newOwner",
          "type": "address"
        }
      ],
      "name": "itemShipped",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "items",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "internalType": "enum SupplyChain.State",
          "name": "currentState",
          "type": "uint8"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  
  
];
// --- --- --- ---

// Helper to map enum state to string
const stateEnum = ["Harvested", "Processed", "Shipped", "Received"];


export default function Home() {
  const [account, setAccount] = useState<string>('');
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);

  const [newItemName, setNewItemName] = useState<string>('');
  const [queryId, setQueryId] = useState<string>('');
  const [shipRecipient, setShipRecipient] = useState<string>('');
  
  const [itemDetails, setItemDetails] = useState<any>(null);
  const [itemHistory, setItemHistory] = useState<any[]>([]);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await web3Provider.getSigner();
        const userAddress = await signer.getAddress();
        
        setProvider(web3Provider);
        setAccount(userAddress);
        
        const supplyChainContract = new ethers.Contract(contractAddress, contractABI, signer);
        setContract(supplyChainContract);

      } catch (err: any) {
        setError('Failed to connect wallet. ' + (err.message || ''));
      }
    } else {
      setError('Please install MetaMask!');
    }
  };
  
  const getItemDetails = async () => {
    if (!contract || !queryId) return;
    setLoading(true);
    setError('');
    setItemDetails(null);
    setItemHistory([]);
    try {
      const details = await contract.items(queryId);
      if (details.id.toString() === "0") {
        setError("Item not found.");
      } else {
        setItemDetails(details);
        const history = await contract.getItemHistory(queryId);
        setItemHistory(history);
      }
    } catch (err: any) {
      setError('Error fetching item details: ' + (err.reason || err.message));
    }
    setLoading(false);
  };

  const handleTransaction = async (txFunction: Promise<ethers.ContractTransactionResponse>, successMessage: string) => {
    setLoading(true);
    setError('');
    try {
        const tx = await txFunction;
        await tx.wait(); // Wait for the transaction to be mined
        alert(successMessage);
        // Refresh item details after a successful transaction
        if(queryId) await getItemDetails();
    } catch (err: any) {
        setError('Transaction failed: ' + (err.reason || err.message));
    }
    setLoading(false);
  };

  const harvestItem = () => {
    if (!contract || !newItemName) return;
    handleTransaction(
        contract.itemHarvested(newItemName),
        'Item successfully harvested!'
    );
  };
  
  const processItem = () => {
    if (!contract || !queryId) return;
    handleTransaction(
        contract.itemProcessed(queryId),
        'Item successfully processed!'
    );
  };

  const shipItem = () => {
    if (!contract || !queryId || !shipRecipient) return;
    if (!ethers.isAddress(shipRecipient)) {
      setError("Invalid recipient address.");
      return;
    }
    handleTransaction(
        contract.itemShipped(queryId, shipRecipient),
        'Item successfully shipped!'
    );
  };

  const receiveItem = () => {
    if (!contract || !queryId) return;
    handleTransaction(
        contract.itemReceived(queryId),
        'Item successfully received!'
    );
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-12 bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-8">Farm-to-Table dApp</h1>
      
      {account ? (
        <div className="text-center mb-6">
          <p>Connected Account:</p>
          <p className="font-mono bg-gray-700 px-2 py-1 rounded">{account}</p>
        </div>
      ) : (
        <button onClick={connectWallet} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg mb-8">
          Connect Wallet
        </button>
      )}

      {error && <p className="text-red-500 bg-red-100 p-3 rounded-lg my-4">{error}</p>}
      {loading && <p className="text-yellow-400 my-4">Transaction in progress, please wait...</p>}

      {account && (
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Column 1: Actions */}
          <div className="space-y-6 bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold border-b border-gray-600 pb-2">Actions</h2>
            
            {/* Harvest */}
            <div className="space-y-2">
              <h3 className="text-xl">1. Harvest New Item</h3>
              <input
                type="text"
                placeholder="e.g., Organic Coffee Beans"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 border border-gray-600"
              />
              <button onClick={harvestItem} disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500">
                Harvest
              </button>
            </div>
            
            <p className="text-center text-gray-400">- OR -</p>

            {/* Query Item */}
            <div className="space-y-2">
                <h3 className="text-xl">Query & Update Existing Item</h3>
                <input
                    type="text"
                    placeholder="Enter Item ID to update"
                    value={queryId}
                    onChange={(e) => setQueryId(e.target.value)}
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600"
                />
            </div>
            
            {/* Other Actions */}
            <div className="space-y-3">
              <button onClick={processItem} disabled={loading || !queryId} className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500">
                2. Process Item
              </button>
              <div>
                <input
                  type="text"
                  placeholder="Recipient Address for Shipping"
                  value={shipRecipient}
                  onChange={(e) => setShipRecipient(e.target.value)}
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 mb-2"
                />
                <button onClick={shipItem} disabled={loading || !queryId || !shipRecipient} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500">
                  3. Ship Item
                </button>
              </div>
              <button onClick={receiveItem} disabled={loading || !queryId} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500">
                4. Receive Item
              </button>
            </div>
          </div>

          {/* Column 2: Display */}
          <div className="space-y-6 bg-gray-800 p-6 rounded-lg">
              <h2 className="text-2xl font-semibold border-b border-gray-600 pb-2">Item Details</h2>
              <button onClick={getItemDetails} disabled={loading || !queryId} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500">
                Get Details for Item ID: {queryId || '...'}
              </button>
              {itemDetails && (
                <div className="space-y-2 font-mono text-sm">
                  <p><strong>ID:</strong> {itemDetails.id.toString()}</p>
                  <p><strong>Name:</strong> {itemDetails.name}</p>
                  <p><strong>Owner:</strong> {itemDetails.owner}</p>
                  <p><strong>State:</strong> {stateEnum[Number(itemDetails.currentState)]}</p>
                </div>
              )}
              {itemHistory.length > 0 && (
                <div>
                  <h3 className="text-xl mt-4 border-t border-gray-600 pt-4">Traceability History</h3>
                  <ul className="list-decimal list-inside mt-2 space-y-2">
                    {itemHistory.map((record, index) => (
                        <li key={index} className="font-mono text-xs bg-gray-700 p-2 rounded">
                          <p><strong>State:</strong> {stateEnum[Number(record.state)]}</p>
                          <p><strong>Timestamp:</strong> {new Date(Number(record.timestamp) * 1000).toLocaleString()}</p>
                          <p><strong>Actor:</strong> {record.actor}</p>
                        </li>
                    ))}
                  </ul>
                </div>
              )}
          </div>

        </div>
      )}
    </main>
  );
}
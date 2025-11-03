// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SupplyChain
 * @dev A smart contract to track an item's journey from farm to table.
 */
contract SupplyChain {
    // A counter to generate unique item IDs
    uint256 private _itemCounter;

    // Enum to represent the state of an item in the supply chain
    enum State {
        Harvested,
        Processed,
        Shipped,
        Received
    }

    // Struct to store a snapshot of an item's state at a point in time
    struct TrackingRecord {
        State state;
        address actor;
        uint256 timestamp;
    }

    // Struct to represent an item being tracked
    struct Item {
        uint256 id;
        string name;
        address owner;
        State currentState;
        TrackingRecord[] history;
    }

    // Mapping from an item's ID to the Item struct
    mapping(uint256 => Item) public items;

    // Event to be emitted whenever an item's state changes
    event ItemStateChanged(
        uint256 indexed itemId,
        State newState,
        address indexed actor,
        uint256 timestamp
    );

    /**
     * @dev Registers a new item when it is harvested.
     * @param _name The name of the item (e.g., "Batch of Arabica Coffee Beans").
     * @return The unique ID of the newly created item.
     */
    function itemHarvested(string memory _name) public returns (uint256) {
        _itemCounter++;
        uint256 newItemId = _itemCounter;
        
        Item storage newItem = items[newItemId];
        newItem.id = newItemId;
        newItem.name = _name;
        newItem.owner = msg.sender;
        newItem.currentState = State.Harvested;
        
        // Add the first record to its history
        newItem.history.push(TrackingRecord({
            state: State.Harvested,
            actor: msg.sender,
            timestamp: block.timestamp
        }));
        
        emit ItemStateChanged(newItemId, State.Harvested, msg.sender, block.timestamp);
        
        return newItemId;
    }

    /**
     * @dev Updates an item's state to 'Processed'.
     * @param _itemId The ID of the item to update.
     */
    function itemProcessed(uint256 _itemId) public {
        Item storage item = items[_itemId];
        
        require(item.id != 0, "Item does not exist.");
        require(item.owner == msg.sender, "Only the owner can process the item.");
        require(item.currentState == State.Harvested, "Item must be in 'Harvested' state.");
        
        item.currentState = State.Processed;
        item.history.push(TrackingRecord({
            state: State.Processed,
            actor: msg.sender,
            timestamp: block.timestamp
        }));
        
        emit ItemStateChanged(_itemId, State.Processed, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Updates an item's state to 'Shipped' and transfers ownership.
     * @param _itemId The ID of the item to update.
     * @param _newOwner The address of the recipient (e.g., a distributor or retailer).
     */
    function itemShipped(uint256 _itemId, address _newOwner) public {
        Item storage item = items[_itemId];

        require(item.id != 0, "Item does not exist.");
        require(item.owner == msg.sender, "Only the owner can ship the item.");
        require(item.currentState == State.Processed, "Item must be in 'Processed' state.");
        require(_newOwner != address(0), "Invalid new owner address.");
        
        item.currentState = State.Shipped;
        item.owner = _newOwner; // Ownership is transferred
        item.history.push(TrackingRecord({
            state: State.Shipped,
            actor: msg.sender,
            timestamp: block.timestamp
        }));
        
        emit ItemStateChanged(_itemId, State.Shipped, msg.sender, block.timestamp);
    }

    /**
     * @dev Updates an item's state to 'Received'.
     * @param _itemId The ID of the item to update.
     */
    function itemReceived(uint256 _itemId) public {
        Item storage item = items[_itemId];

        require(item.id != 0, "Item does not exist.");
        // Only the new owner (who it was shipped to) can mark it as received.
        require(item.owner == msg.sender, "Only the designated recipient can receive the item."); 
        require(item.currentState == State.Shipped, "Item must be in 'Shipped' state.");
        
        item.currentState = State.Received;
        item.history.push(TrackingRecord({
            state: State.Received,
            actor: msg.sender,
            timestamp: block.timestamp
        }));
        
        emit ItemStateChanged(_itemId, State.Received, msg.sender, block.timestamp);
    }

    /**
     * @dev Fetches the entire history of an item.
     * @param _itemId The ID of the item to query.
     * @return An array of TrackingRecord structs.
     */
    function getItemHistory(uint256 _itemId) public view returns (TrackingRecord[] memory) {
        require(items[_itemId].id != 0, "Item does not exist.");
        return items[_itemId].history;
    }
}
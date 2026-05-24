// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title IERC8004 - Trustless Agents Interface
/// @notice Interface for ERC-8004 Identity Registry
interface IERC8004 {
    /// @notice Register a new agent
    /// @param agentURI URI to the agent's registration file
    /// @return tokenId The assigned token ID
    function register(string calldata agentURI) external returns (uint256 tokenId);

    /// @notice Register a new agent with metadata
    /// @param agentURI URI to the agent's registration file
    /// @param metadata Array of key-value metadata pairs
    /// @return tokenId The assigned token ID
    function register(
        string calldata agentURI,
        string[] calldata metadata
    ) external returns (uint256 tokenId);

    /// @notice Get agent metadata
    /// @param tokenId The agent's token ID
    /// @param key The metadata key
    /// @return value The metadata value
    function getMetadata(uint256 tokenId, string calldata key) external view returns (string memory value);

    /// @notice Set agent metadata
    /// @param tokenId The agent's token ID
    /// @param key The metadata key
    /// @param value The metadata value
    function setMetadata(uint256 tokenId, string calldata key, string calldata value) external;

    /// @notice Get the agent's wallet address
    /// @param tokenId The agent's token ID
    /// @return wallet The agent's wallet address
    function getAgentWallet(uint256 tokenId) external view returns (address wallet);

    /// @notice Get the agent's URI
    /// @param tokenId The agent's token ID
    /// @return uri The agent's URI
    function tokenURI(uint256 tokenId) external view returns (string memory uri);
}

/// @title IERC8004Reputation - Reputation Registry Interface
interface IERC8004Reputation {
    /// @notice Submit feedback for an agent
    /// @param agentId The agent's token ID
    /// @param value The feedback value (fixed-point)
    /// @param valueDecimals Number of decimal places
    /// @param tag1 First tag
    /// @param tag2 Second tag
    /// @param endpoint The endpoint being evaluated
    /// @param feedbackURI URI to detailed feedback
    /// @param feedbackHash Hash of the feedback content
    function giveFeedback(
        uint256 agentId,
        int128 value,
        uint8 valueDecimals,
        string calldata tag1,
        string calldata tag2,
        string calldata endpoint,
        string calldata feedbackURI,
        bytes32 feedbackHash
    ) external;

    /// @notice Get agent's reputation summary
    /// @param agentId The agent's token ID
    /// @return totalFeedback Total feedback count
    /// @return averageScore Average score
    function getSummary(uint256 agentId) external view returns (uint256 totalFeedback, int256 averageScore);
}

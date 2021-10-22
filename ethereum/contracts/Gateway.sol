// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./IStarknetCore.sol";

contract Gateway {
    address public initialEndpointGatewaySetter;
    uint256 public endpointGateway;
    IStarknetCore public starknetCore;
    uint256 constant ENDPOINT_GATEWAY_SELECTOR =
        352040181584456735608515580760888541466059565068553383579463728554843487745;

    // Bootstrap
    constructor(address _starknetCore) {
        require(
            _starknetCore != address(0),
            "Gateway/invalid-starknet-core-address"
        );

        starknetCore = IStarknetCore(_starknetCore);
        initialEndpointGatewaySetter = msg.sender;
    }

    function setEndpointGateway(address _endpointGateway) external {
        require(
            msg.sender == initialEndpointGatewaySetter,
            "Gateway/unauthorized"
        );
        require(endpointGateway == 0, "Gateway/endpoint-gateway-already-set");
        endpointGateway = addressToUint(_endpointGateway);
    }

    // Utils
    function addressToUint(address value)
        internal
        pure
        returns (uint256 convertedValue)
    {
        convertedValue = uint256(uint160(address(value)));
    }

    // Bridging to Starknet
    function warpToStarknet(
        IERC721 _tokenContract,
        uint256[] calldata _tokenIds
    ) external {
        uint256[] memory payload = new uint256[](3);
        for (uint256 tokenIdx = 0; tokenIdx < _tokenIds.length; ++tokenIdx) {
            require(
                _tokenContract.ownerOf(_tokenIds[tokenIdx]) == msg.sender,
                "Gateway/caller-is-not-owner"
            );
            _tokenContract.transferFrom(
                msg.sender,
                address(this),
                _tokenIds[tokenIdx]
            );

            payload[0] = addressToUint(msg.sender);
            payload[1] = addressToUint(address(_tokenContract));
            payload[2] = _tokenIds[tokenIdx];

            starknetCore.sendMessageToL2(
                endpointGateway,
                ENDPOINT_GATEWAY_SELECTOR,
                payload
            );
        }
    }

    // Bridging back from Starknet
    function warpFromStarknet(
        IERC721 _tokenContract,
        uint256[] calldata _tokenIds
    ) external {
        uint256[] memory payload = new uint256[](3);

        for (uint256 tokenIdx = 0; tokenIdx < _tokenIds.length; ++tokenIdx) {
            require(
                _tokenContract.ownerOf(_tokenIds[tokenIdx]) == address(this),
                "Gateway/gateway-is-not-owner"
            );

            payload[0] = addressToUint(msg.sender);
            payload[1] = addressToUint(address(_tokenContract));
            payload[2] = _tokenIds[tokenIdx];

            starknetCore.consumeMessageFromL2(endpointGateway, payload);

            _tokenContract.transferFrom(
                address(this),
                msg.sender,
                _tokenIds[tokenIdx]
            );
        }
    }
}

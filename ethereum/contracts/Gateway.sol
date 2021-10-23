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
        IERC721 _l1TokenContract,
        address _l2TokenContract,
        uint256 _tokenId
    ) external {
        uint256[] memory payload = new uint256[](4);
            require(
                _l1TokenContract.ownerOf(_tokenId) == msg.sender,
                "Gateway/caller-is-not-owner"
            );
            _l1TokenContract.transferFrom(
                msg.sender,
                address(this),
                _tokenId
            );

            payload[0] = addressToUint(msg.sender);
            payload[1] = addressToUint(address(_l1TokenContract));
            payload[2] = addressToUint(address(_l2TokenContract));
            payload[3] = _tokenId;

            starknetCore.sendMessageToL2(
                endpointGateway,
                ENDPOINT_GATEWAY_SELECTOR,
                payload
            );
    }

    // Bridging back from Starknet
    function warpFromStarknet(
        IERC721 _l1TokenContract,
        address _l2TokenContract,
        uint256 _tokenId
    ) external {
        uint256[] memory payload = new uint256[](4);

            require(
                _l1TokenContract.ownerOf(_tokenId) == address(this),
                "Gateway/gateway-is-not-owner"
            );

            payload[0] = addressToUint(msg.sender);
            payload[1] = addressToUint(address(_l1TokenContract));
            payload[2] = addressToUint(address(_l2TokenContract));
            payload[3] = _tokenId;

            starknetCore.consumeMessageFromL2(endpointGateway, payload);

            _l1TokenContract.transferFrom(
                address(this),
                msg.sender,
                _tokenId
            );
    }
}

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
    uint256 constant WARP_MODE_DEPOSIT = 0;
    uint256 constant WARP_MODE_WITHDRAW = 1;

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
        uint256[] memory payload = new uint256[](5);

        // optimistic transfer, should revert if no approved or not owner
        _l1TokenContract.transferFrom(msg.sender, address(this), _tokenId);

        // build deposit message payload
        payload[0] = WARP_MODE_DEPOSIT;
        payload[1] = addressToUint(msg.sender);
        payload[2] = addressToUint(address(_l1TokenContract));
        payload[3] = addressToUint(address(_l2TokenContract));
        payload[4] = _tokenId;

        // send message
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
        uint256[] memory payload = new uint256[](5);

        // build withdraw message payload
        payload[0] = WARP_MODE_WITHDRAW;
        payload[1] = addressToUint(msg.sender);
        payload[2] = addressToUint(address(_l1TokenContract));
        payload[3] = addressToUint(address(_l2TokenContract));
        payload[4] = _tokenId;

        // consum withdraw message
        starknetCore.consumeMessageFromL2(endpointGateway, payload);

        // optimistic transfer, should revert if gateway is not token owner
        _l1TokenContract.transferFrom(address(this), msg.sender, _tokenId);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract FakeErc721 is ERC721Enumerable {
    constructor() ERC721("Fake ERC721", "FERC721") {}

    function mint(address _to, uint256 _amount) external {
        uint256 currentTotalSupply = totalSupply();
        for (uint256 tokenIdx = 0; tokenIdx < _amount; ++tokenIdx) {
            _mint(_to, currentTotalSupply + tokenIdx);
        }
    }
}

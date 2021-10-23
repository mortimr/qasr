# Declare this file as a StarkNet contract and set the required
# builtins.
%lang starknet
%builtins pedersen range_check

from starkware.cairo.common.cairo_builtins import HashBuiltin
from starkware.starknet.common.storage import Storage
from starkware.cairo.common.alloc import alloc
from starkware.starknet.common.messages import send_message_to_l1
from starkware.starknet.common.syscalls import get_caller_address
from starkware.cairo.common.math_cmp import is_not_zero

const WARP_MODE_WITHDRAW = 1

@contract_interface
namespace IWarpedERC721:
    func createToken(owner : felt, tokenId : felt):
    end

    func deleteToken(tokenId : felt):
    end

    func ownerOf(tokenId: felt) -> (owner : felt):
    end
end

# construction guard
@storage_var
func initialized() -> (res : felt):
end

# l1 gateway address
@storage_var
func l1Gateway() -> (res : felt):
end

# keep track of the minted ERC721
@storage_var
func custody(l1TokenAddress : felt, tokenId : felt) -> (res: felt):
end

# keep track of deposit messages, before minting
@storage_var
func mintCredits(l1TokenAddress : felt, tokenId : felt, owner : felt) -> (res: felt):
end

# constructor
@external
func initialize{storage_ptr : Storage*, pedersen_ptr : HashBuiltin*, range_check_ptr}(_l1Gateway : felt):
    let (isInitialized) = initialized.read()
    assert isInitialized = 0

    l1Gateway.write(_l1Gateway)

    initialized.write(1)
    return ()
end

# receive and handle deposit messages
@l1_handler
func warpFromMainnet{syscall_ptr: felt*, storage_ptr: Storage*, pedersen_ptr: HashBuiltin*, range_check_ptr}(from_address : felt, _owner : felt, _l1TokenAddress : felt, _l2TokenAddress : felt, _tokenId : felt):

    let (res) = l1Gateway.read()
    assert from_address = res

    let (currentCustody) = custody.read(l1TokenAddress=_l1TokenAddress, tokenId=_tokenId)
    assert currentCustody = 0
    
    mintCredits.write(l1TokenAddress=_l1TokenAddress, tokenId=_tokenId, owner=_owner, value=_l2TokenAddress)

    return ()
end

# tries to consume mint credit
@external
func consumeMintCredit{syscall_ptr: felt*, storage_ptr: Storage*, pedersen_ptr: HashBuiltin*, range_check_ptr}(_l1TokenAddress : felt, _l2TokenAddress : felt, _tokenId : felt):
    let (caller_address) = get_caller_address()
    let (l2TokenAddress) = mintCredits.read(l1TokenAddress=_l1TokenAddress, tokenId=_tokenId, owner=caller_address)
    let (mintCreditAvailable) = is_not_zero(l2TokenAddress)

    assert mintCreditAvailable = 1

    IWarpedERC721.createToken(contract_address=_l2TokenAddress, owner=caller_address, tokenId=_tokenId)
    custody.write(l1TokenAddress=_l1TokenAddress, tokenId=_tokenId, value=_l2TokenAddress)
    mintCredits.write(l1TokenAddress=_l1TokenAddress, tokenId=_tokenId, owner=caller_address, value=0)

    return ()
end

# revoke mint credit if consuming is failing
@external
func revokeMintCredit{syscall_ptr: felt*, storage_ptr: Storage*, pedersen_ptr: HashBuiltin*, range_check_ptr}(_l1TokenAddress : felt, _l2TokenAddress : felt, _tokenId : felt):

    let (caller_address) = get_caller_address()
    let (l2TokenAddress) = mintCredits.read(l1TokenAddress=_l1TokenAddress, tokenId=_tokenId, owner=caller_address)
    let (mintCreditAvailable) = is_not_zero(l2TokenAddress)

    assert mintCreditAvailable = 1

    let (l1GatewayAddress) = l1Gateway.read()

    let (message_payload : felt*) = alloc()
    assert message_payload[0] = WARP_MODE_WITHDRAW
    assert message_payload[1] = caller_address
    assert message_payload[2] = _l1TokenAddress
    assert message_payload[3] = l2TokenAddress
    assert message_payload[4] = _tokenId

    send_message_to_l1(
        to_address=l1GatewayAddress,
        payload_size=5,
        payload=message_payload)

    mintCredits.write(l1TokenAddress=_l1TokenAddress, tokenId=_tokenId, owner=caller_address, value=0)

    return ()
end

# burns the L2 ERC721 and sends withdrawal message
@external
func warpToMainnet{syscall_ptr: felt*, storage_ptr: Storage*, pedersen_ptr: HashBuiltin*, range_check_ptr}(_l1TokenAddress : felt, _tokenId : felt):

    let (caller_address) = get_caller_address()
    let (l2TokenAddress) = custody.read(l1TokenAddress=_l1TokenAddress, tokenId=_tokenId)
    let (owner) = IWarpedERC721.ownerOf(contract_address=l2TokenAddress, tokenId=_tokenId)
    assert caller_address = owner

    let (l1GatewayAddress) = l1Gateway.read()

    IWarpedERC721.deleteToken(contract_address=l2TokenAddress, tokenId=_tokenId)

    let (message_payload : felt*) = alloc()
    assert message_payload[0] = WARP_MODE_WITHDRAW
    assert message_payload[1] = owner
    assert message_payload[2] = _l1TokenAddress
    assert message_payload[3] = l2TokenAddress
    assert message_payload[4] = _tokenId

    send_message_to_l1(
        to_address=l1GatewayAddress,
        payload_size=5,
        payload=message_payload)

    custody.write(l1TokenAddress=_l1TokenAddress, tokenId=_tokenId, value=0)

    return ()
end

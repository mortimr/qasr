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
    func create_token(owner : felt, token_id : felt):
    end

    func delete_token(token_id : felt):
    end

    func owner_of(token_id : felt) -> (owner : felt):
    end

    func get_l1_address() -> (address : felt):
    end
end

# construction guard
@storage_var
func initialized() -> (res : felt):
end

# l1 gateway address
@storage_var
func l1_gateway() -> (res : felt):
end

# keep track of the minted ERC721
@storage_var
func custody(l1_token_address : felt, token_id : felt) -> (res : felt):
end

# keep track of deposit messages, before minting
@storage_var
func mint_credits(l1_token_address : felt, token_id : felt, owner : felt) -> (res : felt):
end

# constructor
@external
func initialize{storage_ptr : Storage*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
        _l1_gateway : felt):
    let (is_initialized) = initialized.read()
    assert is_initialized = 0

    l1_gateway.write(_l1_gateway)

    initialized.write(1)
    return ()
end

# receive and handle deposit messages
@l1_handler
func warp_from_mainnet{
        syscall_ptr : felt*, storage_ptr : Storage*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
        from_address : felt, _owner : felt, _l1_token_address : felt, _l2_token_address : felt,
        _token_id : felt):
    let (res) = l1_gateway.read()
    assert from_address = res

    let (currentCustody) = custody.read(l1_token_address=_l1_token_address, token_id=_token_id)
    assert currentCustody = 0

    mint_credits.write(
        l1_token_address=_l1_token_address,
        token_id=_token_id,
        owner=_owner,
        value=_l2_token_address)

    return ()
end

# tries to consume mint credit
@external
func consume_mint_credit{
        syscall_ptr : felt*, storage_ptr : Storage*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
        _l1_token_address : felt, _l2_token_address : felt, _token_id : felt):
    let (caller_address) = get_caller_address()
    let (l2_token_address) = mint_credits.read(
        l1_token_address=_l1_token_address, token_id=_token_id, owner=caller_address)
    let (mintCreditAvailable) = is_not_zero(l2_token_address)

    assert mintCreditAvailable = 1

    IWarpedERC721.create_token(
        contract_address=_l2_token_address, owner=caller_address, token_id=_token_id)
    custody.write(l1_token_address=_l1_token_address, token_id=_token_id, value=_l2_token_address)
    mint_credits.write(
        l1_token_address=_l1_token_address, token_id=_token_id, owner=caller_address, value=0)

    return ()
end

# revoke mint credit if consuming is failing
@external
func revoke_mint_credit{
        syscall_ptr : felt*, storage_ptr : Storage*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
        _l1_token_address : felt, _l2_token_address : felt, _token_id : felt):
    let (caller_address) = get_caller_address()
    let (l2_token_address) = mint_credits.read(
        l1_token_address=_l1_token_address, token_id=_token_id, owner=caller_address)
    let (mintCreditAvailable) = is_not_zero(l2_token_address)

    assert mintCreditAvailable = 1

    let (l1_gateway_address) = l1_gateway.read()

    let (message_payload : felt*) = alloc()
    assert message_payload[0] = WARP_MODE_WITHDRAW
    assert message_payload[1] = caller_address
    assert message_payload[2] = _l1_token_address
    assert message_payload[3] = l2_token_address
    assert message_payload[4] = _token_id

    send_message_to_l1(to_address=l1_gateway_address, payload_size=5, payload=message_payload)

    mint_credits.write(
        l1_token_address=_l1_token_address, token_id=_token_id, owner=caller_address, value=0)

    return ()
end

# burns the L2 ERC721 and sends withdrawal message
@external
func warp_to_mainnet{
        syscall_ptr : felt*, storage_ptr : Storage*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
        _l1_token_address : felt, _token_id : felt):
    let (caller_address) = get_caller_address()
    let (l2_token_address) = custody.read(l1_token_address=_l1_token_address, token_id=_token_id)
    let (owner) = IWarpedERC721.owner_of(contract_address=l2_token_address, token_id=_token_id)
    assert caller_address = owner

    let (l1_gateway_address) = l1_gateway.read()

    IWarpedERC721.delete_token(contract_address=l2_token_address, token_id=_token_id)

    let (message_payload : felt*) = alloc()
    assert message_payload[0] = WARP_MODE_WITHDRAW
    assert message_payload[1] = owner
    assert message_payload[2] = _l1_token_address
    assert message_payload[3] = l2_token_address
    assert message_payload[4] = _token_id

    send_message_to_l1(to_address=l1_gateway_address, payload_size=5, payload=message_payload)

    custody.write(l1_token_address=_l1_token_address, token_id=_token_id, value=0)

    return ()
end

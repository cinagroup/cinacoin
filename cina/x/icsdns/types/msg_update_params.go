package types

import (
	sdk "github.com/cosmos/cosmos-sdk/types"
)

// MsgUpdateParams defines a message for updating params
type MsgUpdateParams struct {
	Authority string `json:"authority,omitempty"`
	Params    Params `json:"params,omitempty"`
}

// Route implements Msg
func (msg MsgUpdateParams) Route() string { return ModuleName }

// Type implements Msg
func (msg MsgUpdateParams) Type() string { return "update_params" }

// ValidateBasic implements Msg
func (msg MsgUpdateParams) ValidateBasic() error {
	_, err := sdk.AccAddressFromBech32(msg.Authority)
	return err
}

// GetSignBytes implements Msg
func (msg MsgUpdateParams) GetSignBytes() []byte {
	return sdk.MustSortJSON([]byte(`{"authority":"` + msg.Authority + `"}`))
}

// GetSigners implements Msg
func (msg MsgUpdateParams) GetSigners() []sdk.AccAddress {
	addr, _ := sdk.AccAddressFromBech32(msg.Authority)
	return []sdk.AccAddress{addr}
}

// ProtoMessage implements proto.Message
func (msg *MsgUpdateParams) ProtoMessage() {}

// Reset implements proto.Message
func (msg *MsgUpdateParams) Reset() { *msg = MsgUpdateParams{} }

// String implements proto.Message
func (msg *MsgUpdateParams) String() string { return "" }

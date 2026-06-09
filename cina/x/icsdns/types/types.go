package types

import "context"

// GenesisState defines the module's genesis state
type GenesisState struct {
	Params Params `json:"params" yaml:"params"`
}

// ProtoMessage implements proto.Message
func (g *GenesisState) ProtoMessage() {}

// Reset implements proto.Message
func (g *GenesisState) Reset() { *g = GenesisState{} }

// String implements proto.Message
func (g *GenesisState) String() string { return "" }

// Params defines the parameters for the module
type Params struct {
}

// ProtoMessage implements proto.Message
func (p *Params) ProtoMessage() {}

// Reset implements proto.Message
func (p *Params) Reset() { *p = Params{} }

// String implements proto.Message
func (p *Params) String() string { return "" }

// MsgUpdateParamsResponse defines the response for updating params
type MsgUpdateParamsResponse struct{}

// QueryParamsRequest is request type for the Query/Params RPC method
type QueryParamsRequest struct{}

// QueryParamsResponse is response type for the Query/Params RPC method
type QueryParamsResponse struct {
	Params Params `json:"params" yaml:"params"`
}

// QueryServer is the server API for Query service
type QueryServer interface {
	Params(context.Context, *QueryParamsRequest) (*QueryParamsResponse, error)
}

// MsgServer is the server API for Msg service
type MsgServer interface {
	UpdateParams(context.Context, *MsgUpdateParams) (*MsgUpdateParamsResponse, error)
}

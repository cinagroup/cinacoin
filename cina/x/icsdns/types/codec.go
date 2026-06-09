package types

import (
	"context"

	"github.com/cosmos/cosmos-sdk/codec"
	cdctypes "github.com/cosmos/cosmos-sdk/codec/types"
	sdk "github.com/cosmos/cosmos-sdk/types"
	"github.com/cosmos/cosmos-sdk/types/msgservice"
)

// ModuleCdc is the module codec
var ModuleCdc = codec.NewProtoCodec(cdctypes.NewInterfaceRegistry())

// RegisterInterfaces registers the module types with the interface registry
func RegisterInterfaces(registry cdctypes.InterfaceRegistry) {
	registry.RegisterImplementations((*sdk.Msg)(nil),
		&MsgUpdateParams{},
	)
	msgservice.RegisterMsgServiceDesc(registry, &Msg_serviceDesc)
}

// RegisterMsgServer registers the msg server
func RegisterMsgServer(cfg msgservice.MsgServiceRegistrar, srv MsgServer) {
	RegisterMsgServer(cfg, srv)
}

// Msg_serviceDesc is the gRPC service description
var Msg_serviceDesc = struct {
	ServiceName string
	HandlerType interface{}
	Methods     []struct{ MethodName string }
}{
	ServiceName: "cina.icsdns.Msg",
	HandlerType: (*MsgServer)(nil),
	Methods: []struct{ MethodName string }{
		{MethodName: "UpdateParams"},
	},
}

// RegisterMsgServer registers the msg server
func RegisterMsgServer(registrar msgservice.MsgServiceRegistrar, srv MsgServer) {
	registrar.RegisterService(&Msg_serviceDesc, srv)
}

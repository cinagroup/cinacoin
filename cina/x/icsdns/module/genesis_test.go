package icsdns_test

import (
	"testing"

	keepertest "cina/testutil/keeper"
	"cina/testutil/nullify"
	icsdns "cina/x/icsdns/module"
	"cina/x/icsdns/types"
	"github.com/stretchr/testify/require"
)

func TestGenesis(t *testing.T) {
	genesisState := types.GenesisState{
		Params:	types.DefaultParams(),
		
		// this line is used by starport scaffolding # genesis/test/state
	}

	k, ctx := keepertest.IcsdnsKeeper(t)
	icsdns.InitGenesis(ctx, k, genesisState)
	got := icsdns.ExportGenesis(ctx, k)
	require.NotNil(t, got)

	nullify.Fill(&genesisState)
	nullify.Fill(got)

	

	// this line is used by starport scaffolding # genesis/test/assert
}

package keeper_test

import (
	"testing"

	"github.com/stretchr/testify/require"

    keepertest "cina/testutil/keeper"
    "cina/x/icsdns/types"
)

func TestGetParams(t *testing.T) {
	k, ctx := keepertest.IcsdnsKeeper(t)
	params := types.DefaultParams()

	require.NoError(t, k.SetParams(ctx, params))
	require.EqualValues(t, params, k.GetParams(ctx))
}

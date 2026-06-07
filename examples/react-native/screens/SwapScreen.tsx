import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useCinaCoinContext } from '@cinacoin/react-native';

const TOKENS = [
  { symbol: 'WETH', icon: '🔷' },
  { symbol: 'USDC', icon: '💵' },
  { symbol: 'USDT', icon: '💲' },
  { symbol: 'DAI', icon: '🟡' },
];

export function SwapScreen() {
  const { account } = useCinaCoinContext();
  const [fromToken, setFromToken] = useState(0);
  const [toToken, setToToken] = useState(1);
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState(50);
  const [quote, setQuote] = useState<{
    toAmount: string;
    priceImpact: string;
    gasEstimate: string;
    provider: string;
  } | null>(null);

  const handleGetQuote = () => {
    if (!amount) return;
    const numAmount = parseFloat(amount) || 0;
    setQuote({
      toAmount: (numAmount * 3000).toFixed(2),
      priceImpact: '0.12%',
      gasEstimate: '~0.003 ETH',
      provider: 'Uniswap V3',
    });
  };

  const handleSwap = () => {
    if (!quote || !amount) return;
    Alert.alert('Swap', `提交 ${amount} ${TOKENS[fromToken].symbol} → ${TOKENS[toToken].symbol}`);
  };

  const swapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setAmount('');
    setQuote(null);
  };

  if (!account?.address) {
    return (
      <View style={styles.container}>
        <Text style={styles.noAccount}>请先连接钱包</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* From */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>From</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.amountInput}
            placeholder="0.0"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
            placeholderTextColor="#64748B"
            accessible={true}
            accessibilityLabel="Amount to swap from"
          />
          <TouchableOpacity
            style={styles.tokenBtn}
            onPress={() => setFromToken((fromToken + 1) % TOKENS.length)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Select token: ${TOKENS[fromToken].symbol}`}
          >
            <Text style={styles.tokenText}>
              {TOKENS[fromToken].icon} {TOKENS[fromToken].symbol}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Swap Arrow */}
      <TouchableOpacity
        style={styles.swapArrow}
        onPress={swapTokens}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Swap tokens"
      >
        <Text style={styles.swapArrowText}>⬇️</Text>
      </TouchableOpacity>

      {/* To */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>To (estimated)</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.amountInput, styles.readonlyInput]}
            value={quote?.toAmount || ''}
            editable={false}
            placeholder="0.0"
            placeholderTextColor="#64748B"
            accessible={true}
            accessibilityLabel="Estimated amount to receive"
          />
          <TouchableOpacity
            style={styles.tokenBtn}
            onPress={() => setToToken((toToken + 1) % TOKENS.length)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Select output token: ${TOKENS[toToken].symbol}`}
          >
            <Text style={styles.tokenText}>
              {TOKENS[toToken].icon} {TOKENS[toToken].symbol}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Slippage */}
      <View style={styles.slippageGroup}>
        <Text style={styles.label}>Slippage Tolerance</Text>
        <View style={styles.slippageBtns}>
          {([10, 50, 100] as const).map((bps) => (
            <TouchableOpacity
              key={bps}
              style={[
                styles.slippageBtn,
                slippage === bps && styles.slippageBtnActive,
              ]}
              onPress={() => setSlippage(bps)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Slippage ${(bps / 100).toFixed(1)}%`}
            >
              <Text
                style={[
                  styles.slippageBtnText,
                  slippage === bps && styles.slippageBtnTextActive,
                ]}
              >
                {(bps / 100).toFixed(1)}%
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Quote */}
      {quote && (
        <View style={styles.quoteCard}>
          <View style={styles.quoteRow}>
            <Text style={styles.quoteLabel}>Provider</Text>
            <Text style={styles.quoteValue}>{quote.provider}</Text>
          </View>
          <View style={styles.quoteRow}>
            <Text style={styles.quoteLabel}>Price Impact</Text>
            <Text style={styles.quoteValue}>{quote.priceImpact}</Text>
          </View>
          <View style={styles.quoteRow}>
            <Text style={styles.quoteLabel}>Gas</Text>
            <Text style={styles.quoteValue}>{quote.gasEstimate}</Text>
          </View>
          <View style={styles.quoteRow}>
            <Text style={styles.quoteLabel}>Minimum Received</Text>
            <Text style={styles.quoteValue}>
              {(
                parseFloat(quote.toAmount) *
                (1 - slippage / 10000)
              ).toFixed(2)}{' '}
              {TOKENS[toToken].symbol}
            </Text>
          </View>
        </View>
      )}

      {/* Action Button */}
      <TouchableOpacity
        style={[
          styles.actionBtn,
          !quote && !amount && styles.actionBtnDisabled,
        ]}
        onPress={quote ? handleSwap : handleGetQuote}
        disabled={!amount && !quote}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={quote
          ? `Swap ${amount} ${TOKENS[fromToken].symbol}`
          : 'Get quote'}
      >
        <Text style={styles.actionBtnText}>
          {quote
            ? `Swap ${amount} ${TOKENS[fromToken].symbol}`
            : 'Get Quote'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', padding: 16 },
  noAccount: { color: '#64748B', textAlign: 'center', marginTop: 32, fontSize: 16 },
  inputGroup: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  label: { color: '#94A3B8', fontSize: 12, marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  amountInput: {
    flex: 1,
    backgroundColor: 'transparent',
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '600',
    padding: 0,
    minHeight: 44, // a11y: min touch target
  },
  readonlyInput: { opacity: 0.7 },
  tokenBtn: {
    backgroundColor: '#334155',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 44, // a11y: min touch target
    justifyContent: 'center',
  },
  tokenText: { color: '#F8FAFC', fontSize: 14, fontWeight: '600' },
  swapArrow: {
    alignItems: 'center',
    paddingVertical: 8,
    minHeight: 44, // a11y: min touch target
    justifyContent: 'center',
  },
  swapArrowText: { fontSize: 24 },
  slippageGroup: { marginBottom: 16 },
  slippageBtns: { flexDirection: 'row', gap: 8 },
  slippageBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 10,
    minHeight: 44, // a11y: min touch target
    alignItems: 'center',
    justifyContent: 'center',
  },
  slippageBtnActive: { backgroundColor: '#3B82F6' },
  slippageBtnText: { color: '#94A3B8', fontSize: 14 },
  slippageBtnTextActive: { color: '#FFFFFF' },
  quoteCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  quoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  quoteLabel: { color: '#94A3B8', fontSize: 14 },
  quoteValue: { color: '#F8FAFC', fontSize: 14 },
  actionBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    minHeight: 48, // a11y: min touch target
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnDisabled: {
    opacity: 0.5,
  },
  actionBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});

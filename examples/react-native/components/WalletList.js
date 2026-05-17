import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, FlatList, } from 'react-native';
export function WalletList({ wallets, onSelect, recommended = [] }) {
    // Sort: recommended first, then installed, then others
    const sorted = [...wallets].sort((a, b) => {
        const aRec = recommended.includes(a.id) ? 1 : 0;
        const bRec = recommended.includes(b.id) ? 1 : 0;
        if (aRec !== bRec)
            return bRec - aRec;
        if (a.installed !== b.installed)
            return (b.installed ? 1 : 0) - (a.installed ? 1 : 0);
        return 0;
    });
    const renderItem = ({ item }) => (_jsxs(TouchableOpacity, { style: styles.walletCard, onPress: () => onSelect(item), children: [_jsx(View, { style: styles.walletIcon, children: _jsx(Image, { source: { uri: item.icon }, style: styles.iconImage }) }), _jsxs(View, { style: styles.walletInfo, children: [_jsxs(View, { style: styles.nameRow, children: [_jsx(Text, { style: styles.walletName, children: item.name }), item.recommended && (_jsx(View, { style: styles.recommendedBadge, children: _jsx(Text, { style: styles.recommendedText, children: "\u63A8\u8350" }) })), item.installed && (_jsx(View, { style: styles.installedBadge, children: _jsx(Text, { style: styles.installedText, children: "\u5DF2\u5B89\u88C5" }) }))] }), !item.installed && item.downloadUrl && (_jsx(Text, { style: styles.downloadHint, children: "\u70B9\u51FB\u5B89\u88C5" }))] }), _jsx(Text, { style: styles.arrow, children: "\u2192" })] }));
    return (_jsx(FlatList, { data: sorted, keyExtractor: (item) => item.id, renderItem: renderItem, contentContainerStyle: styles.listContainer, showsVerticalScrollIndicator: false }));
}
const styles = StyleSheet.create({
    listContainer: { paddingVertical: 8 },
    walletCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E293B',
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
    },
    walletIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#334155',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    iconImage: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    walletInfo: { flex: 1 },
    nameRow: { flexDirection: 'row', alignItems: 'center' },
    walletName: { color: '#F8FAFC', fontSize: 16, fontWeight: '600' },
    recommendedBadge: {
        backgroundColor: '#3B82F6',
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginLeft: 8,
    },
    recommendedText: { color: '#FFFFFF', fontSize: 10, fontWeight: '600' },
    installedBadge: {
        backgroundColor: '#22C55E',
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginLeft: 8,
    },
    installedText: { color: '#FFFFFF', fontSize: 10, fontWeight: '600' },
    downloadHint: { color: '#3B82F6', fontSize: 12, marginTop: 2 },
    arrow: { color: '#64748B', fontSize: 18 },
});
//# sourceMappingURL=WalletList.js.map
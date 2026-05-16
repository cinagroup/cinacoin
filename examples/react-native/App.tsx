import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { OnChainUXProvider } from '@onchainux/react-native'
import { ConnectScreen } from './screens/ConnectScreen'
import { SwapScreen } from './screens/SwapScreen'
import { MultiChainScreen } from './screens/MultiChainScreen'
import { defaultWallets } from './utils/walletConfig'

const Tab = createBottomTabNavigator()

const config = {
  projectId: 'demo-project-id',
  relayUrl: 'wss://relay.onchainux.com/v1',
  chains: [
    {
      id: 1,
      name: 'Ethereum',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrl: 'https://rpc.onchainux.com/eth',
    },
    {
      id: 137,
      name: 'Polygon',
      nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
      rpcUrl: 'https://rpc.onchainux.com/polygon',
    },
    {
      id: 42161,
      name: 'Arbitrum',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrl: 'https://rpc.onchainux.com/arbitrum',
    },
  ],
  metadata: {
    name: 'OnChainUX Mobile Demo',
    description: 'OnChainUX React Native Example',
    url: 'https://onchainux.com',
    icons: [],
  },
}

export default function App() {
  return (
    <OnChainUXProvider config={config}>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: '#0F172A' },
            headerTintColor: '#F8FAFC',
            tabBarStyle: { backgroundColor: '#1E293B' },
            tabBarActiveTintColor: '#3B82F6',
            tabBarInactiveTintColor: '#64748B',
          }}
        >
          <Tab.Screen
            name="Connect"
            component={ConnectScreen}
            options={{ tabBarLabel: '连接', tabBarIcon: () => <Text>🔗</Text> }}
          />
          <Tab.Screen
            name="Swap"
            component={SwapScreen}
            options={{ tabBarLabel: 'Swap', tabBarIcon: () => <Text>🔄</Text> }}
          />
          <Tab.Screen
            name="MultiChain"
            component={MultiChainScreen}
            options={{ tabBarLabel: '多链', tabBarIcon: () => <Text>⛓️</Text> }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </OnChainUXProvider>
  )
}

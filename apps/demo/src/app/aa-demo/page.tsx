"use client";

import { useState, useEffect } from 'react';
import DemoLayout from '@/components/DemoLayout';

export default function AADemoPage() {
  const [smartAccount, setSmartAccount] = useState(null);
  const [batchTxs, setBatchTxs] = useState([]);
  const [batchExecuting, setBatchExecuting] = useState(false);
  const [txCount, setTxCount] = useState(0);
  
  const success = (title: string, message: string) => {
    console.log(title, message);
  };
  
  const toastError = (message: string) => {
    console.error(message);
  };

  const executeBatch = async () => {
    if (batchExecuting) return;
    
    setBatchExecuting(true);
    try {
      // Simulate batch execution
      await new Promise(resolve => setTimeout(resolve, 1000));
      setBatchExecuting(false);
      setTxCount((c) => c + batchTxs.length);
      success('Batch Executed', `${batchTxs.length} transactions completed`);
    } catch (error) {
      setBatchExecuting(false);
      toastError('Failed to execute batch');
    }
  };

  return (
    <DemoLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* ── Header ── */}
        <div className="text-center space-y-2">
          <h1 className="text-display-lg font-semibold tracking-tighter bg-gradient-to-r from-[var(--cc-violet)] via-[var(--cc-highlight-pink)] to-[var(--cc-link)] bg-clip-text text-transparent">
            Account Abstraction Demo
          </h1>
          <p className="text-[var(--cc-muted)] text-body-sm">ERC-4337 smart accounts, session keys, gas sponsorship, and batch transactions</p>
        </div>
      </div>
    </DemoLayout>
  );
}

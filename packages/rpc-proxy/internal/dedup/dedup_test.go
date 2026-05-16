package dedup

import (
	"context"
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

func TestDeduplicator_SingleCall(t *testing.T) {
	d := NewDeduplicator(100 * time.Millisecond)
	defer func() {
		// Give the cleanup goroutine time to finish
		time.Sleep(150 * time.Millisecond)
	}()

	var callCount int32
	fn := func(ctx context.Context) (interface{}, error) {
		atomic.AddInt32(&callCount, 1)
		return "result", nil
	}

	result, err := d.Do(context.Background(), "key1", fn)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result != "result" {
		t.Errorf("expected 'result', got %v", result)
	}
	if atomic.LoadInt32(&callCount) != 1 {
		t.Errorf("expected 1 call, got %d", callCount)
	}
}

func TestDeduplicator_DeduplicatesConcurrentCalls(t *testing.T) {
	d := NewDeduplicator(5 * time.Second)
	defer func() {
		time.Sleep(150 * time.Millisecond)
	}()

	var callCount int32
	fn := func(ctx context.Context) (interface{}, error) {
		atomic.AddInt32(&callCount, 1)
		time.Sleep(50 * time.Millisecond) // simulate slow operation
		return "deduped", nil
	}

	// Launch 10 concurrent calls with the same key
	const n = 10
	var wg sync.WaitGroup
	wg.Add(n)

	results := make([]interface{}, n)
	errs := make([]error, n)

	for i := 0; i < n; i++ {
		go func(idx int) {
			defer wg.Done()
			results[idx], errs[idx] = d.Do(context.Background(), "shared-key", fn)
		}(i)
	}

	wg.Wait()

	// All should have the same result
	for i := 0; i < n; i++ {
		if errs[i] != nil {
			t.Errorf("call %d error: %v", i, errs[i])
		}
		if results[i] != "deduped" {
			t.Errorf("call %d expected 'deduped', got %v", i, results[i])
		}
	}

	// The function should have been called exactly once
	if atomic.LoadInt32(&callCount) != 1 {
		t.Errorf("expected 1 call due to deduplication, got %d", callCount)
	}
}

func TestDeduplicator_DifferentKeysNotDeduplicated(t *testing.T) {
	d := NewDeduplicator(5 * time.Second)
	defer func() {
		time.Sleep(150 * time.Millisecond)
	}()

	var callCount int32
	fn := func(ctx context.Context) (interface{}, error) {
		atomic.AddInt32(&callCount, 1)
		return "unique", nil
	}

	_, _ = d.Do(context.Background(), "key-a", fn)
	_, _ = d.Do(context.Background(), "key-b", fn)
	_, _ = d.Do(context.Background(), "key-c", fn)

	if atomic.LoadInt32(&callCount) != 3 {
		t.Errorf("expected 3 calls for different keys, got %d", callCount)
	}
}

func TestDeduplicator_ContextCancellation(t *testing.T) {
	d := NewDeduplicator(5 * time.Second)
	defer func() {
		time.Sleep(150 * time.Millisecond)
	}()

	ctx, cancel := context.WithCancel(context.Background())

	var started int32
	fn := func(ctx context.Context) (interface{}, error) {
		atomic.AddInt32(&started, 1)
		<-ctx.Done()
		return nil, ctx.Err()
	}

	// Start the first call in a goroutine
	done := make(chan struct{})
	var firstResult interface{}
	var firstErr error
	go func() {
		firstResult, firstErr = d.Do(ctx, "cancel-key", fn)
		close(done)
	}()

	// Give the goroutine time to start
	time.Sleep(10 * time.Millisecond)

	// Now a second call with a different context that we cancel immediately
	ctx2, cancel2 := context.WithCancel(context.Background())
	cancel2()

	result, err := d.Do(ctx2, "cancel-key", fn)
	if err == nil {
		t.Fatal("expected error from cancelled context")
	}
	if result != nil {
		t.Errorf("expected nil result from cancelled context, got %v", result)
	}

	// Cancel the first context
	cancel()
	<-done

	if firstErr != context.Canceled {
		t.Errorf("expected context.Canceled, got %v", firstErr)
	}
}

func TestDeduplicator_WindowExpiration(t *testing.T) {
	d := NewDeduplicator(100 * time.Millisecond)

	var callCount int32
	fn := func(ctx context.Context) (interface{}, error) {
		atomic.AddInt32(&callCount, 1)
		return "fresh", nil
	}

	// First call
	_, _ = d.Do(context.Background(), "expire-key", fn)
	if atomic.LoadInt32(&callCount) != 1 {
		t.Fatalf("expected 1 call after first, got %d", callCount)
	}

	// Wait for window to expire
	time.Sleep(200 * time.Millisecond)

	// Second call should execute again
	_, _ = d.Do(context.Background(), "expire-key", fn)
	if atomic.LoadInt32(&callCount) != 2 {
		t.Errorf("expected 2 calls after window expiration, got %d", callCount)
	}
}

func TestDeduplicator_FunctionErrorPropagated(t *testing.T) {
	d := NewDeduplicator(5 * time.Second)
	defer func() {
		time.Sleep(150 * time.Millisecond)
	}()

	expectedErr := context.DeadlineExceeded
	fn := func(ctx context.Context) (interface{}, error) {
		return nil, expectedErr
	}

	_, err := d.Do(context.Background(), "error-key", fn)
	if err != expectedErr {
		t.Errorf("expected %v, got %v", expectedErr, err)
	}
}

func TestDeduplicator_ConcurrentErrorResults(t *testing.T) {
	d := NewDeduplicator(5 * time.Second)
	defer func() {
		time.Sleep(150 * time.Millisecond)
	}()

	expectedErr := context.DeadlineExceeded
	fn := func(ctx context.Context) (interface{}, error) {
		time.Sleep(20 * time.Millisecond)
		return nil, expectedErr
	}

	var wg sync.WaitGroup
	wg.Add(5)
	errs := make([]error, 5)

	for i := 0; i < 5; i++ {
		go func(idx int) {
			defer wg.Done()
			_, errs[idx] = d.Do(context.Background(), "shared-error", fn)
		}(i)
	}

	wg.Wait()

	for i := 0; i < 5; i++ {
		if errs[i] != expectedErr {
			t.Errorf("call %d expected %v, got %v", i, expectedErr, errs[i])
		}
	}
}

func TestDeduplicator_ReturnValueCorrect(t *testing.T) {
	d := NewDeduplicator(5 * time.Second)
	defer func() {
		time.Sleep(150 * time.Millisecond)
	}()

	type TestData struct {
		Name  string
		Value int
	}

	expected := &TestData{Name: "test", Value: 42}
	fn := func(ctx context.Context) (interface{}, error) {
		return expected, nil
	}

	result, err := d.Do(context.Background(), "struct-key", fn)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	data, ok := result.(*TestData)
	if !ok {
		t.Fatalf("expected *TestData, got %T", result)
	}
	if data.Name != "test" || data.Value != 42 {
		t.Errorf("expected {test, 42}, got {%s, %d}", data.Name, data.Value)
	}
}

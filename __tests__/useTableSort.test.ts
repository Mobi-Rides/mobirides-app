import { renderHook, act } from '@testing-library/react';
import { useTableSort } from '../src/hooks/useTableSort';

describe('useTableSort', () => {
  const users = [
    { id: '1', name: 'Charlie', email: 'c@test.com' },
    { id: '2', name: 'Alice', email: 'a@test.com' },
    { id: '3', name: 'Bob', email: 'b@test.com' },
  ];

  it('sorts by name ascending and descending', () => {
    const { result } = renderHook(() => useTableSort(users));
    // Default: no sort
    expect(result.current.sortedData[0].name).toBe('Charlie');
    // Sort by name desc (first click)
    act(() => { result.current.handleSort('name'); });
    expect(result.current.sortedData[0].name).toBe('Charlie'); // desc: Charlie, Bob, Alice
    expect(result.current.sortedData[2].name).toBe('Alice');
    // Sort by name asc (second click)
    act(() => { result.current.handleSort('name'); });
    expect(result.current.sortedData[0].name).toBe('Alice'); // asc: Alice, Bob, Charlie
    expect(result.current.sortedData[2].name).toBe('Charlie');
    // Third click resets sort
    act(() => { result.current.handleSort('name'); });
    expect(result.current.sortedData[0].name).toBe('Charlie'); // original order
  });

  it('sorts by email', () => {
    const { result } = renderHook(() => useTableSort(users));
    act(() => { result.current.handleSort('email'); });
    expect(result.current.sortedData[0].email).toBe('c@test.com'); // desc
    act(() => { result.current.handleSort('email'); });
    expect(result.current.sortedData[0].email).toBe('a@test.com'); // asc
  });
});

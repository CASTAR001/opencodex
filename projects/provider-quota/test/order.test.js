import test from 'node:test'
import assert from 'node:assert/strict'
import { displayedFamilies, moveFamily } from '../src/order.js'

test('reordering just the visible cards preserves hidden positions and appends new families', () => {
  const saved = ['mimo', 'glm', 'kimi']
  const available = ['kimi', 'mimo', 'minimax']
  const next = moveFamily(saved, available, 'kimi', -1)
  assert.deepEqual(next, ['kimi', 'glm', 'mimo', 'minimax'])
  assert.deepEqual(saved, ['mimo', 'glm', 'kimi'])
  assert.deepEqual(displayedFamilies(next, ['mimo', 'glm', 'deepseek', 'kimi']), ['kimi', 'glm', 'mimo', 'deepseek'])
  assert.deepEqual(displayedFamilies([], available), available)
  assert.equal(moveFamily(next, available, 'kimi', -1), next)
  assert.equal(moveFamily(next, available, 'glm', 1), next)
})

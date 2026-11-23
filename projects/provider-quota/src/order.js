// Only presentation uses this order. Inventory and quota requests retain their original order.
export function displayedFamilies(preference, available) {
  const visible = new Set(available)
  return [...new Set([...preference.filter(id => visible.has(id)), ...available])]
}

export function moveFamily(preference, available, id, step) {
  const visible = displayedFamilies(preference, available)
  const index = visible.indexOf(id)
  const neighbor = visible[index + step]
  if (index < 0 || !neighbor || Math.abs(step) !== 1) return preference
  // Keep the positions of temporarily unconfigured families for their next appearance.
  const all = [...new Set([...preference, ...available])]
  const from = all.indexOf(id)
  const to = all.indexOf(neighbor)
  all[from] = neighbor
  all[to] = id
  return all
}

'use strict';
// Transformaciones puras para sincronizar una cesta sin confiar en identificadores del cliente.
const MAX_LINES = 20;
const MAX_FAVORITES = 100;
const MAX_QTY = 20;
function uniqueIds(ids) { return [...new Set(ids)]; }
function combineGuestCart(serverItems, guestItems) {
  const merged = new Map();
  for (const {id, qty} of [...serverItems, ...guestItems]) {
    if (!merged.has(id)) merged.set(id, qty);
    else merged.set(id, Math.min(MAX_QTY, Math.max(merged.get(id), qty)));
  }
  return [...merged].slice(0, MAX_LINES).map(([id, qty]) => ({id, qty}));
}
function combineFavorites(serverIds, guestIds) {
  return uniqueIds([...serverIds, ...guestIds]).slice(0, MAX_FAVORITES);
}
module.exports={MAX_LINES,MAX_FAVORITES,MAX_QTY,combineGuestCart,combineFavorites};

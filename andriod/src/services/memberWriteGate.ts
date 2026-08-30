/**
 * Üye yazma / realtime refresh yarışını önlemek için basit sayaç.
 * persistPatch sırasında refreshData override'ı silmesin.
 */
let inflightWrites = 0;

export function beginMemberWrite() {
  inflightWrites += 1;
}

export function endMemberWrite() {
  inflightWrites = Math.max(0, inflightWrites - 1);
}

export function isMemberWriteInFlight() {
  return inflightWrites > 0;
}

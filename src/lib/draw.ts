import { Participant } from '@/types';

/**
 * Executes a Secret Santa draw where:
 * 1. Every participant is assigned exactly one receiver.
 * 2. Every participant receives a gift from exactly one giver.
 * 3. No one is assigned to themselves (No self-match: giver !== receiver).
 * 4. Forms a complete single-cycle (Hamiltonian cycle) using Sattolo's algorithm so there are no isolated pairs.
 */
export function executeDraw(participants: Participant[]): { giver: Participant; receiver: Participant }[] {
  if (participants.length < 2) {
    throw new Error('Se requieren al menos 2 participantes para realizar el sorteo.');
  }

  // Clone list
  const list = [...participants];

  // Fisher-Yates initial shuffle for randomness
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }

  // Sattolo's algorithm to generate a single random cyclic permutation (derangement)
  // Each element i is swapped with a random index j in [0, i-1]
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * i); // Note: 0 <= j < i (strictly less than i)
    [list[i], list[j]] = [list[j], list[i]];
  }

  // list[0] gives to list[1], list[1] to list[2], ..., list[n-1] gives to list[0]
  const assignments: { giver: Participant; receiver: Participant }[] = [];

  for (let i = 0; i < list.length; i++) {
    const giver = list[i];
    const receiver = list[(i + 1) % list.length];
    
    // Safety check
    if (giver.id === receiver.id) {
      throw new Error('Error en el algoritmo de sorteo: asignación a uno mismo detectada.');
    }

    assignments.push({ giver, receiver });
  }

  return assignments;
}

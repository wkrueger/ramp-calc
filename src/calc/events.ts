import { Spells } from "./spells"

export type CombatEvent =
  | { id: number; type: "_queuenext" }
  | {
      id: number
      type: "dmg" | "heal"
      target: string
      spell: Spells
      source: string
      value: number | null
      calcValue?: boolean
    }
  | {
      id: number
      type: "spell_cast_start"
      target: string | null
      spell: Spells
      source: string
      castEnd: number
    }
  | {
      id: number
      type: "spell_cast_success"
      target: string | null
      spell: Spells
      source: string
    }

export interface EventTime {
  time: number
  event: CombatEvent
}

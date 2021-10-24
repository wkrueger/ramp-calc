import { EventLog } from "./EventLog"
import { CombatEvent, handlers } from "./events"
import { Enemy, Player } from "./player"
import { ScheduledEvents } from "./ScheduledEvents"
import { Spell, spells, Spells, Targetting } from "./spells"

export class EncounterState {
  private _eventIdCounter = 0

  GROUP_SIZE = 20

  friendlyUnitsIdx: Map<string, Player>
  enemyUnitsIdx: Map<string, Enemy>
  allUnitsIdx: Map<string, Player | Enemy>

  scheduledEvents = new ScheduledEvents()
  spellsQueued: { source: string; spell: Spells }[] = []
  eventLog = new EventLog()
  time = 0

  constructor() {
    const friendlyUnits = Array(this.GROUP_SIZE)
      .fill(null)
      .map((_, idx) => new Player({ id: String(idx) }))
    this.friendlyUnitsIdx = new Map()
    this.allUnitsIdx = new Map()
    for (const unit of friendlyUnits) {
      this.friendlyUnitsIdx.set(unit.id, unit)
      this.allUnitsIdx.set(unit.id, unit)
    }
    this.enemyUnitsIdx = new Map()
    const enemy = new Enemy({ id: "e0" })
    this.enemyUnitsIdx.set(enemy.id, enemy)
    this.allUnitsIdx.set(enemy.id, enemy)
  }

  on(eventType: string, handler: any) {}

  queueSequence(source: string, sequence: Spells[]) {
    sequence.forEach((spell) => {
      this.spellsQueued.push({ source, spell })
    })
  }

  createEventId() {
    return ++this._eventIdCounter
  }

  getSpellTarget(spellInfo: Spell, casterId: string) {
    const { targetting } = spellInfo
    if (targetting === Targetting.Enemy) {
      return [this.enemyUnitsIdx.get("e0")]
    } else if (targetting === Targetting.Self) {
      return [this.friendlyUnitsIdx.get("0")]
    } else if (targetting === Targetting.Friendly) {
      const applyAura = spellInfo.applyAura
      const targetCount = spellInfo.targetCount ?? 1
      const result: Player[] = []
      for (const unit of this.friendlyUnitsIdx.values()) {
        if (applyAura) {
          const hasAura = unit.auras.some(
            (aura) => aura.id === applyAura && aura.caster === casterId
          )
          if (hasAura) continue
        }
        if (result.length < targetCount) {
          result.push(unit)
          if (result.length === targetCount) return result
        }
      }
      return result
    }
    throw Error("Could not determine spell target.")
  }

  createEventsForSpell(spellId: Spells, source: string) {
    const out = {
      // eventLog: [] as EventTime[],
      scheduledEvents: [] as { event: CombatEvent; time: number }[],
    }
    const caster = this.friendlyUnitsIdx.get(source)
    if (!caster) {
      throw Error(`Caster ${source} not found.`)
    }
    const spellInfo = spells[spellId]
    if (!spellInfo) {
      throw Error("Spell not found.")
    }
    let damageTime = this.time + (spellInfo.travelTime || 0)
    const currentTargets = this.getSpellTarget(spellInfo, caster.id).map((t) => t!.id)
    if (spellInfo.cast) {
      const computedCast = spellInfo.cast / (1 + caster.stats.getHastePct())
      const castEnd = this.time + computedCast
      damageTime = castEnd + (spellInfo.travelTime || 0)
      const currentTarget = currentTargets[0]
      out.scheduledEvents.push({
        time: this.time,
        event: {
          id: this.createEventId(),
          type: "spell_cast_start",
          source: caster.id,
          target: currentTarget,
          spell: spellInfo.id,
          castEnd: castEnd,
        },
      })
      out.scheduledEvents.push({
        time: castEnd,
        event: {
          id: this.createEventId(),
          type: "spell_cast_success",
          source: caster.id,
          spell: spellInfo.id,
          target: currentTarget,
        },
      })
      out.scheduledEvents.push({
        time: castEnd,
        event: {
          id: this.createEventId(),
          type: "_queuenext",
        },
      })
    }
    if (!spellInfo.cast) {
      out.scheduledEvents.push({
        time: this.time,
        event: {
          id: this.createEventId(),
          type: "spell_cast_success",
          source: caster.id,
          target: currentTargets[0],
          spell: spellInfo.id,
        },
      })
      const computedGCD = 1.5 / (1 + caster.stats.getHastePct())
      out.scheduledEvents.push({
        time: this.time + computedGCD,
        event: {
          id: this.createEventId(),
          type: "_queuenext",
        },
      })
    }
    if (spellInfo.getDamage && currentTargets.length) {
      currentTargets.forEach((currentTarget) => {
        out.scheduledEvents.push({
          time: damageTime,
          event: {
            id: this.createEventId(),
            type: "dmg",
            source: caster.id,
            spell: spellInfo.id,
            target: currentTarget,
            value: null,
            calcValue: true,
          },
        })
      })
    }
    if (spellInfo.applyAura && currentTargets.length) {
      for (const currentTarget of currentTargets) {
        out.scheduledEvents.push({
          time: damageTime,
          event: {
            id: this.createEventId(),
            type: "aura_apply",
            aura: spellInfo.applyAura,
            source: source,
            target: currentTarget,
            auraModifiers: spellInfo.auraModifiers,
          },
        })
      }
    }
    if (spellInfo.getHealing && currentTargets.length) {
      for (const currentTarget of currentTargets) {
        out.scheduledEvents.push({
          time: damageTime,
          event: {
            id: this.createEventId(),
            type: "heal",
            source: caster.id,
            spell: spellInfo.id,
            target: currentTarget,
            value: null,
            calcValue: true,
          },
        })
      }
    }
    return out
  }

  pushNextSpell() {
    const nextSpell = this.spellsQueued.shift()
    if (!nextSpell) return null
    const { scheduledEvents } = this.createEventsForSpell(nextSpell.spell, nextSpell.source)
    for (const item of scheduledEvents) {
      this.scheduledEvents.push(item)
    }
  }

  run() {
    let currentEvent = this.scheduledEvents.shift()
    if (!currentEvent) {
      this.pushNextSpell()
      currentEvent = this.scheduledEvents.shift()
    }
    while (currentEvent) {
      this.time = currentEvent.time
      const eventType = currentEvent.event.type as any
      if (eventType === "_queuenext") {
        this.pushNextSpell()
      } else {
        const eventHandler = handlers[eventType]
        if (!eventHandler) {
          throw Error(`No event handler for ${eventType}`)
        }
        eventHandler(currentEvent.event, this)
        this.eventLog.push(currentEvent)
      }

      currentEvent = this.scheduledEvents.shift()
      console.log("shift", currentEvent?.event.type)
    }
  }
}

function getHealing(spells: Spells[], player: Player) {
  const state = new EncounterState()
  state.queueSequence("0", spells)
  state.run()
  return state
}

export function sample() {
  // const spells = [...Array(8).fill(Spells.Shield), Spells.Radiance, Spells.Smite, Spells.Smite]
  const spells = [Spells.Shield, Spells.Radiance, Spells.Solace]
  const player = new Player({ id: "0" })
  return getHealing(spells, player)
}

export {}

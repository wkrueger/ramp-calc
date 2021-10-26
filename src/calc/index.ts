import { EventLog } from "./EventLog"
import { CombatEvent, eventEffects } from "./events"
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
    return []
  }

  createEventsForSpell(spellId: Spells, source: string, queueNext = true) {
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
    if (spellInfo.passive) {
      throw Error(`Spell ${spellId} is passive and cant be invoked.`)
    }
    let damageTime = this.time + (spellInfo.travelTime || 0)
    const currentTargets = this.getSpellTarget(spellInfo, caster.id).map((t) => t!.id)
    const computedCast = spellInfo.cast / (1 + caster.stats.getHastePct())
    if (spellInfo.cast) {
      const castEnd = this.time + computedCast
      damageTime = castEnd + (spellInfo.travelTime || 0)
      const currentTarget = currentTargets[0]
      const { startEvent, endEvent } = spellInfo.channel
        ? { startEvent: "spell_channel_start", endEvent: "spell_channel_finish" }
        : { startEvent: "spell_cast_start", endEvent: "spell_cast_end" }
      out.scheduledEvents.push({
        time: this.time,
        event: {
          id: this.createEventId(),
          type: startEvent as any,
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
          type: endEvent as any,
          source: caster.id,
          spell: spellInfo.id,
          target: currentTarget,
        },
      })
      if (queueNext) {
        out.scheduledEvents.push({
          time: castEnd,
          event: {
            id: this.createEventId(),
            type: "_queuenext",
          },
        })
      }
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
      const computedGCD = (spellInfo.gcd || 1.5) / (1 + caster.stats.getHastePct())
      if (queueNext) {
        out.scheduledEvents.push({
          time: this.time + computedGCD,
          event: {
            id: this.createEventId(),
            type: "_queuenext",
          },
        })
      }
    }
    if (spellInfo.getDamage || spellInfo.getHealing) {
      for (const currentTarget of currentTargets) {
        let ticksInfo: number[]
        if (!spellInfo.channel) {
          ticksInfo = [damageTime]
        } else {
          const nticks = spellInfo.channel.ticks
          const tickTime = computedCast / (nticks - 1)
          ticksInfo = Array.from({ length: nticks }, (_, index) => {
            return this.time + index * tickTime + (spellInfo.travelTime || 0)
          })
        }
        ticksInfo.forEach((eachTick) => {
          if (spellInfo.getDamage) {
            out.scheduledEvents.push({
              time: eachTick,
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
          }
          if (spellInfo.getHealing) {
            out.scheduledEvents.push({
              time: eachTick,
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
        })
      }
    }
    if (spellInfo.applyAura) {
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
        const eventEffect = eventEffects[eventType]
        if (!eventEffect) {
          throw Error(`No event handler for ${eventType}`)
        }
        eventEffect(currentEvent.event, this)
        this.eventLog.push(currentEvent)
      }

      currentEvent = this.scheduledEvents.shift()
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
  const spells = [Spells.Shield, Spells.PenanceEnemy]
  const player = new Player({ id: "0" })
  return getHealing(spells, player)
}

export {}

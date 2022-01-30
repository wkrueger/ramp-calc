import { Talents } from "../data/talents"
import { Auras } from "./aurasConstants"
import { conduits } from "./conduits"
import { EventLog } from "./EventLog"
import { CombatEvent, eventEffects } from "./events"
import { Enemy, Player } from "./Player"
import { ScheduledEvents } from "./ScheduledEvents"
import { Spell, spells, Targetting } from "./spells"
import { Spells } from "./spellsConstants"
import { StatRatingsIn } from "./StatsHandler"

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

  constructor(args: { playerStatRatings: StatRatingsIn; talents: Talents[]; conduits: Auras[] }) {
    const friendlyUnits = Array(this.GROUP_SIZE)
      .fill(null)
      .map((_, idx) => {
        const toSetTalents = idx === 0 ? args.talents : []
        return new Player({
          id: String(idx),
          statRatings: args.playerStatRatings,
          talents: toSetTalents,
        })
      })
    friendlyUnits[0].addAura({
      id: Auras.DisciplineSpec,
      appliedAt: 0,
      caster: "0",
      expiredAt: null as any,
      eventReference: null as any,
      links: [],
    })
    for (const conduitId of args.conduits) {
      const check = conduits[conduitId]
      if (!check) throw Error(`Aura ${conduitId} not listed in conduits.`)
      friendlyUnits[0].addAura({
        id: conduitId,
        appliedAt: 0,
        caster: "0",
        expiredAt: null as any,
        eventReference: null as any,
        links: [],
        level: 252,
      })
    }
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

  queueSequence(source: string, sequence: Spells[]) {
    sequence.forEach(spell => {
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
          const hasAura = unit.getAura(applyAura, { caster: casterId })
          if (hasAura) continue
        }
        if (result.length < targetCount) {
          result.push(unit)
          if (result.length === targetCount) {
            return result
          }
        }
      }
      return result
    }
    return []
  }

  getEventsForSpell({
    spellId,
    source,
    time = this.time,
    queueNext = true,
    allowPassive = false,
  }: {
    spellId: Spells
    source: string
    time?: number
    allowPassive?: boolean
    queueNext?: boolean
  }) {
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
    if (!allowPassive && spellInfo.passive) {
      throw Error(`Spell ${spellId} is passive and cant be invoked.`)
    }
    let damageTime = time + (spellInfo.travelTime || 0)
    const currentTargets = this.getSpellTarget(spellInfo, caster.id).map(t => t!.id)
    const computedCast = spellInfo.cast / (1 + caster.stats.getHastePct())
    if (spellInfo.cast) {
      const castEnd = time + computedCast
      damageTime = castEnd + (spellInfo.travelTime || 0)
      const currentTarget = currentTargets[0]
      const { startEvent, endEvent } = spellInfo.channel
        ? {
            startEvent: "spell_channel_start",
            endEvent: "spell_channel_finish",
          }
        : { startEvent: "spell_cast_start", endEvent: "spell_cast_success" }
      out.scheduledEvents.push({
        time: time,
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
        time: time,
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
          time: time + computedGCD,
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
          // channel
          const nticks =
            typeof spellInfo.channel === "function"
              ? spellInfo.channel(caster).ticks
              : spellInfo.channel.ticks
          const tickTime = computedCast / (nticks - 1)
          ticksInfo = Array.from({ length: nticks }, (_, index) => {
            return time + index * tickTime + (spellInfo.travelTime || 0)
          })
        }
        ticksInfo.forEach(eachTick => {
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
    const { scheduledEvents } = this.getEventsForSpell({
      spellId: nextSpell.spell,
      source: nextSpell.source,
    })
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

  getAvailableSpells() {
    const availableSpells = Object.values(spells)
      .filter(spell => {
        if (spell.passive) return false
        const player = this.friendlyUnitsIdx.get("0")!
        if (spell.allowedStatic) {
          return spell.allowedStatic(player)
        }
        if (spell.allowed) {
          return spell.allowed(player)
        }
        return true
      })
      .sort((a, b) => {
        if (a.label > b.label) return 1
        if (b.label > a.label) return -1
        return 0
      })
    return availableSpells
  }
}

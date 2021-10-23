import { ScheduledEvents } from "./ScheduledEvents"
import { Enemy, Player } from "./player"
import { Spell, spells, Spells, Targetting } from "./spells"
import { CombatEvent, EventTime } from "./events"
import { EventLog } from "./EventLog"

class EncounterState {
  private _eventIdCounter = 0

  GROUP_SIZE = 20

  friendlyUnits: Player[]
  friendlyUnitsIdx: Map<string, Player>
  enemyUnits: Enemy[]

  scheduledEvents = new ScheduledEvents()
  spellsQueued: { source: string; spell: Spells }[] = []
  eventLog = new EventLog()
  time = 0

  constructor() {
    this.friendlyUnits = Array(this.GROUP_SIZE)
      .fill(null)
      .map((_, idx) => new Player({ id: String(idx) }))
    this.friendlyUnitsIdx = new Map()
    for (const unit of this.friendlyUnits) {
      this.friendlyUnitsIdx.set(unit.id, unit)
    }
    this.enemyUnits = [new Enemy({ id: "e0" })]
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

  getSpellTarget(spellInfo: Spell) {
    const { targetting } = spellInfo
    if (targetting === Targetting.Enemy) {
      return this.enemyUnits[0]
    } else if (targetting === Targetting.Self) {
      return this.friendlyUnitsIdx.get("0")
    }
    return null
  }

  createEventsForSpell(spellId: Spells, source: string) {
    const out = {
      eventLog: [] as EventTime[],
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
    if (spellInfo.cast) {
      const computedCast = spellInfo.cast / (1 + caster.stats.getHastePct())
      const castEnd = this.time + computedCast
      const currentTarget = this.getSpellTarget(spellInfo)?.id || null
      out.eventLog.push({
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
      if (spellInfo.getDamage && currentTarget) {
        out.scheduledEvents.push({
          time: castEnd,
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
    }
    return out
  }

  pushNextSpell() {
    const nextSpell = this.spellsQueued.shift()
    console.log("nextSpell", nextSpell)
    if (!nextSpell) return null
    const { eventLog, scheduledEvents } = this.createEventsForSpell(
      nextSpell.spell,
      nextSpell.source
    )
    for (let ev of eventLog) {
      this.eventLog.push(ev)
    }
    console.log("adding", { eventLog, scheduledEvents })
    console.log(
      "beforeadd",
      this.scheduledEvents.all().map((x) => x.event.type)
    )
    for (const item of scheduledEvents) {
      this.scheduledEvents.push(item)
    }
    console.log(
      "afteradd",
      this.scheduledEvents.all().map((x) => x.event.type)
    )
  }

  run() {
    let currentEvent = this.scheduledEvents.shift()
    if (!currentEvent) {
      this.pushNextSpell()
      currentEvent = this.scheduledEvents.shift()
    }
    while (currentEvent) {
      this.time = currentEvent.time
      if (currentEvent.event.type === "spell_cast_start") {
        const caster = this.friendlyUnitsIdx.get(currentEvent.event.source)
        if (!caster) throw Error("Caster not found.")
        caster.combatState.state = {
          type: "casting",
          spell: currentEvent.event.spell,
          start: this.time,
          end: currentEvent.event.castEnd,
        }
        this.eventLog.push(currentEvent)
      } else if (currentEvent.event.type === "spell_cast_success") {
        const caster = this.friendlyUnitsIdx.get(currentEvent.event.source)
        if (!caster) throw Error("Caster not found.")
        caster.combatState.state = {
          type: "idle",
        }
        this.eventLog.push(currentEvent)
      } else if (currentEvent.event.type === "_queuenext") {
        this.pushNextSpell()
      } else if (currentEvent.event.type === "dmg") {
        if (currentEvent.event.calcValue) {
          const spellInfo = spells[currentEvent.event.spell]
          if (!spellInfo) throw Error("Spell not found.")
          if (spellInfo.getDamage) {
            const source = this.friendlyUnitsIdx.get(currentEvent.event.source)
            if (!source) throw Error("Source not found.")
            const value = spellInfo.getDamage(source.stats.getStatRatings())
            currentEvent.event.value = value
          }
        }
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
  const spells = [Spells.Smite, Spells.Smite]
  const player = new Player({ id: "0" })
  return getHealing(spells, player)
}

export {}

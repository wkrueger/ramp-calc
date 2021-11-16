import { StatRatingsIn } from "../calc/player"

// my toon
// intellect 1978
// haste 995
// mast 487
// crit 691
// vers 159

// smite: expect ~1013 got 966

// sem arma
// int 1661
// crit 691
// haste 995
// vers 133
// mast 433

// smite: expect 850 got 806

// pelado
// int 452

// smite 225 212.4
// mind 337 calc 442.6
// purge initial dmg 95

interface TestCase {
  stats: StatRatingsIn
}

export function DamageTester() {
  return (
    <>
      <h1>Damage Tester</h1>
    </>
  )
}

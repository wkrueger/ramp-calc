import { StatRatingsIn, StatsHandler } from "../calc/StatsHandler"
import _capitalize from "lodash/capitalize"

const hasteData = [
  { rating: 0, expected: 0 },
  { rating: 165, expected: 5 },
  { rating: 995, expected: 30.14 },
  { rating: 1141, expected: 34.12 },
]

const criticalData = [
  { rating: 0, expected: 6 },
  { rating: 152, expected: 10.34 },
  { rating: 691, expected: 25.74 },
  { rating: 1165, expected: 38.96 },
]

const versatilityData = [
  { rating: 0, expected: 0 },
  { rating: 522, expected: 13.05 },
  { rating: 857, expected: 21.42 }, // got 21.43
]

const masteryData = [
  { rating: 0, expected: 10.8 },
  { rating: 194, expected: 18.28 },
  { rating: 487, expected: 29.58 },
  { rating: 1124, expected: 53.87 },
]

function getStatPct(stat: keyof StatRatingsIn, value: number) {
  const obj: any = new StatsHandler({
    ratings: {
      critical: 0,
      haste: 0,
      intellect: 0,
      mastery: 0,
      versatility: 0,
      [stat]: value,
    },
  })
  return obj["get" + _capitalize(stat) + "Pct"]()
}

export function StatsTester() {
  return (
    <>
      <h1>Stats Tester</h1>

      <StatBlock stat="haste" data={hasteData} />
      <StatBlock stat="critical" data={criticalData} />
      <StatBlock stat="versatility" data={versatilityData} />
      <StatBlock stat="mastery" data={masteryData} />
    </>
  )
}

function StatBlock(props: {
  stat: keyof StatRatingsIn
  data: { rating: number; expected: number }[]
}) {
  return (
    <section style={{ marginTop: "2rem" }}>
      <h2>{_capitalize(props.stat)}</h2>
      <table>
        <thead>
          <tr>
            <th>Rating</th>
            <th>Calc</th>
            <th>Expected</th>
          </tr>
        </thead>
        <tbody>
          {props.data.map((row, idx) => {
            return (
              <tr key={idx}>
                <td>{row.rating}</td>
                <td>{(getStatPct(props.stat, row.rating) * 100).toFixed(2)}</td>
                <td>{row.expected}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </section>
  )
}

interface Args {
  200: number
  213: number
  226: number
  239: number
  252: number
  265: number
  278: number
}

// threes
export class MultCalc {
  constructor(public args: Args) {}

  calc(level: number) {
    const found = this.args[level]
    if (!found) throw Error("Counduit level not found.")
    return found
  }
}

import express from 'express'
import { graphqlHTTP } from 'express-graphql'
import { buildSchema } from 'graphql'

// GraphQL スキーマ言語を使ってスキーマを作成する
const schema = buildSchema(`
    type RandomDie {
      numSides: Int!
      rollOnce: Int!
      roll(numRolls: Int!): [Int]
    }

    type Query {
        hello: String
        quoteOfTheDay: String
        random: Float!
        rollThreeDice: [Int]
        rollDice(numDice: Int!, numSides: Int): [Int]
        getDie(numSides: Int): RandomDie
        getDieWithRootlevelResolver(numSides: Int): RandomDie
    }
`)

// このクラスは RandomDie GraphQL type を implements する
class RandomDie {
  constructor(numSides) {
    this.numSides = numSides
  }

  rollOnce() {
    return 1 + Math.floor(Math.random() * this.numSides)
  }

  roll({ numRolls }) {
    return [...Array(numRolls).keys()].map((_) => this.rollOnce())
  }
}

const randomDieWithRootlevelResolver = ({ numSides }) => ({
  numSides,
  rollOnce: 1 + Math.floor(Math.random() * numSides),
  roll: ({ numRolls }) =>
    [...Array(numRolls).keys()].map(
      (_) => 1 + Math.floor(Math.random() * numSides)
    ),
})

// 各 API エンドポイントについて、resolver 関数が rootValue から提供される
const rootValue = {
  hello: () => 'Hello World!',
  quoteOfTheDay: () =>
    Math.random() < 0.5 ? 'Take it easy' : 'Salvation lies within',
  random: () => Math.random(),
  rollThreeDice: () => [1, 2, 3].map((_) => 1 + Math.floor(Math.random() * 6)),
  rollDice: ({ numDice, numSides }) =>
    [...Array(numDice).keys()].map(
      (_) => 1 + Math.floor(Math.random() * (numSides || 6))
    ),
  getDie: ({ numSides }) => new RandomDie(numSides || 6),
  getDieWithRootlevelResolver: randomDieWithRootlevelResolver,
}

const app = express()
app.use(
  '/graphql',
  graphqlHTTP({
    schema,
    rootValue,
    graphiql: true,
  })
)

const PORT = 4000
app.listen(PORT)
console.log(`Running a GraphQL API server at http://localhost:${PORT}/graphql`)

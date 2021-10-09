import { useState, useEffect, useCallback } from 'react'

function App() {

  const [randomCountriesLoading, setRandomCountriesLoading] = useState(false)
  const [randomCountries, setRandomCountries] = useState([])

  const LoadRandomCountries = () => {
    setRandomCountriesLoading(true)
    fetchRandomCountries().then(countries => {
      setRandomCountries(countries)
      setRandomCountriesLoading(false)
    })
  }
  useEffect(LoadRandomCountries, [])

  const [neighborPairsLoading, setNeighborPairsLoading] = useState(false)
  const [neighborPairs, setNeighborPairs] = useState([])
  useEffect(() => {
    if (!randomCountries.length) return
    setNeighborPairsLoading(true)
    fetchCountryDetails(randomCountries)
      .then(countryDetails => {
        const pairs = findNeighborPairs(countryDetails)
        setNeighborPairs(pairs)
        setNeighborPairsLoading(false)
      })
  }, [randomCountries])

  const fetchCountriesAgain = useCallback(async () => {
    if (randomCountriesLoading || neighborPairsLoading) return
    LoadRandomCountries()
  }, [randomCountriesLoading, neighborPairsLoading])


  return (
      <>
        <h1>Selected Countries:</h1>
        {randomCountriesLoading ? <p>Loading...</p> :
        <ol>
          {randomCountries.map((country, i) => <li key={i}>{country.name}</li>)}
        </ol>
        }

        <h2>Neighbors:</h2>
        {neighborPairsLoading ? <p>Loading...</p> :
        (!neighborPairs.length ? <p>No groupings found!</p> :
        <ol>
          {neighborPairs.map((neighborPair, i) => <li key={i}>
            "{neighborPair.name1}" &amp; "{neighborPair.name2}"
          </li>)}
        </ol>)
        }

        <h2>Try again:</h2>
        <button disabled={randomCountriesLoading || neighborPairsLoading} onClick={fetchCountriesAgain}>Fetch Countries</button>
      </>
  )
}

async function fetchRandomCountries() {
  const allCountries = await fetchJson("https://travelbriefing.org/countries.json")
  const pickedCountries = pickItemsFromArray(allCountries, 10)
  return pickedCountries
}

async function fetchCountryDetails(countries) {
  const fetchPromises = countries.map(country => fetchJson(country.url))
  const fetchedCountryDetails = await Promise.all(fetchPromises)

  // returning just neighbors for each country (like below) makes easier to understand and follow
  // the code by other developers, but it's an extra loop which we can avoid for efficiency, aka
  // "time complexity" that is a requirement according to the task document.

  // const allNeighbors = fetchedCountryDetails.map(countryDetail => countryDetail.neighbors || [])
  return fetchedCountryDetails
}

function findNeighborPairs(countryDetails) {
  // For finding permutation we can use Round Robin Cyclic Algorithm but since dataset is not large
  // a simple O(n^2) scan with a couple extra helper loops for checks will be ok in this case which
  // is much easier to read and simpler to understand by other developers.
  const uniqueNamePairObjects = []
  const namePairStrings = [] // includes both A&B and B&A strings to easily check and prevent duplicates
  const countryNames = countryDetails.map(countryDetail => countryDetail.names.name)
  countryDetails.forEach(countryDetail => {
    const neighbors = countryDetail.neighbors || []
    neighbors.forEach(neighbor => {
      const name1 = countryDetail.names.name
      const name2 = neighbor.name
      if (countryNames.includes(neighbor.name) && !namePairStrings.includes(name1+name2)) {
        namePairStrings.push(name1+name2)
        namePairStrings.push(name2+name1)
        uniqueNamePairObjects.push({name1, name2})
      }
    })
  })
  return uniqueNamePairObjects
}

async function fetchJson(...args) {
  const resp = await fetch(...args)
  return resp.json()
}

function pickItemsFromArray(array, itemsCount) {
  const pickedItems = []
  for (let i=1; i<=itemsCount; i++) {
    pickedItems.push(pickARandomItemFromArray(array))
  }
  return pickedItems
}

function pickARandomItemFromArray(array) {
  const randomIndex = Math.round(Math.random() * (array.length - 1))
  return array.splice(randomIndex, 1)[0]
}

export default App

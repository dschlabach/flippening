import { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
  Label,
} from "recharts";
import { format, parseISO } from "date-fns";

import "./App.css";
import "./index.css";
import sack from "./assets/sack.png";
import sock from "./assets/socks.png";

function App() {
  const [sacks, setSacks] = useState({
    usd: 0,
    mcap: 0,
    eth: 0,
    oneDayVolume: 0,
    sevenDayVolume: 0,
    holders: 0,
  });
  const [socks, setSocks] = useState({
    usd: 0,
    mcap: 0,
    eth: 0,
    oneDayVolume: 0,
    sevenDayVolume: 0,
    holders: 0,
  });

  const [graphData, setGraphData] = useState([]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(async () => {
    let { socks, sacks } = await fetchData();

    let graph = [];
    let history = await fetchHistoricalData();
    let sacksHistory = history[0];
    let socksHistory = history[1];

    let sacksLaunchTime = 1622221200 * 1000;
    let now = Date.now();

    const hour = 60 * 60 * 1000;

    let dif = (now - sacksLaunchTime) / hour;

    for (let i = 0; i < dif; i++) {
      let date = new Date(sacksLaunchTime + i * hour)
        .toISOString()
        .substr(0, 13);
      graph.push({
        date: date,
      });
    }

    sacksHistory.forEach((x, index) => {
      let date = new Date(x[0]).toISOString().substr(0, 13);

      let obj = graph.find((o, i) => {
        if (o.date === date) {
          graph[i] = { ...graph[i], sacks: Number(x[1].toFixed(2)) };
          return true; // stop searching
        }
      });
    });
    socksHistory.forEach((x, index) => {
      let date = new Date(x[0]).toISOString().substr(0, 13);
      let obj = graph.find((o, i) => {
        if (o.date === date) {
          graph[i] = { ...graph[i], socks: Number(x[1].toFixed(2)) };
          return true; // stop searching
        }
      });
    });

    // fix first and last data points
    graph[graph.length - 1].socks = socks.fully_diluted_valuation.usd;
    graph[graph.length - 1].sacks = sacks.fully_diluted_valuation.usd;
    graph[0].socks = 18000000;
    graph[0].percent = 0.135;

    for (let i = 0; i < graph.length; i++) {
      if (graph[i].socks && graph[i].sacks) {
        graph[i] = {
          ...graph[i],
          percent: graph[i].sacks / graph[i].socks,
        };
      }
    }
    setGraphData(graph);

    let graphFetchResults = await graphFetch();

    setSacks({
      ...sacks,
      usd: sacks.current_price.usd,
      mcap: sacks.fully_diluted_valuation.usd,
      totalVolume:
        parseInt(graphFetchResults[0].pools[0].volumeUSD) +
        parseInt(graphFetchResults[0].pools[1].volumeUSD),
      oneDayVolume: parseInt(
        graphFetchResults[0].tokenDayDatas[
          graphFetchResults[0].tokenDayDatas.length - 1
        ].volumeUSD
      ),
    });

    setSocks({
      ...socks,
      usd: socks.current_price.usd,
      mcap: socks.fully_diluted_valuation.usd,
      totalVolume:
        parseInt(graphFetchResults[1].pools[0].volumeUSD) +
        parseInt(graphFetchResults[1].pools[1].volumeUSD),
      oneDayVolume: parseInt(
        graphFetchResults[1].tokenDayDatas[
          graphFetchResults[1].tokenDayDatas.length - 1
        ].volumeUSD
      ),
    });
  }, []);

  const graphFetch = async () => {
    const sacksGraphResults = await axios.post(
      "https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v3-testing",
      {
        query: `{pools (where:{token0:"0xa6610ed604047e7b76c1da288172d15bcda57596"}) {

      id
      volumeUSD
      token0Price
      token0 {
        name
      }
      token1 {
        name
      }
    }
      
      tokenDayDatas (where:{ token:"0xa6610ed604047e7b76c1da288172d15bcda57596"}){
      date
        volumeUSD
        priceUSD
    } 
    }
    `,
      }
    );
    const socksGraphResults = await axios.post(
      "https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v3-testing",
      {
        query: `{pools (where:{token0:"0x23b608675a2b2fb1890d3abbd85c5775c51691d5"}) {

      id
      volumeUSD
      token0Price
      token0 {
        name
      }
      token1 {
        name
      }
    }
      
      tokenDayDatas (where:{ token:"0x23b608675a2b2fb1890d3abbd85c5775c51691d5"}){
      date
        volumeUSD
        priceUSD
    } 
    }
    `,
      }
    );

    return [sacksGraphResults.data.data, socksGraphResults.data.data];
  };

  const fetchData = async () => {
    const sacksResults = await axios.get(
      "https://api.coingecko.com/api/v3/coins/sacks"
    );
    const socksResults = await axios.get(
      "https://api.coingecko.com/api/v3/coins/unisocks"
    );

    return {
      sacks: sacksResults.data.market_data,
      socks: socksResults.data.market_data,
    };
  };

  const fetchHistoricalData = async () => {
    let now = Date.now() / 1000;

    const sacksResults = await axios.get(
      `https://api.coingecko.com/api/v3/coins/sacks/market_chart/range?vs_currency=usd&from=1622116800&to=${now}`
    );
    const socksResults = await axios.get(
      `https://api.coingecko.com/api/v3/coins/unisocks/market_chart/range?vs_currency=usd&from=1622116800&to=${now}`
    );

    return [sacksResults.data.market_caps, socksResults.data.market_caps];
  };

  var formatterPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
  var formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 1,
  });

  let lineChart = (
    <LineChart data={graphData}>
      <Line
        type="basis"
        dataKey="sacks"
        stroke="#785ecd"
        dot={false}
        activeDot={true}
        strokeWidth={4}
        tickFormatter={(number) => `$${number}`}
      />
      <Line
        type="basis"
        dataKey="socks"
        stroke="#FF007A"
        dot={false}
        activeDot={true}
        strokeWidth={4}
        tickFormatter={(number) => `$${number}`}
        connectNulls
      />
      <XAxis
        dataKey="date"
        interval={24}
        tickFormatter={(str) => {
          if (str !== 0) {
            const date = parseISO(String(str).substring(0, 10));
            return format(date, "M/d");
          }
          return "error";
        }}
      />

      <YAxis
        dataKey="socks"
        width={75}
        tickFormatter={(number) => `$${number.toFixed(2) / 1000000}M`}
      >
        <Label
          value="Market Cap ($M)"
          angle={-90}
          position="outsideLeft"
          dx={-30}
        ></Label>
      </YAxis>
      <Tooltip content={<CustomTooltip></CustomTooltip>} />
      <Legend />
    </LineChart>
  );

  function CustomTooltip({ active, payload, label }) {
    if (active && payload && label) {
      return (
        <div className="p-4 bg-white">
          <h4>
            {format(parseISO(String(label).substring(0, 10)), "MMM dd yyyy")}
          </h4>

          {payload[0] && payload[0].value ? (
            <p style={{ color: payload[0].color }}>
              {payload[0].name}: ${(payload[0].value / 1000000).toFixed(1)}M{" "}
            </p>
          ) : null}
          {payload[1] && payload[1].value ? (
            <p style={{ color: payload[1].color }}>
              {payload[1].name}: ${(payload[1].value / 1000000).toFixed(1)}M{" "}
            </p>
          ) : null}
        </div>
      );
    }
    return null;
  }

  return (
    <div className="bg-gray-200 min-h-screen px-5 pt-3 flex flex-col">
      <header className="text-center font-bold text-3xl">The Flippening</header>
      <main className="max-w-7xl mx-auto">
        <p className="mt-2 text-center">
          $SACKS was launched on May 27, 2021. When will it overtake $SOCKS in
          market cap?
        </p>

        <div className="mt-5 h-96 w-full ">
          <ResponsiveContainer width="100%" height="100%">
            {lineChart}
          </ResponsiveContainer>
        </div>
        <div className="mt-5 flex flex-wrap sm:flex-no-wrap justify-around">
          <div className="pt-3 px-3 w-full sm:w-5/12 bg-gray-300 flex flex-col">
            <h2 className="mb-2 text-center font-bold text-2xl">$SACKS</h2>
            <div className="flex ml-10">
              <p className="w-1/2 ">Price/token:</p>
              <p className="ml-2">{formatterPrice.format(sacks.usd)}</p>
            </div>
            <div className="flex ml-10">
              <p className="w-1/2">Market Cap: </p>
              <p className="ml-2">{formatter.format(sacks.mcap / 1000000)}M</p>
            </div>
            <div className="flex ml-10">
              <p className="w-1/2">24h Volume: </p>
              <p className="ml-2">
                {formatterPrice.format(sacks.oneDayVolume)}
              </p>
            </div>
            <div className="flex ml-10">
              <p className="w-1/2">Total Volume: </p>
              <p className="ml-2">
                {formatter.format(sacks.totalVolume / 1000000)}M
              </p>
            </div>
            <img className="my-2 h-32 w-32 mx-auto" src={sack} alt="sack" />
            <a
              className="pb-4 underline text-sm mt-auto text-center"
              href="https://info.uniswap.org/#/tokens/0xa6610ed604047e7b76c1da288172d15bcda57596"
            >
              View token on Uniswap
            </a>
          </div>
          <div className="pt-3 px-3 w-full sm:w-5/12 bg-gray-300 flex flex-col mt-5 sm:mt-0">
            <h2 className="mb-2 text-center font-bold text-2xl">$SOCKS</h2>
            <div className="flex ml-10">
              <p className="w-1/2 ">Price/token:</p>
              <p className="ml-2">{formatterPrice.format(socks.usd)}</p>
            </div>
            <div className="flex ml-10">
              <p className="w-1/2">Market Cap: </p>
              <p className="ml-2">{formatter.format(socks.mcap / 1000000)}M</p>
            </div>
            <div className="flex ml-10">
              <p className="w-1/2">24h Volume: </p>
              <p className="ml-2">
                {formatterPrice.format(socks.oneDayVolume)}
              </p>
            </div>
            <div className="flex ml-10">
              <p className="w-1/2">Total Volume: </p>
              <p className="ml-2">
                {formatter.format(socks.totalVolume / 1000000)}M
              </p>
            </div>
            <img className="my-2 h-32 w-32 mx-auto" src={sock} alt="socks" />
            <a
              className="pb-4 underline text-sm mt-auto text-center"
              href="https://info.uniswap.org/#/tokens/0x23b608675a2b2fb1890d3abbd85c5775c51691d5"
            >
              View token on Uniswap
            </a>
          </div>
        </div>
        <div className="mt-8 h-96 w-full flex justify-center items-center">
          <ResponsiveContainer>
            <AreaChart data={graphData}>
              <defs>
                <linearGradient
                  id="colorFlippening"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#785ecd" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#785ecd" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="basis"
                dataKey="percent"
                stroke="#785ecd"
                dot={false}
                activeDot={true}
                strokeWidth={4}
                tickFormatter={(number) => `$${number}`}
                connectNulls
                fillOpacity={1}
                fill="url(#colorFlippening)"
              />
              <YAxis
                dataKey="percent"
                width={75}
                domain={[0, 1]}
                tickFormatter={(number) => `${number.toFixed(2) * 100}%`}
              >
                <Label
                  value="% to Flippening"
                  angle={-90}
                  position="outsideLeft"
                  dx={-30}
                ></Label>
              </YAxis>
              <XAxis
                dataKey="date"
                interval={24}
                tickFormatter={(str) => {
                  if (str !== 0) {
                    const date = parseISO(String(str).substring(0, 10));
                    return format(date, "M/d");
                  }
                  return "error";
                }}
              ></XAxis>
              <Tooltip
                labelFormatter={(label) => {
                  console.log(label);
                  if (label !== 0) {
                    return format(
                      parseISO(String(label).substring(0, 10)),
                      "MMM dd yyyy"
                    );
                  }
                  return "error";
                }}
                formatter={(number) => `${(number * 100).toFixed(2)}%`}
              />
              <Legend />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </main>
      <footer className="text-center py-2 mt-auto">
        Built by{" "}
        <a className="underline" href="https://twitter.com/DMSchlabach">
          Daniel Schlabach
        </a>{" "}
        using data from{" "}
        <a className="underline" href="https://coingecko.com">
          CoinGecko
        </a>{" "}
        and Uniswap.
      </footer>
    </div>
  );
}

export default App;

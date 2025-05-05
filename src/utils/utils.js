import axios from "axios";
import { ethers } from "ethers";
import { ERC20ABI } from "./Constatnt";

export function formatNumberWithSuffix(number) {
  const absNum = Math.abs(Number(number)); // handle negatives and ensure it's a number

  if (absNum >= 1e12) {
    return (number / 1e12).toFixed(2).replace(/\.00$/, "") + "T"; // Trillions
  } else if (absNum >= 1e9) {
    return (number / 1e9).toFixed(2).replace(/\.00$/, "") + "B"; // Billions
  } else if (absNum >= 1e6) {
    return (number / 1e6).toFixed(2).replace(/\.00$/, "") + "M"; // Millions
  } else if (absNum >= 1e3) {
    return (number / 1e3).toFixed(2).replace(/\.00$/, "") + "K"; // Thousands
  } else {
    return number.toLocaleString(); // Localized for under 1K
  }
}

function roundUpToThreeDecimals(num) {
  return (Math.ceil(num * 1000) / 1000).toFixed(3);
}

const getEthUsdPrice = async () => {
  const res = await axios.get(
    "https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD"
  );
  return res.data.USD;
};
async function getUsdPrice(tokenAddress) {
  try {
    const url = `https://api.dexscreener.com/latest/dex/search?q=${tokenAddress}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.pairs && data.pairs.length > 0) {
      const pair = data.pairs[0]; // You can loop through if you want best liquidity etc.
      return {
        priceUsd: pair.priceUsd,
        pairAddress: pair.pairAddress,
        baseToken: pair.baseToken.symbol,
        quoteToken: pair.quoteToken.symbol,
      };
    } else {
      console.warn(`No pairs found for token ${tokenAddress}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching USD price for ${tokenAddress}:`, err.message);
    return null;
  }
}

export const formatData = async (data) => {
  console.log(data);

  const filteredData = [];

  for (const metadata of data) {
    try {
      const hintRes = await axios.get(
        `https://brown-familiar-ape-248.mypinata.cloud/ipfs/${metadata.hint}`
      );
      // console.log(metadata.rewardToken);

      if (
        metadata.rewardToken === "0x0000000000000000000000000000000000000000"
      ) {
        // console.log(hintRes);
        const ethPrice = await getEthUsdPrice(); // e.g., 3200
        // console.log(ethPrice);

        const amountInWei = Number(metadata.rewardAmount);
        const amountInEth = ethers.utils.formatEther(amountInWei);
        const amountInUsd = roundUpToThreeDecimals(ethPrice * amountInEth);

        // console.log(amountInUsd);

        const metadataList = {
          questId: Number(metadata.questId),
          name: metadata.question,
          description: hintRes.data, // Assuming hint text is in `data`
          amount: amountInEth,
          usdValue: amountInUsd, // Assuming the USD value is in `data`
          key: metadata.answer,
          rewardToken: metadata.rewardToken,
          isActive: metadata.isActive,
        };

        filteredData.push(metadataList);
      } else {
        const provider = new ethers.providers.JsonRpcProvider(
          import.meta.env.VITE_RPC_URL
        ); // or your preferred provider
        const tokenContract = new ethers.Contract(
          metadata.rewardToken,
          ERC20ABI,
          provider
        );
        const decimals = await tokenContract.decimals(); // Fetch actual decimals

        const amountInWei = ethers.BigNumber.from(metadata.rewardAmount);
        const amount = ethers.utils.formatUnits(amountInWei, decimals); // properly formatted based on decimals
        //
        console.log(`amount: ${amount}`);

        // const { priceUsd, baseToken } = await getUsdPrice(data.rewardToken); //main
        const { priceUsd, baseToken } = await getUsdPrice(
          "0xF73978B3A7D1d4974abAE11f696c1b4408c027A0"
        ); // E:G

        const amountInUsd = roundUpToThreeDecimals(priceUsd * amount);
        // console.log(priceUsd * amount);
        const metadataList = {
          questId: Number(metadata.questId),
          name: metadata.question,
          description: hintRes.data, // Assuming hint text is in `data`
          amount: amount,
          usdValue: amountInUsd, // Assuming the USD value is in `data`
          key: metadata.answer,
          rewardToken: metadata.rewardToken,
          isActive: metadata.isActive,
        };
        filteredData.push(metadataList);
      }
    } catch (error) {
      console.log(error);

      // You can choose to skip or push partial data here
    }
  }

  return filteredData;
};

export const formatSingleData = async (metadata) => {
  try {
    const hintRes = await axios.get(
      `https://brown-familiar-ape-248.mypinata.cloud/ipfs/${metadata.hint}`
    );

    let amount, usdValue;

    if (metadata.rewardToken === "0x0000000000000000000000000000000000000000") {
      const ethPrice = await getEthUsdPrice();
      const amountInWei = Number(metadata.rewardAmount);
      amount = ethers.utils.formatEther(amountInWei);
      usdValue = roundUpToThreeDecimals(ethPrice * amount);
    } else {
      const provider = new ethers.providers.JsonRpcProvider(
        import.meta.env.VITE_RPC_URL
      );
      const tokenContract = new ethers.Contract(
        metadata.rewardToken,
        ERC20ABI,
        provider
      );
      const decimals = await tokenContract.decimals();
      const amountInWei = ethers.BigNumber.from(metadata.rewardAmount);
      amount = ethers.utils.formatUnits(amountInWei, decimals);

      // const { priceUsd } = await getUsdPrice(metadata.rewardToken);
      const { priceUsd, baseToken } = await getUsdPrice(
        "0xF73978B3A7D1d4974abAE11f696c1b4408c027A0"
      );
      usdValue = roundUpToThreeDecimals(priceUsd * amount);
    }

    const metadataList = {
      questId: Number(metadata.questId),
      name: metadata.question,
      description: hintRes.data,
      amount,
      usdValue,
      key: metadata.answer,
      rewardToken: metadata.rewardToken,
      isActive: metadata.isActive,
      claimedBy: metadata.claimedBy,
    };

    return metadataList;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export function truncateAddress(address) {
  if (!address) return "";
  return address.slice(0, 8) + "..." + address.slice(-6);
}

export const style = {
  control: (base) => ({
    ...base,
    backgroundColor: "var(--bg)",
    color: "var(--text)",
    height:"50px",
    borderColor: "var(--primary2)",
    outline: "none",
    borderStyle: "dotted",
    cursor: "pointer",
  }),
  singleValue: (provided) => ({ ...provided, color: "var(--text)" }),
  menu: (provided) => ({ ...provided, backgroundColor: "var(--bg)" }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? "var(--bg)" : "var(--bg)",
    color: "var(--text)",
    "&:hover": { backgroundColor: "var(--primary2)" },
  }),
};

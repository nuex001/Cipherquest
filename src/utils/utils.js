import axios from "axios";
import { ethers } from "ethers";

const getEthUsdPrice = async () => {
  const res = await axios.get(
    "https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD"
  );
  return res.data.USD;
};

export const formatData = async (data) => {
  const filteredData = [];

  for (const metadata of data) {
    try {
      const hintRes = await axios.get(
        `https://brown-familiar-ape-248.mypinata.cloud/ipfs/${metadata.hint}`
      );
      // console.log(hintRes);
      const ethPrice = await getEthUsdPrice(); // e.g., 3200
      // console.log(ethPrice);

      const amountInWei = Number(metadata.rewardAmount);
      const amountInEth = ethers.utils.formatEther(amountInWei);
      const amountInUsd = Math.ceil(ethPrice * amountInEth).toFixed(2);

      // console.log(amountInUsd);

      const metadataList = {
        questId: Number(metadata.questId),
        name: metadata.question,
        description: hintRes.data, // Assuming hint text is in `data`
        amount: amountInEth,
        usdValue: amountInUsd, // Assuming the USD value is in `data`
        key: metadata.answer,
        isActive: metadata.isActive,
      };

      filteredData.push(metadataList);
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
    // console.log(hintRes);
    const ethPrice = await getEthUsdPrice(); // e.g., 3200
    // console.log(ethPrice);

    const amountInWei = Number(metadata.rewardAmount);
    const amountInEth = ethers.utils.formatEther(amountInWei);
    const amountInUsd = Math.ceil(ethPrice * amountInEth).toFixed(2);

    // console.log(amountInUsd);

    const metadataList = {
      questId: Number(metadata.questId),
      name: metadata.question,
      description: hintRes.data, // Assuming hint text is in `data`
      amount: amountInEth,
      usdValue: amountInUsd, // Assuming the USD value is in `data`
      key: metadata.answer,
      isActive: metadata.isActive,
      claimedBy: metadata.claimedBy,
    };
    return metadataList;
  } catch (error) {
    console.log(error);

    // You can choose to skip or push partial data here
  }

  return filteredData;
};

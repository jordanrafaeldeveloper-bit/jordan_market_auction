const { ethers, JsonRpcProvider } = require("ethers");
const dotenv = require("dotenv");
const ABI = require("../constant/AuctionMarketplace.json");
dotenv.config();

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

const provider = new JsonRpcProvider(process.env.ALCHEMY_SEPOLIA_RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const auctionContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

const postItemOnChain = async (name, description, price, expiryDate) => {
  try {
    const tx = await auctionContract.postItem(
      name,
      description,
      ethers.parseEther(price.toString()),
      expiryDate
    );

    await tx.wait();

    return tx.hash;
  } catch (error) {
    throw new Error(error.message);
  }
};

const placeBidOnChain = async (itemId, bidAmount) => {
  try {
    const tx = await auctionContract.placeBid(itemId, {
      value: ethers.parseEther(bidAmount.toString()),
    });

    await tx.wait();

    return tx.hash;
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = { postItemOnChain, placeBidOnChain };

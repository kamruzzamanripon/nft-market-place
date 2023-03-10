import axios from 'axios';
import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import { Web3Storage } from 'web3.storage';
import Web3Modal from 'web3modal';
import { MarketAdddressABI, MarketAddress } from './constants';

const fetchContract = (signerOrProvider) => new ethers.Contract(MarketAddress, MarketAdddressABI, signerOrProvider);

export const NFTContext = React.createContext();

export const NFTProvider = ({ children }) => {
  const nftCurrency = 'ETH';
  const [currentAccount, setCurrentAccount] = useState('');
  const [isLoadingNFT, setIsLoadingNFT] = useState(false);

  const checkIfWalletIsConnected = async () => {
    if (!window.ethereum) return alert('please install MetaMask');

    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (accounts.length) {
      setCurrentAccount(accounts[0]);
      // console.log('checkIfWalletIsConnected', currentAccount);
    } else {
      console.log('No accounts found');
    }

    // console.log({accounts})
  };

  const connectWallet = async () => {
    if (!window.ethereum) return alert('please install MetaMask');

    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    setCurrentAccount(accounts[0]);

    window.location.reload();
  };

  const uploadToIPFS = async (file) => {
    try {
      setIsLoadingNFT(true);
      const Web3StorageClient = new Web3Storage({ token: process.env.Web3StorageApi });
      // console.log('Web3StorageClient', Web3StorageClient);
      const rootCid = await Web3StorageClient.put(file);
      // ipfsUploadedUrl = `https://${rootCid}.ipfs.dweb.link/${selectedFile[0].name}`
      setIsLoadingNFT(false);
      const ipfsUploadedUrl = `https://${rootCid}.ipfs.w3s.link/${file[0].name}`;
      return ipfsUploadedUrl;
    } catch (error) {
      console.log('Error uploading file to IPFS', error);
    }
  };

  const createNFT = async (formInput, fileUrl, router) => {
    const { name, description, price } = formInput;
    if (!name || !description || !price || !fileUrl) return;

    const data = JSON.stringify({ name, description, image: fileUrl });
    // console.log('createNft data', data);
    try {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const files = [
        new File(['contents-of-file-1'], 'plain-utf8.txt'),
        new File([blob], 'marketNft.json'),
        // new File([blob], `${name}.json`),
      ];
      const Web3StorageClient = new Web3Storage({ token: process.env.Web3StorageApi });
      // console.log('createNft Web3StorageClient', Web3StorageClient);
      setIsLoadingNFT(true);
      const rootCid = await Web3StorageClient.put(files);
      setIsLoadingNFT(false);
      // console.log('createNft rootCid', rootCid);
      const url = `https://${rootCid}.ipfs.w3s.link`;

      // 1st listing item
      // eslint-disable-next-line no-use-before-define
      await createSale(url, price);
      router.push('/');
    } catch (error) {
      console.log('Error uploading file to IPFS', error);
    }
  };

  const createSale = async (url, formInputPrice, isReselling, id) => {
    const web3modal = new Web3Modal();
    const connection = await web3modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const price = ethers.utils.parseUnits(formInputPrice, 'ether');
    const contract = fetchContract(signer);
    // console.log('createSale', contract);
    const listingPrice = await contract.getListingPrice();
    // console.log('listingPrice', listingPrice);

    const transaction = !isReselling
      ? await contract.createToken(url, price, { value: listingPrice.toString() })
      : await contract.resellToken(id, price, { value: listingPrice.toString() });
    // console.log('transaction');
    setIsLoadingNFT(true);
    await transaction.wait();
    // console.log('transaction2', transaction);
  };

  const fetchNFTs = async () => {
    setIsLoadingNFT(false);
    // const provider = new ethers.providers.JsonRpcProvider();
    // const contract = fetchContract(provider);
    const web3modal = new Web3Modal();
    const connection = await web3modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const contract = fetchContract(signer);

    const data = await contract.fetchMarketItems();

    const items = await Promise.all(data.map(async ({ tokenId, seller, owner, price: unformattedPrice }) => {
      const tokenURI = await contract.tokenURI(tokenId);
      // console.log('tokenuri', tokenURI);
      const tokenURLData = await axios.get(`${tokenURI}/marketNft.json`);
      const { name, description, image } = JSON.parse(tokenURLData.data);
      const price = ethers.utils.formatUnits(unformattedPrice.toString(), 'ether');

      return {
        price,
        tokenId: tokenId.toNumber(),
        seller,
        owner,
        image,
        name,
        description,
        tokenURI,
      };
    }));

    return items;
    // console.log(items);
  };

  const fetchMyNFTsOrListedNFTs = async (type) => {
    setIsLoadingNFT(false);
    const web3modal = new Web3Modal();
    const connection = await web3modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const contract = fetchContract(signer);

    const data = type === 'fetchItemsListed' ? await contract.fetchItemsListed() : await contract.fetchMyNFTs();

    const items = await Promise.all(data.map(async ({ tokenId, seller, owner, price: unformattedPrice }) => {
      const tokenURI = await contract.tokenURI(tokenId);
      // console.log('tokenuri', tokenURI);
      const tokenURLData = await axios.get(`${tokenURI}/marketNft.json`);
      const { name, description, image } = JSON.parse(tokenURLData.data);
      const price = ethers.utils.formatUnits(unformattedPrice.toString(), 'ether');

      return {
        price,
        tokenId: tokenId.toNumber(),
        seller,
        owner,
        image,
        name,
        description,
        tokenURI,
      };
    }));

    return items;
  };

  const buyNFT = async (nft) => {
    const web3modal = new Web3Modal();
    const connection = await web3modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();
    const contract = fetchContract(signer);

    const price = ethers.utils.parseUnits(nft.price.toString(), 'ether');

    const transaction = await contract.createMarketSale(nft.tokenId, { value: price });

    setIsLoadingNFT(true);
    await transaction.wait();
    setIsLoadingNFT(false);
  };

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  return (
    <NFTContext.Provider value={{ nftCurrency, connectWallet, currentAccount, uploadToIPFS, createNFT, createSale, fetchNFTs, fetchMyNFTsOrListedNFTs, buyNFT, isLoadingNFT }}>
      {children}
    </NFTContext.Provider>
  );
};

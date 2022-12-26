import { useTheme } from 'next-themes';
import Image from 'next/image';
import { useContext, useEffect, useRef, useState } from 'react';
import { Banner, CreatorCard, Loader, NFTCard, SearchBar } from '../components';

import images from '../assets';
import { NFTContext } from '../context/NFTContext';
import { getCreators } from '../utils/getTopCreators';
import { shortenAddress } from '../utils/shortenAddress';

const Home = () => {
  const [nfts, setNfts] = useState([]);
  const [nftsCopy, setNftsCopy] = useState([]);
  const { theme } = useTheme();
  const parentRef = useRef(null);
  const scrollRef = useRef(null);
  const [hideButtons, setHideButtons] = useState(false);
  const { fetchNFTs } = useContext(NFTContext);
  const [activeSelect, setActiveSelect] = useState('Recently added');
  const [isLoading, setIsLoading] = useState(true);

  const handleScroll = (direction) => {
    const { current } = scrollRef;

    const scrollAmount = window.innerWidth > 1800 ? 270 : 210;
    if (direction === 'left') {
      current.scrollLeft -= scrollAmount;
    } else {
      current.scrollLeft += scrollAmount;
    }
  };

  const isScrollable = () => {
    const { current } = scrollRef;
    const { current: parent } = parentRef;

    if (current?.scrollWidth >= parent?.offsetWidth) {
      setHideButtons(false);
    } else {
      setHideButtons(true);
    }
  };

  useEffect(() => {
    fetchNFTs()
      .then((items) => {
        setNfts(items);
        setNftsCopy(items);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    isScrollable();
    window.addEventListener('resize', isScrollable);

    return () => {
      window.removeEventListener('resize', isScrollable);
    };
  });

  useEffect(() => {
    const sortedNfts = [...nfts];

    switch (activeSelect) {
      case 'Price(low to high)':
        setNfts(sortedNfts.sort((a, b) => a.price - b.price));
        break;
      case 'Price (hith to low)':
        setNfts(sortedNfts.sort((a, b) => b.price - a.price));
        break;
      case 'Recently added':
        setNfts(sortedNfts.sort((a, b) => b.tokenId - b.tokenId));
        break;
      default:
        setNfts(nfts);
        break;
    }
  }, [activeSelect]);

  const onHandleSearch = (value) => {
    const filteredNfts = nfts.filter(({ name }) => name.toLowerCase().includes(value.toLowerCase()));
    if (filteredNfts.length) {
      setNfts(filteredNfts);
    } else {
      setNfts(nftsCopy);
    }
  };

  const onClearSearch = () => {
    if (nfts.length && nftsCopy.length) {
      setNfts(nftsCopy);
    }
  };

  const topCreators = getCreators(nftsCopy);

  // console.log('topCreators', topCreators);

  return (
    <div className="flex justify-center sm:px-4 p-12">
      <div className="w-full minmd:w-4/5">

        {/* Banner */}
        <Banner
          name={(
            <>
              Discover, Collect, and Sell <br /> Extraordinary NFTs
            </>
)}
          childStyles="md:text-4xl sm:text-2xl xs:text-xl text-left"
          parentStyles="justify-start mb-6 h-72 sm:h-60 p-12 xs:p-4 xs:h-44 rounded-3xl"
        />
        {/* End Banner */}

        {!isLoading && !nfts.length ? (
          <h1 className="font-poppins dark:text-white text-nft-black-1 text-2xl minlg:text-4xl font-semibold ml-4 xs:ml-0">That&apos; weired.. No NFTs for sale!</h1>
        ) : isLoading ? <Loader /> : (
          <>
            {/* Best Creator */}
            <div>
              <h1 className="font-poppins dark:text-white text-nft-black-1 text-2xl minlg:text-4xl font-semibold ml-4 xs:ml-0">Best Creators</h1>
              <div className="relative flex-1 max-w-full flex mt-3" ref={parentRef}>
                <div className="flex flex-row w-max overflow-x-scroll no-scrollbar select-none" ref={scrollRef}>
                  {topCreators.map((creator, i) => (
                    <CreatorCard
                      key={`creator-${i}`}
                      rank={i + 1}
                      creatorImage={images[`creator${i + 1}`]}
                      createName={shortenAddress(creator.seller)}
                      creatorEths={creator.sum}
                    />
                  ))}

                  {!hideButtons && (
                  <>
                    <div onClick={() => handleScroll('left')} className="absolute w-8 h-8 minlg:w-12 minlg:h-12 top-45 cursor-pointer left-0">
                      <Image
                        src={images.left}
                        layout="fill"
                        objectFit="contain"
                        alt="left_arrow"
                        className={theme === 'light' && 'filter invert'}
                      />
                    </div>
                    <div onClick={() => handleScroll('right')} className="absolute w-8 h-8 minlg:w-12 minlg:h-12 top-45 cursor-pointer right-0">
                      <Image
                        src={images.right}
                        layout="fill"
                        objectFit="contain"
                        alt="left_arrow"
                        className={theme === 'light' && 'filter invert'}
                      />
                    </div>
                  </>
                  )}

                </div>
              </div>
            </div>
            {/* End Best Creator */}

            {/* Hot Bids */}
            <div className="mt-10">
              <div className="flexBetween mx-4 xs:mx-0 minlg:mx-8 sm:flex-col sm:items-start">
                <h1 className="flex-1 font-poppins dark:text-white text-nft-black-1 text-2xl minlg:text-4xl font-semibold sm:mb-4">Hot Bids</h1>
                <div className="flex-2 sm:w-full flex flex-row sm:flex-col">
                  <SearchBar
                    activeSelect={activeSelect}
                    setActiveSelect={setActiveSelect}
                    handleSearch={onHandleSearch}
                    clearSearch={onClearSearch}
                  />
                </div>
              </div>

              <div className="mt-3 w-full flex flex-wrap justify-start md:justify-center">
                {nfts.map((nft) => <NFTCard key={nft.tokenId} nft={nft} />)}
              </div>

            </div>
            {/* End Hot Bids */}
          </>
        )}

      </div>
    </div>
  );
};

export default Home;

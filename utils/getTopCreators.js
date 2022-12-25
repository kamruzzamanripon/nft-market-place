export const getCreators = (nfts) => {
  const creators = nfts.reduce((creatorObject, nft) => {
    // eslint-disable-next-line no-param-reassign
    (creatorObject[nft.seller] = creatorObject[nft.seller] || []).push(nft);

    return creatorObject;
  }, {});

  // console.log('creators', creators);

  return Object.entries(creators).map((creator) => {
    const seller = creator[0];
    // console.log('creator[1]', creator[1]);
    const sum = creator[1].map((item) => Number(item.price)).reduce((prev, curr) => prev + curr, 0);

    return ({ seller, sum });
  });
  // console.log('ttse', nfts);
};

import { useState } from "react";

export default () => {
  const [searchWord, setSearchWord] = useState<string>();
  const [IdCoinPage, setIdCoinPage] = useState<number>(0);
  const [AllPage, setAllPage] = useState<number>(0);
  const [MintingPage, setMintingPage] = useState<number>(0);
  return {
    searchWord,
    setSearchWord,
    IdCoinPage,
    setIdCoinPage,
    AllPage,
    setAllPage,
    MintingPage,
    setMintingPage,
  };
};

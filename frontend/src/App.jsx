import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./App.css";
import abi from "./utils/WavePortal.json";

const App = () => {

  /*
  * Just a state variable we use to store our user's public wallet.
  */
  const [currentAccount, setCurrentAccount] = useState("");
  const [mining, setMining] = useState(false);
  const [message, setMessage] = useState("");
  /*
   * All state property to store all waves
   */
  const [allWaves, setAllWaves] = useState([]);

    /**
   * Create a variable here that holds the contract address after you deploy!
   */
  const contractAddress = "0xd05dC7eA25EF083a3C0c8242DeaC4a8F23940935";

  const contractABI = abi.abi;

  
  
  const checkIfWalletIsConnected = async () => {
    /*
    * First make sure we have access to window.ethereum
    */
    try {
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Make sure you have metamask!");
    } else {
      console.log("We have the ethereum object", ethereum);
    }

      

       /*
      * Check if we're authorized to access the user's wallet
      */
      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account)
        getAllWaves();
      } else {
        console.log("No authorized account found")
      }
      
      } catch (error) {
      console.log(error);
      }
  }

  /**
  * Implement your connectWallet method here
  */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error)
    }
  }


  const wave = async (e) => {
    e.preventDefault();
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        /*
        * Execute the actual wave from your smart contract
        */
        const waveTxn = await wavePortalContract.wave(message, { gasLimit: 300000 });
        setMining(true);
        console.log("Mining...", waveTxn.hash);
        setMessage("");
        

        await waveTxn.wait();
        setMining(false);
        console.log("Mined -- ", waveTxn.hash);
        getAllWaves();

        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
        
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  }

  /*
   * Create a method that gets all waves from your contract
   */
  const getAllWaves = async () => {
  const { ethereum } = window;

  try {
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      const waves = await wavePortalContract.getAllWaves();

      const wavesCleaned = waves.map(wave => {
        return {
          address: wave.waver,
          timestamp: new Date(wave.timestamp * 1000),
          message: wave.message,
        };
      });

      setAllWaves(wavesCleaned);
    } else {
      console.log("Ethereum object doesn't exist!");
    }
  } catch (error) {
    console.log(error);
  }
};

/**
 * Listen in for emitter events!
 */
useEffect(() => {
  let wavePortalContract;

  const onNewWave = (from, timestamp, message) => {
    console.log("NewWave", from, timestamp, message);
    setAllWaves(prevState => [
      ...prevState,
      {
        address: from,
        timestamp: new Date(timestamp * 1000),
        message: message,
      },
    ]);
  };

  if (window.ethereum) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
    wavePortalContract.on("NewWave", onNewWave);
  }

  return () => {
    if (wavePortalContract) {
      wavePortalContract.off("NewWave", onNewWave);
    }
  };
}, []);

  /*
  * This runs our function when the page loads.
  */
  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

  return (
    <div className="mainContainer">
      <nav>
        <div className="logo">WavePortal</div>

        <div>
          {
            !currentAccount ? (
          <button className="connectBtn" onClick={connectWallet}>
            Connect Wallet
          </button>
        ) : (
          <button className="connectBtn connected" disabled>
            Connected
          </button>
        )
          }
        </div>
        
      </nav>
        
      <div className="dataContainer">
        <div className="header">
        👋 Hey there!
        </div>

        <p className="bio">
          My name is Chizycodes and I am a frontend developer getting my hands dirty with Web3. Connect your Ethereum wallet and wave at me!
          {
          allWaves.length >= 1 ? (
            <p className="waveCount">
          You've sent <span>{allWaves.length}</span>&nbsp;wave(s)😊
            </p>
          ) : (
            ""
          )
        }
        </p>

        <form onSubmit={wave}>
          
           <textarea placeholder="Enter message"  name="message" value={message} onChange={e => setMessage(e.target.value)} required />
  
          <button className="waveButton">
            {
              mining === false ? "Wave at me" : "Waving..."
            }
          </button>
        </form>

        {allWaves.map((wave, index) => {
          return (
            <div className="history" key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px", fontSize: "14px" }}>
              <p>
              Address: {wave.address} <br/>
              Time: {wave.timestamp.toString()} <br/>
              Message: {wave.message}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  );
}

export default App
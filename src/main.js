import './style.css'
import { create } from 'ipfs-http-client'
import { newKitFromWeb3 } from '@celo/contractkit'
import Web3 from "@celo/contractkit/node_modules/web3"
import BigNumber from "bignumber.js";
import booklibraryAbi from '../contract/booklibrary.abi.json'

// erc20 decimals
const ERC20_DECIMALS = 18;

// previous address
// const BooklibraryContractAddress = "0x0D5690Bd51A71EFcED3c61F69e792a8C7C046f59";
const BooklibraryContractAddress = "0x91d505e8F9A7ccF4Ca5B2147cfB42d9BC6aD84b7"

const ipfsClient = create({
  url: 'https://ipfs.infura.io:5001/api/v0'
})

let kit, contract;
let services = [];

window.addEventListener('load', async () => {
  bookNotification("⌛ Loading...")
  await connectCeloWallet()
  await getBooks()
  bookNotificationOff()
});

const connectCeloWallet = async function () {
  if (window.celo) {
    bookNotification("⚠️ Please approve this DApp to use it.")
    try {
      await window.celo.enable()
      bookNotificationOff()

      const web3 = new Web3(window.celo)
      kit = newKitFromWeb3(web3)

      const accounts = await kit.web3.eth.getAccounts()
      kit.defaultAccount = accounts[0]

      contract = new kit.web3.eth.Contract(booklibraryAbi, BooklibraryContractAddress)
    } catch (error) {
      bookNotification(`⚠️ ${error}.`)
    }
  } else {
    bookNotification("⚠️ Please install the CeloExtensionWallet.")
  }
}

const getBooks = async function() {
  const _booksLength = await contract.methods.booksLength().call()
  const _books = []
    for (let i = 0; i < _booksLength; i++) {
    let _book = new Promise(async (resolve, reject) => {
      let p = await contract.methods.readBook(i).call()
    
      resolve({
        index: i,
        owner: p[0],
        title: p[1],
        image: p[2],
        isbn: p[3],
        date: p[4],
        summary: p[5],
        // ipfs hash of the book
        book: p[6],
        // cost of the book
        cost:   new BigNumber(p[7]),
      })
    })
    _books.push(_book)
  }
  services = await Promise.all(_books)
  renderBooks()
}


// upload file to IPFS
const uploadHelper = async (_file) => {
  try {
    const file = await ipfsClient.add(_file);
    const path = `https://ipfs.infura.io/ipfs/${file.path}`;
  
    return path;
  } catch (error) {
    console.log("Error uploading file: ", error);
    throw error;
  }
};

document
  .querySelector("#submit-book")
  .addEventListener("click", async (e) => {
    const selectedImage = document.getElementById("select-image").files[0];
    const selectedBook = document.getElementById("select-book").files[0];
    const ipfs_bookImage = await uploadHelper(selectedImage);
    const ipfs_book_doc = await uploadHelper(selectedBook);
    const cost = document.getElementById("input-cost").value
    console.log({cost})
    const bookParams = [
      document.getElementById("input-title").value,
      ipfs_bookImage,
      document.getElementById("input-isbn").value,
      document.getElementById("input-date").value,
      document.getElementById("input-summary").value,
      // the actual book from ipfs
      ipfs_book_doc,
      BigNumber(cost).shiftedBy(ERC20_DECIMALS),
    ]

    bookNotification(`⌛ Adding "${bookParams[0]}"...`)
    try {
      await contract.methods.addBook(...bookParams).send({
        from: kit.defaultAccount
      })
        bookNotification(`🎉 You successfully added "${bookParams[0]}".`)
        getBooks()
      
    } catch (error) {
      bookNotification(`⚠️ ${error}.`)
    }
  })


  // rent a book
  document
  .querySelector("#rentBook")
  .addEventListener("click", async (e) => {
  

    bookNotification(`⌛ Renting "${bookParams[0]}"...`)
    try {
      await contract.methods.addBook(...bookParams).send({
        from: kit.defaultAccount
      })
        bookNotification(`🎉 You successfully added "${bookParams[0]}".`)
        getBooks()
      
    } catch (error) {
      bookNotification(`⚠️ ${error}.`)
    }
  })


function renderBooks() {
  document.getElementById("AvailableBooks").innerHTML = ""
  services.forEach((_book) => {
    const newDiv = document.createElement("div")
    newDiv.className = "col-md-4"
    newDiv.innerHTML = bookTemplate(_book)
    document.getElementById("AvailableBooks").appendChild(newDiv)
  })
}

function bookTemplate(_book) {

  return `
    <div class="card mb-4">
      <img class="card-img-top" src="${_book.image}" alt="...">
    </div>
      <div class="card-body text-dark text-left p-4 position-relative">
        <div class="translate-middle-y position-absolute top-0">
        ${identiconTemplate(_book.user)}
        </div>
        <h2 class="card-title fs-4 fw-bold mt-2">${_book.title}</h2>
        <p class="card-text mb-1">
          ${_book.isbn}             
        </p>
        <p class="card-text mb-4" style="min-height: 82px">
          ${_book.date}             
        </p>

        <p class="card-text mb-4" style="min-height: 82px">
        ${BigNumber((_book.cost).shiftedBy(-ERC20_DECIMALS).toString()) } cUSD            
      </p>
      </div>
    </div>
  `
}


function identiconTemplate(_address) {
  const icon = blockies
    .create({
      seed: _address,
      size: 8,
      scale: 16,
    })
    .toDataURL()

  return `
  <div class="rounded-circle overflow-hidden d-inline-block border border-white border-2 shadow-sm m-0">
    <a href="https://alfajores-blockscout.celo-testnet.org/address/${_address}/transactions"
        target="_blank">
        <img src="${icon}" width="48" alt="${_address}">
    </a>
  </div>
  `
}

function bookNotification(_text) {
  document.querySelector(".alert-service").style.display = "block"
  document.querySelector("#bookNotification").textContent = _text
}

function bookNotificationOff() {
  document.querySelector(".alert-service").style.display = "none"
}
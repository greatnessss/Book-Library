// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 < 0.9.0;

contract BookLibrary {

  address internal contractOwner;

  constructor () {
    contractOwner = payable(msg.sender);
  }

  struct Book {
    address user;
    string name;
    string image;
    string isbn;
    string date;
  }

  uint public booksLength = 0;
  mapping (uint => Book) internal books;

  function addBook(
    string memory _name,
    string memory _image,
    string memory _isbn, 
    string memory _date
  ) external {
    books[booksLength] = Book(
      // tx.origin usage is not advised.
      // it refers only to the first initiator of the contract which is the owner.
      msg.sender,
      _name,
      _image,
      _isbn,
      _date
    );

    booksLength++;
  }

  function readBook(uint _index) external view returns (
    address,
    string memory, 
    string memory, 
    string memory, 
    string memory
  ) {
    Book storage book = books[_index];
    return(
      book.user,
      book.name,
      book.image,
      book.isbn,
      book.date
    );
  }

  modifier onlyOwner () {
    require(msg.sender == contractOwner, "You do not have admin rights");
    _;
  }

  function delBook(uint _index) onlyOwner() public returns(bool) {
    delete books[_index];
    return true;
  }
}
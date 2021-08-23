// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 < 0.9.0;

contract BookLibrary {

  struct Book {
    address user;
    string name;
    string image;
    string isbn;
    string date;
    string summary;
  }

  uint public booksLength = 0;
  mapping (uint => Book) internal books;

  function addBook(
    string memory _name,
    string memory _image,
    string memory _isbn, 
    string memory _date,
    string memory _summary
  ) external {
    books[booksLength] = Book(
      tx.origin,
      _name,
      _image,
      _isbn,
      _date,
      _summary
    );
    booksLength++;
  }

  function readBook(uint _index) external view returns (
    address,
    string memory, 
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
      book.date,
      book.summary
    );
  }
}
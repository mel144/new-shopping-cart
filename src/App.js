import React, { Component } from 'react';

import './App.css';
import './App.scss';

class App extends Component {
  render() {
    return (
      <div className="App">
        <main>
          <ProductTable products={this.props.products} />
        </main>
      </div>
    );
  }
}

class ProductTable extends Component {
  render() {
    const rows = [];
    let num_in_row = 4;
    let temp_row = [];
    let index = 0;
    let num_rows = 0;

    this.props.products.forEach((product) => {
      if (index < num_in_row) {
        temp_row.push(
          product
        );
        index = index + 1;
      } else {
        console.log(temp_row);
        rows.push(
          <ProductRow products_in_row={temp_row} key={rows.length}/>
        );
        index = 0;
        num_rows = num_rows + 1;
        temp_row = [];
      }
    });

    console.log(rows);

    return (
      <div className="shelf-container">
        <table>
          <tbody>{rows}</tbody>
        </table>
      </div>
    );
  }
}

class ProductRow extends Component {
  render() {
    let row = [];

    this.props.products_in_row.forEach((product) => {
      row.push(
        <ProductItem prod={product} key={product.sku}/>
      );
    });

    return (
      <tr>
        {row}
      </tr>
    );
  }
}

class ProductItem extends Component {
  render() {
    return (
      <td className="shelf-item">
        <div>{this.props.prod.title}</div>
        <div>{this.props.prod.currencyFormat}{this.props.prod.price}</div>
      </td>
    );
  }
}

export default App;

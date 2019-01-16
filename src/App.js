import React, { Component } from 'react';
import './App.scss';

class App extends Component { 
  constructor(props) {
    super(props);
    this.state = {
      cart: [],
      quantities: [],
      cart_opened: false,
    }
  }

  render() {
    return (
      <div className="App">
        <main>
          <ProductTable products={this.props.products} click={this.add_to_cart} />
        </main>
        <FloatCart cart_products={this.state.cart} quantities={this.state.quantities} remove={this.remove_from_cart}
          cart_open={this.state.cart_opened} close={this.closeFloatCart} open={this.openFloatCart} />
      </div>
    );
  }

  openFloatCart = () => {
    this.setState({ cart_opened: true } );
  };

  closeFloatCart = () => {
    this.setState({cart_opened: false} );
  };

  find_index = product => {
    let index = 0;
    let return_value = -1;
    this.state.cart.forEach((prod) => {
      if (product === prod) {
        return_value = index;
      }
      index = index + 1;
    });
    return return_value;
  }

  remove_from_cart = (product, size) => {
    let index = this.find_index(product);
    if (index !== -1) {
      let old_q = this.state.quantities[index];
      let new_q;
      if (old_q[size] === 1) {
        new_q = this.state.quantities.slice();
        let new_d = new_q[index];
        delete new_d[size]
        if (Object.keys(new_d).length === 0) {
          let new_c = this.state.cart.slice();
          new_c.splice(index, 1);
          this.setState({ cart: new_c });
        }
        this.setState({ quantities: new_q});
      } else {
        let new_q = this.state.quantities.slice();
        new_q[index][size]--;
        this.setState({ quantities: new_q, cart_opened: true });
      }
    }
  }

  add_to_cart = (product, size) => {
    let index = this.find_index(product); 
    if (index !== -1) {
      let new_q = this.state.quantities.slice();
      let old_v = 0;
      if (new_q[index].hasOwnProperty(size)) {
        new_q[index][size]++;
      } else {
        new_q[index][size] = 1;
      }
      
      if (old_v < product.availableSizes[size]) {
        this.setState({ quantities: new_q, cart_opened: true });
      }
    } else {
      let new_ = this.state.cart.concat(product);
      let new_d = {};
      new_d[size] = 1;
      let new_q = this.state.quantities.concat(new_d);
      this.setState({ cart: new_, quantities: new_q, cart_opened: true});
    }
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
        rows.push(
          <ProductRow products_in_row={temp_row} key={rows.length} click={this.props.click}/>
        );
        index = 0;
        num_rows = num_rows + 1;
        temp_row = [];
      }
    });

    return (
      <div className="product-table">
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
        <ProductItem prod={product} key={product.sku} click={this.props.click}/>
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
    let formattedPrice = formatPrice(this.props.prod.price, this.props.prod.currencyId);
    let size_options = Object.entries(this.props.prod.availableSizes).map(([s, q]) => {
      return (
        <button className="item__buy-btn" key={s} onClick={() => this.props.click(this.props.prod, s)}>{s}</button>
      );
    });

    return (
      <td className="item">
        <div className="item__thumb">
          <img src={require(`./static/products/${this.props.prod.sku}_1.jpg`)} alt={this.props.prod.SKU} title={this.props.prod.title} />
        </div>
        <p className="item__title">{this.props.prod.title}</p>
        <div className="item__price">
          <div className="val">
            <small>{this.props.prod.currencyFormat}</small>
            <b>{formattedPrice.substr(0, formattedPrice.length - 3)}</b>
            <span>{formattedPrice.substr(formattedPrice.length - 3, 3)}</span>
          </div>
        </div>
        {size_options}
      </td>
    );
  }
}

class FloatCart extends Component {
  proceedToCheckout = subtotal => {
    if (this.props.quantities.length === 0) {
      alert('Add some product in the bag!');
    } else {
      alert(
        `Checkout - Subtotal: $${formatPrice(subtotal)}`
      );
    }
  };

  render() {
    let subtotal = 0;
    let i = 0;
    this.props.cart_products.forEach((product) => {
      let quantities = this.props.quantities[i];
      Object.entries(quantities).map(([s, q]) => {
        subtotal = subtotal + product.price * q;
        return null //to suppress a warning from map
      });
      i = i + 1;
    });

    let index = -1; 
    const products = this.props.cart_products.map(p => {
      index = index + 1;
      return (
        <CartProduct product={p} removeProduct={this.props.remove} quantity={this.props.quantities[index]} key={p.id} />
      );
    });

    let classes = ['float-cart'];

    if (!!this.props.cart_open) {
      classes.push('float-cart--open');
    }

    return (
      <div className={classes.join(' ')}>
        {/* If cart open, show close (x) button */}
        {this.props.cart_open && (
          <div
            onClick={() => this.props.close()}
            className="float-cart__close-btn"
          >
            X
          </div>
        )}

        {/* If cart is closed, show bag with quantity of product and open cart action */}
        {!this.props.cart_open && (
          <span
            onClick={() => this.props.open()}
            className="bag bag--float-cart-closed"
          >
            <span className="bag__quantity">{1}</span>
          </span>
        )}

        <div className="float-cart__content">
          <div className="float-cart__header">
            <span className="bag">
              <span className="bag__quantity">{1}</span>
            </span>
            <span className="header-title">Bag</span>
          </div>

          <div className="float-cart__product-table">
            {products}
            {!products.length && (
              <p className="shelf-empty">
                Add some products in the bag <br />
                :)
              </p>
            )}
          </div>

          <div className="float-cart__footer">
            <div className="sub">SUBTOTAL</div>
            <div className="sub-price">
              <p className="sub-price__val">
                ${formatPrice(subtotal)}
              </p>
            </div>
            <div onClick={() => this.proceedToCheckout(subtotal)} className="buy-btn">
              Checkout
            </div>
          </div>
        </div>
      </div>
    );
  }
}

class CartProduct extends Component {
  state = {
    isMouseOver: false
  };

  handleMouseOver = () => {
    this.setState({ isMouseOver: true });
  };

  handleMouseOut = () => {
    this.setState({ isMouseOver: false });
  };

  render() {
    const classes = ['item'];

    if (!!this.state.isMouseOver) {
      classes.push('item--mouseover');
    }
    
    let quantities = Object.entries(this.props.quantity).map(([s, q]) => {
      return (
        <div className="quantity" id={s}>
            {s}: {q}
          <div
            className="item__del"
            onMouseOver={() => this.handleMouseOver()}
            onMouseOut={() => this.handleMouseOut()}
            onClick={() => this.props.removeProduct(this.props.product, s)}
            />
        </div>

      );
    });

    return (
      <div className={classes.join(' ')}>
        <div className="item__thumb">
          <img src={require(`./static/products/${this.props.product.sku}_2.jpg`)} alt={this.props.product.title} title={this.props.product.title}/>
        </div>
        <div className="item__details">
          <p className="title">{this.props.product.title}</p>
          <div className="desc">
            {`${this.props.product.style}`} 
            {quantities}
          </div>
        </div>
        <div className="item__price">
          <p>{`${this.props.product.currencyFormat}  ${formatPrice(this.props.product.price)}`}</p>
        </div>
        <div className="clearfix" />
      </div>
    );
  }
}

const formatPrice = (x, currency) => {
  switch (currency) {
    case 'BRL':
      return x.toFixed(2).replace('.', ',');
    default:
      return x.toFixed(2);
  }
};

export default App;

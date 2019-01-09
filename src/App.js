import React, { Component } from 'react';
import PropTypes from 'prop-types';
//import './App.css';
import './App.scss';

class App extends Component { 
  render() {
    return (
      <div className="App">
        <main>
          <ProductTable products={this.props.products} />
        </main>
        <FloatCart cartProducts={[this.props.products[3]]} />
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
    let formattedPrice = formatPrice(this.props.prod.price, this.props.prod.currencyId);

    return (
      <td className="shelf-item">
        <div className="shelf-item__thumb">
          <img src={require(`./static/products/${this.props.prod.sku}_1.jpg`)} atl={this.props.prod.title} title={this.props.prod.title} />
        </div>
        <p className="shelf-item__title">{this.props.prod.title}</p>
        <div className="shelf-item__price">
          <div className="val">
            <small>{this.props.prod.currencyFormat}</small>
            <b>{formattedPrice.substr(0, formattedPrice.length - 3)}</b>
            <span>{formattedPrice.substr(formattedPrice.length - 3, 3)}</span>
          </div>
        </div>
        <div className="shelf-item__buy-btn">Add to cart</div>
      </td>
    );
  }
}

class FloatCart extends Component {
  static propTypes = {
    loadCart: PropTypes.func.isRequired,
    updateCart: PropTypes.func.isRequired,
    cartProducts: PropTypes.array.isRequired,
    newProduct: PropTypes.object,
    removeProduct: PropTypes.func,
    productToRemove: PropTypes.object
  };

  state = {
    isOpen: true
  };

  componentWillReceiveProps(nextProps) {
    if (nextProps.newProduct !== this.props.newProduct) {
      this.addProduct(nextProps.newProduct);
    }

    if (nextProps.productToRemove !== this.props.productToRemove) {
      this.removeProduct(nextProps.productToRemove);
    }
  }

  openFloatCart = () => {
    this.setState({ isOpen: true });
  };

  closeFloatCart = () => {
    this.setState({ isOpen: false });
  };

  addProduct = product => {
    const { cartProducts, updateCart } = this.props;
    let productAlreadyInCart = false;

    cartProducts.forEach(cp => {
      if (cp.id === product.id) {
        cp.quantity += product.quantity;
        productAlreadyInCart = true;
      }
    });

    if (!productAlreadyInCart) {
      cartProducts.push(product);
    }

    updateCart(cartProducts);
    this.openFloatCart();
  };

  removeProduct = product => {
    const { cartProducts, updateCart } = this.props;

    const index = cartProducts.findIndex(p => p.id === product.id);
    if (index >= 0) {
      cartProducts.splice(index, 1);
      updateCart(cartProducts);
    }
  };

  proceedToCheckout = () => {
    const {
      totalPrice,
      productQuantity,
      currencyFormat,
      currencyId
    } = this.props.cartTotal;

    if (!productQuantity) {
      alert('Add some product in the bag!');
    } else {
      alert(
        `Checkout - Subtotal: ${currencyFormat} ${formatPrice(
          totalPrice,
          currencyId
        )}`
      );
    }
  };

  render() {
    const { cartTotal, cartProducts, removeProduct } = this.props;

    console.log(cartTotal);

    const products = cartProducts.map(p => {
      return (
        <CartProduct product={p} removeProduct={removeProduct} key={p.id} />
      );
    });

    let classes = ['float-cart'];

    if (!!this.state.isOpen) {
      classes.push('float-cart--open');
    }

    return (
      <div className={classes.join(' ')}>
        {/* If cart open, show close (x) button */}
        {this.state.isOpen && (
          <div
            onClick={() => this.closeFloatCart()}
            className="float-cart__close-btn"
          >
            X
          </div>
        )}

        {/* If cart is closed, show bag with quantity of product and open cart action */}
        {!this.state.isOpen && (
          <span
            onClick={() => this.openFloatCart()}
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

          <div className="float-cart__shelf-container">
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
                14.00
              </p>
            </div>
            <div onClick={() => this.proceedToCheckout()} className="buy-btn">
              Checkout
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  cartProducts: state.cart.products,
  newProduct: state.cart.productToAdd,
  productToRemove: state.cart.productToRemove,
  cartTotal: state.total.data
});

class CartProduct extends Component {
  static propTypes = {
    product: PropTypes.object.isRequired,
    removeProduct: PropTypes.func.isRequired
  };

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
    const { product, removeProduct } = this.props;

    const classes = ['shelf-item'];

    if (!!this.state.isMouseOver) {
      classes.push('shelf-item--mouseover');
    }

    return (
      <div className={classes.join(' ')}>
        <div
          className="shelf-item__del"
          onMouseOver={() => this.handleMouseOver()}
          onMouseOut={() => this.handleMouseOut()}
          onClick={() => removeProduct(product)}
        />
        <div className="shelf-item__thumb">
          <img src={require(`./static/products/${product.sku}_2.jpg`)} alt={product.title} title={product.title}/>
        </div>
        <div className="shelf-item__details">
          <p className="title">{product.title}</p>
          <p className="desc">
            {`${product.style}`} <br />
            Quantity: {product.quantity}
          </p>
        </div>
        <div className="shelf-item__price">
          <p>{`${product.currencyFormat}  ${formatPrice(product.price)}`}</p>
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

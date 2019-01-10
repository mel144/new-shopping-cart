import React, { Component } from 'react';
import PropTypes from 'prop-types';
//import './App.css';
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
    console.log(this.state.cart_opened);
    return (
      <div className="App">
        <main>
          <ProductTable products={this.props.products} click={this.add_to_cart} />
        </main>
        <FloatCart cart_products={this.state.cart} quantities={this.state.quantities} cart_open={this.state.cart_opened} close={this.closeFloatCart} open={this.openFloatCart} />
      </div>
    );
  }

  openFloatCart = () => {
    this.setState({ cart_opened: true } );
  };

  closeFloatCart = () => {
    this.setState({cart_opened: false} );
  };

  already_in_cart = product => {
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

  add_to_cart = product => {
    let index = this.already_in_cart(product); 
    if (index !== -1) {
      let new_q = this.state.quantities.slice();
      new_q[index] = new_q[index] + 1;
      this.setState({ quantities: new_q, cart_opened: true});
    } else {
      let new_ = this.state.cart.concat(product);
      let new_q = this.state.quantities.concat(1);
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

    return (
      <td className="item">
        <div className="item__thumb">
          <img src={require(`./static/products/${this.props.prod.sku}_1.jpg`)} atl={this.props.prod.title} title={this.props.prod.title} />
        </div>
        <p className="item__title">{this.props.prod.title}</p>
        <div className="item__price">
          <div className="val">
            <small>{this.props.prod.currencyFormat}</small>
            <b>{formattedPrice.substr(0, formattedPrice.length - 3)}</b>
            <span>{formattedPrice.substr(formattedPrice.length - 3, 3)}</span>
          </div>
        </div>
        <div className="item__buy-btn" onClick={() => this.props.click(this.props.prod)}> Add to cart</div>
      </td>
    );
  }
}

class FloatCart extends Component {
  //state = {
  //  isOpen: this.props.cart_open,
  //};
  
  removeProduct = product => {
    const { updateCart } = this.props;

    const index = this.props.cart_products.findIndex(p => p.id === product.id);
    if (index >= 0) {
      this.props.cart_products.splice(index, 1);
      updateCart(this.props.cart_products);
    }
  };

  proceedToCheckout = () => {
    const {
      totalPrice,
      productQuantity,
      currencyFormat,
      currencyId
    } = this.props.cartTotal;

    if (this.props.quantities.length === 0) {
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
    let subtotal = 0;
    this.props.cart_products.forEach((product) => {
      subtotal = subtotal + product.price;
    });

    let index = -1; 
    const products = this.props.cart_products.map(p => {
      index = index + 1;
      return (
        <CartProduct product={p} removeProduct={removeProduct} quantity={this.props.quantities[index]} key={p.id} />
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
    const { product, removeProduct, quantity } = this.props;
    const classes = ['item'];

    if (!!this.state.isMouseOver) {
      classes.push('item--mouseover');
    }

    return (
      <div className={classes.join(' ')}>
        <div
          className="item__del"
          onMouseOver={() => this.handleMouseOver()}
          onMouseOut={() => this.handleMouseOut()}
          onClick={() => removeProduct(product)}
        />
        <div className="item__thumb">
          <img src={require(`./static/products/${product.sku}_2.jpg`)} alt={product.title} title={product.title}/>
        </div>
        <div className="item__details">
          <p className="title">{product.title}</p>
          <p className="desc">
            {`${product.style}`} <br />
            Quantity: {this.props.quantity}
          </p>
        </div>
        <div className="item__price">
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

const updateCart = cart_products => dispatch => {
  let productQuantity = cart_products.reduce((sum, p) => {
    sum += p.quantity;
    return sum;
  }, 0);

  let totalPrice = cart_products.reduce((sum, p) => {
    sum += p.price * p.quantity;
    return sum;
  }, 0);

  let installments = cart_products.reduce((greater, p) => {
    greater = p.installments > greater ? p.installments : greater;
    return greater;
  }, 0);

  let cartTotal = {
    productQuantity,
    installments,
    totalPrice,
    currencyId: 'USD',
    currencyFormat: '$'
  };

  dispatch({
    type: 'UPDATE_CART',
    payload: cartTotal
  });
};

const loadCart = products => ({
  type: 'LOAD_CART',
  payload: products
});

const addProduct = product => ({
  type: 'ADD_PRODUCT',
  payload: product
});

const removeProduct = product => ({
  type: 'REMOVE_PRODUCT',
  payload: product
});


export default App;

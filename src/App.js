import React, { Component } from 'react';
import './App.scss';
import firebase from "firebase";
import StyleFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';
import 'firebase/database';

firebase.initializeApp({
  apiKey: "AIzaSyCFZ8JEI2qXwFfOLOtCSDDj-wqnVrRaZsU",
  authDomain: "new-shopping-cart-50ad0.firebaseapp.com",
  databaseURL: "https://new-shopping-cart-50ad0.firebaseio.com/",
  storageBucket: "new-shopping-cart-50ad0.appspot.com",
});

var g_user;
var product_buffer;

class App extends Component { 
  constructor(props) {
    super(props);

    firebase.database().ref('product_list').on('value',
      function (snapshot) {
        product_buffer = snapshot.val();
        console.log(snapshot.val());
        return snapshot;
      });

    console.log(product_buffer);

    this.state = {
      cart: {},
      quantities: [],
      cart_opened: false,
      products_show: [],
      all_products: product_buffer,
      filter_buttons: ["S", "M", "L", "XL"],
      filter_status: [false, false, false, false],
      isSignedIn: false,
      database: firebase.database().ref('users/default').orderByChild('1').once('value',
        function (snapshot) {
          let temp_database = [];
          snapshot.forEach((child) => {

            temp_database[child.key] = child.val();
          })

          return temp_database;
        })
    }
  }

  write_cart = () => {
    if (this.state.isSignedIn) {
      return firebase.database().ref('users/' + g_user.id + '/cart').orderByChild('1').once('value',
        function (snapshot) {
          let temp_database = [];
          snapshot.forEach((child) => {

            temp_database[child.key] = child.val();
          })

          return temp_database;
        });
    } else {
      return [];
    }
  }

  uiConfig = {
    singInFlow: "popup",
    signInOptions: [
      firebase.auth.GoogleAuthProvider.PROVIDER_ID
    ],
    callbacks: {
      signInSuccessWithAuthResult: () => false
    }
  };

  componentDidMount = () => {
    firebase.auth().onAuthStateChanged(user => {
      this.setState({ isSignedIn: !!user })
      console.log(user);
      g_user = user;
      let temp_database = [];
      
      if (this.state.isSignedIn) {
        let new_string = 'users/' + user.uid + '/cart';
        
        firebase.database().ref(new_string).orderByChild('1').once('value',
          function (snapshot) {
            snapshot.forEach((child) => {
              temp_database[child.key] = child.val();
            })
          });

        if (temp_database.length == 0) {
          let id = user.uid;
          
          let temp = this.state.cart;
          if (temp.length == 0) {
            firebase.database().ref('users/' + id).set({
              "cart": null
            });
          } else {
            firebase.database().ref('users/' + id + '/cart').set({
              temp
            },
              function (error) {
                if (error) {
                  console.log("fail");
                } else {
                  console.log("success");
                }
              });
          }
          console.log(user.uid);
          console.log(this.state.cart);
        }

      } else {
        this.setState({
          cart: temp_database
        });
      }
    })
  };
  
  render() {
    let shown = [];

    this.props.products.forEach((prod) => {
      if (this.should_show(prod)) {
        shown.push(prod);
      }
    });

    console.log(this.props.all_products);

     return (

      <div className="App">
         <main>
           {this.state.isSignedIn ? (
             <div className="authentication">
               <div>Welcome {firebase.auth().currentUser.displayName}</div>
               <button onClick={() => firebase.auth().signOut()}>Sign out</button>
            </div>
           ) : (
                 <StyleFirebaseAuth
                   uiConfig={this.uiConfig}
                   firebaseAuth={firebase.auth()}
                   />
               )
           }
          <Filter click={this.toggle_button} filter_buttons={this.state.filter_buttons} status={this.state.filter_status} />
          <ProductTable products={shown} click={this.add_to_cart} />
         </main>
         <FloatCart all_products={this.state.all_products} cart_products={this.state.cart} remove={this.remove_from_cart}
          cart_open={this.state.cart_opened} close={this.closeFloatCart} open={this.openFloatCart} />
      </div>
    );
  }

  toggle_button = s => {
    let index = 0;
    let found = -1;
    this.state.filter_buttons.forEach((name) => {
      if (name === s) {
        found = index;
      }
      index = index + 1;
    });
    let new_status = this.state.filter_status.slice();
    new_status[found] = !new_status[found];

    this.setState({
      filter_status: new_status
    });
  }

  should_show = product => {
      let index = 0;
    let found_true = false;
    let true_indicies = [];

    this.state.filter_status.forEach((b) => {
      if (b) {
        found_true = true;
        true_indicies.push(index);
      }
      index = index + 1;
    });

    if (!found_true) {
      return true;
    }

    let return_val = false;
    this.state.filter_buttons.forEach((size) => {
      let available = product["availableSizes"];
      true_indicies.forEach((i) => {
        if (available[this.state.filter_buttons[i]] > 0) {
          return_val = true;
        }
      });
    });
    
    return return_val;
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

  update_firebase_cart = () => {
    if (this.state.isSignedIn) {
      let temp = this.state.cart;
      firebase.database().ref('users/' + g_user.id + '/cart').set({
        temp
      },
        function (error) {
          if (error) {
            console.log("fail");
          } else {
            console.log("success");
          }
        });
    }
  };

  add_to_cart = (product, size) => {
    let new_q = this.state.quantities.slice();
    if (product.id in new_q) {
      if (size in new_q[product.id]) {
        if (new_q[product.id][size] < product["availableSizes"][size]) {
          new_q[product.id][size]++;
        } else {
          alert("Sorry, that's all we have in that size!");
        }
      } else {
        new_q[product.id][size] = 1;
      }
      
      this.setState({ cart: new_q, cart_opened: true });
    } else {
      let new_d = {};
      new_d[size] = 1;
      new_q[product.id] = new_d;
      this.setState({ cart: new_q, cart_opened: true});
    }

    this.update_firebase_cart();
  }
}

class Filter extends Component {
  render() {
    const buttons = [];
    let index = 0;
    this.props.filter_buttons.forEach((s) => {
      if (this.props.status[index]) {
        buttons.push(<button key={index} className="filter-button selected" onClick={() => this.props.click(s)}> {s} </button>)
      } else {
        buttons.push(<button key={index} className="filter-button" onClick={() => this.props.click(s)}>{s}</button>)
      }
      index = index + 1;
    });

    return (
      <div className="filter">
        Sizes:
        {buttons}
      </div>
      )
  }
}

class ProductTable extends Component {
  render() {
    const items = [];

    this.props.products.forEach((product) => {
      items.push(
        <ProductItem prod={product} key={product.sku} click={this.props.click} />
      );
    });

    return (
      <div className="product-table">
          <div>{items}</div>
      </div>
    );
  }
}

class ProductItem extends Component {
  render() {
    let formattedPrice = formatPrice(this.props.prod.price, this.props.prod.currencyId);
    let size_options = Object.entries(this.props.prod.availableSizes).map(([s, q]) => {
      if (q > 0) {
        return (
          <button className="item__buy-btn" key={s} onClick={() => this.props.click(this.props.prod, s)}>{s}</button>
        );
      } else {
        return 
      }
    });

    return (
      <div className="item">
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
      </div>
    );
  }
}

class FloatCart extends Component {
  proceedToCheckout = subtotal => {
    if (this.props.cart.length === 0) {
      alert('Add some product in the bag!');
    } else {
      alert(
        `Checkout - Subtotal: $${formatPrice(subtotal)}`
      );
    }
  };

  find_product = (i) => {
    let ret_product = null;
    console.log(this.props.all_products);
    Object.entries(this.props.all_products).map((product) => {
      if (product.id === i) {
        ret_product = product;
      }
    });

    return ret_product;
  };

  render() {
    let subtotal = 0;
    const products = Object.entries(this.props.cart_products).map(([product_id, quantities]) => {
      let product = this.find_product(product_id);
      if (product !== null) {
        Object.entries(quantities).map(([s, q]) => {
          subtotal = subtotal + product.price * q;
          return null; //to suppress a warning from map
        });
      }
      return <CartProduct product={product} removeProduct={this.props.remove} quantity={quantities} key={product_id} />;
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
        <div className="quantity" id={s} key={s}>
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
          add me back
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

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

var g_user_id;

class App extends Component { 
  constructor(props) {
    super(props);

    this.state = {
      cart: {},
      quantities: [],
      cart_opened: false,
      products_show: [],
      all_products: [],
      filter_buttons: ["S", "M", "L", "XL"],
      filter_status: [false, false, false, false],
      isSignedIn: false
    };
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
      let all_products = [];
      firebase.database().ref('product_list/').orderByChild('0').on('value', snapshot => {
        
        all_products = snapshot.val();
        if (this.state.isSignedIn){
          let cart = this.state.cart;
          let alertString = "I'm so sorry! We're out of stock of some items from your shopping cart. They have been removed. Check our site later for more availabilities!";
          let removedItems = false;

          Object.entries(all_products).map((product, index) => {
            if (cart.hasOwnProperty(index)){
              Object.entries(product[1]["availableSizes"]).map((size, quantity) => {
                if (cart !== undefined && cart.hasOwnProperty(index) && cart[index].hasOwnProperty(size[0])){
                  if (size[1] < cart[index][size[0]]){
                    removedItems = true;
                    if (size[1] === 0){
                      delete cart[index][size[0]];
                      if (Object.entries(cart[index]).length === 0){
                        delete cart[index];
                      }
                    } else {
                      cart[index][size[0]] = size[1];
                    }
                  }
                  this.update_firebase_cart();
                }
                return null;
              });
            }
            return null;
          });

          if (removedItems){
            window.alert(alertString);
          }
          this.setState({
            cart: cart
          });
        }
        
        this.setState({
          all_products: snapshot.val() 
        });
      },
        function (error) {
          if (error) {
            console.log(error);
          } else {
            console.log("Successfully loaded all products");
          }
        });
      
      if (!!user) {
        console.log(user);
        g_user_id = user.uid;
        let new_string = 'users/' + user.uid + '/cart';

        firebase.database().ref(new_string).orderByChild('1').once('value', snapshot => {

          if (snapshot.val() === null) {
              firebase.database().ref('users/' + g_user_id).set({
                "cart": "empty"
              },
                function (error) {
                  if (error) {
                    console.log("failed initializing cart");
                  } else {
                    console.log("success initializing cart");
                  }
                });

          } else if (snapshot.val() === "empty") {
            console.log("their cart is empty");
          } else {            
            let cart = snapshot.val();
            let alertString = "I'm so sorry! We're out of stock of some items from your shopping cart. They have been removed. Check our site later for more availabilities!";
            let removedItems = false;

            Object.entries(all_products).map((product, index) => {
              if (cart.hasOwnProperty(index)){
                Object.entries(product[1]["availableSizes"]).map((size, quantity) => {
                  if (cart[index].hasOwnProperty(size[0])){
                    if (size[1] < cart[index][size[0]]){
                      removedItems = true;
                      if (size[1] === 0){
                        delete cart[index][size[0]];
                        if (cart[index].size === 0){
                          delete cart[index];
                        }
                      } else {
                        cart[index][size[0]] = size[1];
                      }
                    }
                    this.update_firebase_cart();
                  }
                  return null;
                });
              }
              return null;
            });

            if (removedItems){
              window.alert(alertString);
            }
            this.setState({
              cart: cart
            });
          }
        });
      }

      this.setState({
        isSignedIn: !!user
      });
    })
  };

  render() {
    let shown = [];

    Object.entries(this.state.all_products).map(([index, prod]) => {
      if (this.should_show(prod)) {
        shown.push(prod);
      }
      return null; //To suppress warning
    });

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
           <ProductTable products={shown} click={this.add_to_cart} size_order={this.state.filter_buttons} />
         </main>
         <FloatCart all_products={this.state.all_products} cart_products={this.state.cart} execute_checkout={this.execute_checkout} remove = { this.remove_from_cart }
           cart_open={this.state.cart_opened} close={this.closeFloatCart} open={this.openFloatCart} size_order={this.state.filter_buttons} />
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

  execute_checkout = () => {
    let all_prod_copy = this.state.all_products;
    Object.entries(this.state.cart).map(([prod_index, sizes]) => {
      Object.entries(sizes).map(([s, q]) => {
        let before = all_prod_copy[prod_index]["availableSizes"][s];
        all_prod_copy[prod_index]["availableSizes"][s] = before - q;
        let iter = 0;
        for (iter = 0; iter < q; iter++) {
          this.remove_from_cart(null, s, prod_index);
        }
        return null;
      });
      return null;
    });

    this.setState({
      all_products: all_prod_copy,
      cart_open: false
    });
    this.update_firebase_products();
    this.update_firebase_cart();
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

  remove_from_cart = (product, size, i) => {
    let new_q = this.state.cart;
    if (new_q[i][size] === 1) {
      if (Object.keys(new_q[i]).length === 1) {
        delete new_q[i];
      } else {
        delete new_q[i][size];
      }
    } else {
      new_q[i][size]--;
    }

    this.setState({
      cart_open: true
    });
    this.update_firebase_cart();
  }

  update_firebase_products = () => {
    if (this.state.isSignedIn) {
      let product_list = this.state.all_products;
      firebase.database().ref('/').set({
        product_list
      },
        function(error) {
          if(error) {
            console.log("Failed to update firebase products");
          } else {
            console.log("Success updating firebase products");
          }
        });
    }
  };

  update_firebase_cart = () => {
    if (this.state.isSignedIn) {
      let cart = this.state.cart;
      if (cart.length === 0) {
        firebase.database().ref('users/' + g_user_id).set({
          cart: "empty"
        },
          function (error) {
            if (error) {
              console.log("fail updating firebase cart");
            } else {
              console.log("success updating firebase cart");
            }
          });
      } else {
        firebase.database().ref('users/' + g_user_id).set({
          cart
        },
          function (error) {
            if (error) {
              console.log("fail updating firebase cart");
            } else {
              console.log("success updating firebase cart");
            }
          });
      }
    }
  };

  add_to_cart = (product, size, index) => {
    let new_q = this.state.cart;
    if (index in new_q) {
      if (size in new_q[index]) {
        if (new_q[index][size] < product["availableSizes"][size]) {
          new_q[index][size]++;
        } else {
          alert("Sorry, that's all we have in that size!");
        }
      } else {
        new_q[index][size] = 1;
      }
    } else {
      let new_d = {};
      new_d[size] = 1;
      new_q[index] = new_d;
    }
    this.setState({ cart_opened: true });
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

    Object.entries(this.props.products).map(([index, product]) => {
      items.push(
        <ProductItem index={index} prod={product} key={product.sku} click={this.props.click} size_order={this.props.size_order} />
      );
      return null; //To suppress warning
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

    let size_options = Object.entries(this.props.size_order).map(([index,size]) => {
      if (this.props.prod.availableSizes[size] > 0) {
        return (
          <button className="item__buy-btn" key={size} onClick={() => this.props.click(this.props.prod, size, this.props.index)}>{size}</button>
        );
      } else {
        return null;
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
    if (this.props.cart_products.length === 0) {
      alert('Add some product in the bag!');
    } else {
      var ret_val = window.confirm(
        `Checkout - Subtotal: $${formatPrice(subtotal)}`
      );

      if (ret_val) {
        this.props.execute_checkout();
      }
    }
  };

  find_product = (i) => {
    let ret_product = null;
    
    Object.entries(this.props.all_products).map(([id, product]) => {
      if (id === i) {
        ret_product = product;
      }
      return null;
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
      return <CartProduct product={product} index={product_id} removeProduct={this.props.remove} quantity={quantities}
        key={product_id} size_order={this.props.size_order} />;
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
    
    let quantities = Object.entries(this.props.size_order).map(([i, s]) => {
      if (this.props.quantity[s] > 0) {
        return (
          <div className="quantity" id={s} key={s}>
            {s}: {this.props.quantity[s]}
            <div
              className="item__del"
              onMouseOver={() => this.handleMouseOver()}
              onMouseOut={() => this.handleMouseOut()}
              onClick={() => this.props.removeProduct(this.props.product, s, this.props.index)}
            />
          </div>);
      } else {
        return null;
      }
    });

    return (
      <div className={classes.join(' ')}>
        <div className="item__thumb">
          <img src={require(`./static/products/${this.props.product.sku}_2.jpg`)} alt={this.props.product.title} title={this.props.product.title} />
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

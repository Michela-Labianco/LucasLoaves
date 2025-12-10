const express = require('express');
//import the express framework to handle server routes and middleware
const mongoose = require('mongoose');
//connect to mongoose and interact with database
const path = require('path');
//node.js buil-in module to handel file paths correctly across operating systems

const multer = require('multer');
const upload = multer({dest: 'uploads/'});
//to save uploaded files into a local folder called uploads/ 
//in the root directory of the project -> same folder where app.js file likely lives.


require('dotenv').config({ path: './file.env' });
//loads environment variables from a file called file.env

const app = express();
//create an instance of express application

//import the package
const session = require('express-session');
//which allows the Express app to create and manage user sessions.

//import the package
const MongoStore = require('connect-mongo');

//MODELS
//export them from model.js
let Contact = require('./models/contact.model').Contact;
let JobApplication = require('./models/jobapp.model').JobApplication;
//they represent the structure of the data


// Middleware
app.use(express.urlencoded({ extended: true })); // For parsing data from POST request (forms)
app.use(express.static(path.join(__dirname, 'public')));
//serves static files from the public folder 
//so /public/style.css become 


// Set view engine
app.set('view engine', 'ejs');
//to tell express to use ejs as the template engine -> allow to render .ejs files from views/ folder

app.set('views', path.join(__dirname, 'views')); //it explicity sets the path where EJS template are located
//__dirname is a built-in variable in Node.js that gives the absolute path of the directory containing the current JavaScript file

app.use(express.json()); // to parse JSON data sent in POST requests (useful for AJAX requests)

  
// when true ->> saveUninitialized: true //Save new sessions to the store even if they haven't been modified yet.
app.use(session({
  secret: process.env.SESSION_SECRET, //set up a session management using a secret key
  resave: false, //Don't save the session back to the store if it hasn't changed.
  saveUninitialized: false, // only store sessions that are used
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI, // MongoDB Atlas URI
    ttl: 14 * 24 * 60 * 60 // sessions last for 14 days
  })
}));


// Connect to MongoDB (database)
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));


// Routes
app.get('/', (req, res) => {
  res.render('home'); //refers to the name of a view file (typically an HTML template) that the server will render and send to the client.
});

app.get('/contact', async (req, res) => {
  res.render('contact');
});

// Handle form submission from contact page
app.post('/contact', async (req, res) => {
  try {
    await Contact.create(req.body);
    res.render('thankyou', {
      message: "Thank you for contacting us,<br>we'll get back to you soon."
    });
    //render thank you.ejs after successful form submission
  } catch (err) {
    console.error(err);
    res.status(500).send('Something went wrong');
  }
});

//show the job application form
app.get('/careers' , (req, res) => {
  res.render('careers');
})

app.post('/careers', upload.fields([
  { name: 'resume' },
  { name: 'coverLetter' }]), async (req, res) => {
  try {
    const jobData = {
      jobTitle: req.body.jobTitle, // comes from regular form field
      resume: req.files.resume?.[0]?.path, // multer stores files in req.files
      coverLetter: req.files.coverLetter?.[0]?.path
    };
    await JobApplication.create(jobData);
    res.render('thankyou', {
      message: "Thank you for applying to join our team.<br>We'll review your application shortly."
    });
    //render thank you.ejs after successful form submission
  } catch (err) {
    console.error(err);
    res.status(500).send('Something went wrong');
  }
});

// Your routes here
app.get('/online-orders', (req, res) => {
  res.render('online_orders');
  //Express uses res.render() to load view templates (like .ejs files), 
  // and it treats the dot (.) as a path separator, not just part of the name.
  //changes to _
});

//show current shoppng cart contents stored in session and calculates total price for all items
app.get('/cart', (req, res) => {
  const cart = req.session.cart || [];

  let total = 0;
  cart.forEach(item => {
    if(item.price){
      const priceNum = parseFloat(item.price);
      total += priceNum * item.quantity;
    }
  });

  res.render('cart', { cart, total });
});

//to send the cart data as JSON
//access and return that data via the GET /api/cart endpoint.
app.get('/api/cart', (req, res) => {
  res.json({ cart: req.session.cart || [] }); //store cart info
});
//It responds with the current cart data stored in the session.
// If req.session.cart exists -> it returns that array.
// If not -> it returns an empty array ([]), so the frontend still gets a valid response.

app.post('/thankyou', (req, res) => {
  try {
    req.session.cart = []; // clear cart after order is placed    
    res.render('thankyou', {
      message: "Your order has been processed!<br>You'll receive confirmation as soon as it's been shipped!"
    });
    //render thank you.ejs after successful form submission
  } catch (err) {
    console.error(err);
    res.status(500).send('Something went wrong');
  }
});

app.post('/add-to-cart', (req, res) => {
  //destructuring -> it extracts data from the request body
  //because these are the product details sent from the client (e.g., when a user clicks "Add to Cart").
  const{id, title, imageURL, text, price} = req.body;
  //if not created initialize the cart
  if(!req.session.cart){
    req.session.cart = []; //empty array
  }
  //to make sure that the user has its own cart stored in the session
  const existing = req.session.cart.find(item => item.id === id);
  
  // it looks for an item with the same id already in the cart 
  // and increase the quantity by 1
  if (existing) {
    existing.quantity += 1;
  } else {
    //to adds a new item to the cart array stored in the user's session
    req.session.cart.push({
      id,
      title,
      imageURL,
      text,
      price: parseFloat(price),
      quantity: 1 //initial quantity set to 1
    });
  }

  res.json({ cart: req.session.cart });
})

//clears all items from the cart and redirects user to the cart page
app.post('/clear-cart', (req, res) => {
  req.session.cart = [];
  res.redirect('/cart');
});

//add if(!id || quantity === undefined) to avoid unexpected bugs and prevents the server from crashing
// useful in production apps where user input can’t be trusted
app.post('/update-cart', (req, res) => {
  try {
    const { id, quantity } = req.body;
    if (!id || quantity === undefined) {
      return res.status(400).json({ error: 'Invalid data' });
    }

    //Attempt to retrieve the cart object from the current user's session (req.session.cart).
    //If it doesn't exist initialize it as an empty array [].
    let cart = req.session.cart || [];

    //update the quantity of a specific item in the cart and if quantity 0 or less remove the item completely
    if (Number(quantity) <= 0) {
      cart = cart.filter(item => item.id !== id);
    } else {
      const item = cart.find(i => i.id === id);
      if (item) {
        item.quantity = Number(quantity);
      }
    }

    req.session.cart = cart;
    res.json({ cart });
  } catch (error) {
    console.error('Error in /update-cart:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


//start server on a port 3000 or a port specified in environment variables
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});

//!!!!!!!!!!!!!!!!!
//had to write in the terminal: export NODE_ENV=development 
//so Locally: Your app starts an HTTPS server with your self-signed certs.
//And on Render: Your app starts a plain HTTP server; Render handles HTTPS outside your app.
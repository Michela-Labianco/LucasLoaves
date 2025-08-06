document.addEventListener('DOMContentLoaded', function () {
const page = document.body.dataset.page; //get the data-page attribute
//it allows JavaScript to know which page it's currently running on

  // Only initialize map if #map element exists
  const mapElement = document.getElementById('map');  
  if (mapElement){
    //create the map using leaflet library (L)
    const map = L.map('map' ,{
        minZoom: 13, //preventing zooming too far out
        maxZoom: 18, // limit how far in they can zoom
        worldCopyJump: false,  //disaple wrapping 
        dragging: true //disable dragging initially (when landing on the page)
    }).setView([-33.8845, 151.2110], 17);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors', //copyright
      noWrap: true //to prevents the map from horizontally repeating tiles beyond the standard longitude range 
    }).addTo(map);

    //create an object so you can show a little message on the marker when over on it
    const position = {
      name: "Luca's Loaves",
      coords: [-33.8845, 151.2110],
      description: "128 Chalmers St, Surry Hills NSW 2010",
    }

    //add the marker on the map
    const marker = L.marker(position.coords).addTo(map);
    //add a pop to the marker ( attach a popup window )
    marker.bindPopup(`<strong>${position.name}</strong><br>${position.description}`);

    //show popup on over
    marker.on('mouseover', function() {
        this.openPopup();
    });

    //close pop up when out
    marker.on('mouseout', function(){
        this.closePopup();
    })
  }

  //job modal
  const jobModal = document.getElementById('jobModal');
  const openJobButtons = document.querySelectorAll('.open-job-modal');
  const closeJobButton = document.querySelector('.close-job-modal');
  
  //if we are in the jobs page
  if (page === 'jobs'){
    //and these elements exists then run the logic
    if (jobModal && closeJobButton && openJobButtons.length > 0) {
      openJobButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          jobModal.style.display = 'block';

          const jobTitle = btn.closest('.job-description')?.querySelector('.job-title')?.textContent;
          if (jobTitle) {
            jobModal.querySelector('input[name="jobTitle"]').value = jobTitle;
          }
        });
      });

      closeJobButton.addEventListener('click', () => {
        jobModal.style.display = 'none';
      });

      window.addEventListener('click', (e) => {
        if (e.target === jobModal) {
          jobModal.style.display = 'none';
        }
      });
    }
  }
  

  //contact modal 
  const openFormLink = document.getElementById('openFormLink');
  const modal = document.getElementById('contactModal');
  const closeButton = document.querySelector('.close-button');

  //to check if the 3 elements exists on the page
  if(openFormLink && modal && closeButton){ //so if they are all true
    openFormLink.addEventListener('click', function (e) {
      e.preventDefault(); //stop the link from going anywhere
      modal.style.display = 'block'; //show the modal
    });

    closeButton.addEventListener('click', function () {
      modal.style.display = 'none'; //hide the modal
    });

    // Close when clicking outside the modal content
    window.addEventListener('click', function (e) {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  }

  
  //switch to full heart when clicked and to empty when clicked again
  const hearts = document.querySelectorAll('.heart');
  //finds all hearts icons
  if(hearts.length > 0){ //if greater than -> if it exists
    hearts.forEach(heart => { //for each one add an event listener
      heart.addEventListener('click', function () {
        heart.classList.toggle('fa-solid');
        heart.classList.toggle('fa-regular');

        // update title
        if (heart.classList.contains('fa-solid')) {
          heart.title = 'Added to favourites';
          console.log('added');
        } else {
          heart.title = 'Add to favourites';
        }
      });
    });
  }


  //modify quantity in the button and the navbar cart

  //to keep track of all items in your cart
  let totalCartCount = 0; //initial value of 0
  
  fetch('/api/cart')
  .then(res => res.json())
  .then(data => {
    const cart = data.cart || [];
    //to create a Map object named cartMap from an array called cart.
    const cartMap = new Map(cart.map(i=>[i.id, i]));
    //.map() is a method that creates a new array by transforming each element of an existing array using a function you provide.

    cart.forEach(item => {
      const container = document.querySelector(`.item-container[data-id="${item.id}"]`);
      if (!container) return;

      const button = container.querySelector('.cart-btn');
      if (!button) return;

      transformToCartControls(button, item);

      if (page === 'cart') {
        const h3 = container.querySelector('h3');
        const [titleOnly] = h3.textContent.split(' - ');
        h3.textContent = `${titleOnly} - ${item.quantity} selected`;
      }
      totalCartCount += item.quantity;
    })
    window.existingCartMap = cartMap; //store cartMap globally so handleInitialClick can use it
    updateNavbarCart();

    //updateCartTotal() depends on DOM elements like cartTotalEl which don’t exist unless you're on the cart page. 
    //so it's best to call updateCartTotal() only when on the cart page.
    if (page === 'cart') {
      updateCartTotal();
    }
  })
  .catch(err => console.error('Error restoring cart:', err));



  //get all the buttons that can add items to the cart
  const cartBtns = document.querySelectorAll('.cart-btn');
  //get the cart icon in the navbar
  const navBarCart = document.querySelector('.navbar-cart');


  //ensure cartCountBadge is re-used correctly or recreated if not found:
  let cartCountBadge = navBarCart.querySelector('.cart-count');
  if (!cartCountBadge) {
    cartCountBadge = document.createElement('span');
    cartCountBadge.classList.add('cart-count');
    navBarCart.appendChild(cartCountBadge);
  }

  //function to update the number badge in the navbar
  function updateNavbarCart() {
    if (totalCartCount > 0) { //if at least one item is present
      cartCountBadge.textContent = totalCartCount; //show how many items
      cartCountBadge.style.opacity = '1'; //make it visible
    } else {
      navBarCart.style.opacity = '1'; //keep cart icon visible
      cartCountBadge.style.opacity = '0'; //hide it if empty
    }
  }

  //to keep this logic into a fuction
  function transformToCartControls(button, item){
    //set some styles
    button.innerHTML = '';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.gap = '0.2rem';

    //create minus button
    const decreaseBtn = document.createElement('i');
    decreaseBtn.classList.add('fa-solid', 'fa-minus');
    decreaseBtn.style.marginRight = '0.8rem';

    //create the number that shows quantity
    const quantity = document.createElement('span');
    quantity.textContent = item.quantity !== undefined ? item.quantity : 1; //to show the real quantity from the cart

    quantity.style.fontSize = '1.8rem';
    quantity.style.minWidth = '1ch'; //so it doesn't shrink too small when the number is a single digit
    quantity.style.textAlign = 'center';

    //create plus button
    const increaseBtn = document.createElement('i');
    increaseBtn.classList.add('fa-solid', 'fa-plus');
    increaseBtn.style.marginLeft = '0.8rem';

    //add them to the button
    button.appendChild(decreaseBtn);
    button.appendChild(quantity);
    button.appendChild(increaseBtn);

    //when the + button is clicked 
    increaseBtn.addEventListener('click', function (e) {
      e.stopPropagation(); //prevent the button click from affecting the parent button

      const newQuantity = parseInt(quantity.textContent) + 1;
      quantity.textContent = newQuantity;
      //if we are on cart page -> global variable page declared on the second line
      if(page === 'cart'){
        //update title to show how many selected, this way doesn't trigger on the online-orders page, due to same class names
        const h3 = button.closest('.item-container').querySelector('h3');
        //[] -> array destructuring
        const [titleOnly] = h3.textContent.split(' - '); //separate title from quantity
        //array created -> h3.textContent.split(' - ')
        //Take the first element of the array on the right, and assign it to the constant variable titleOnly.
        h3.textContent = `${titleOnly} - ${newQuantity} selected`;
      }

      totalCartCount += 1;
      updateNavbarCart();

      updateCartQuantity(item.id, newQuantity); //to send the new quantity to the server --> update backend
      updateCartTotal();
    });

    //when the - button is clicked
    decreaseBtn.addEventListener('click', function (e) {
      e.stopPropagation(); //same here

      const current = parseInt(quantity.textContent); //read the current quantity
      if (current > 1) { //if greater than 1 we reduce it
        const newQuantity = current - 1; //decrease it by 1
        quantity.textContent = newQuantity; //update screen
        if(page === 'cart'){
          const h3 = button.closest('.item-container').querySelector('h3');
          const [titleOnly] = h3.textContent.split(' - '); //separate title from quantity
          h3.textContent = `${titleOnly} - ${newQuantity} selected`;
        }

        totalCartCount -= 1; //decrease the global cart item count
        updateNavbarCart(); //refresh the icon in the navbar to reflect the new total count
        updateCartQuantity(item.id, newQuantity); //to send the new quantity to the server
        updateCartTotal(); //recalculate and update the cart's total price
        checkCartEmpty(); //and here where totals are less than 1

      } else {
        //if quantity reaches 0 -> reset button to original state with cart icon
        button.innerHTML = '';
        const cartIcon = document.createElement('i');
        cartIcon.classList.add('fa-solid', 'fa-cart-shopping');
        button.appendChild(cartIcon);

        if(page === 'cart'){
          const h3 = button.closest('.item-container').querySelector('h3');
          const [titleOnly] = h3.textContent.split(' - '); //this -> .split(' - ') return an array
          //where at each - the string is divided into substrings
          //[titleOnly] -> means : take the first element of the array on the right and assign it to the constant variable titleOnly
          //shorthand for:
          //const parts = h3.textContent.split(' - ');
          // const titleOnly = parts[0];
          h3.textContent = `${titleOnly}`; //update the title
        }

        button.addEventListener('click', handleInitialClick);

        totalCartCount -= 1; //decrease the global cart item count
        updateNavbarCart(); //refresh the cart icon in the navbar to reflect the new total count
        updateCartQuantity(item.id, 0); //Tell the backend this item now has quantity 0
        updateCartTotal(); //refresh the cart total
      }
    })
  }
  
  function handleInitialClick() {
    const existing = this.querySelector('span');
    if(existing) return; //prevent duplicate initialization

    const icon = this.querySelector('.fa-cart-shopping');
    if (icon) icon.remove(); //remove the icon inside the button

    //this refers to the button that was clicked -> cart-btn
    const item = {
      //so this.closest('.item-container') finds the surronding .item-container div
      //and from the container it grabs the tags element
      id: this.closest('.item-container').dataset.id,
      title: this.closest('.item-container').querySelector('h3').textContent,
      imageURL: this.closest('.item-container').querySelector('img').src,
      text: this.closest('.item-container').querySelectorAll('p')[0].textContent,
      price: parseFloat(this.closest('.item-container').dataset.price),
    };

    //to set the correct starting quantity for the item based on the already loaded cart cata from the beckend
    const existingItem = window.existingCartMap?.get(item.id);
    item.quantity = existingItem ? existingItem.quantity + 1 : 1;

    //send item to server and to add to cart
    addToCart(item);

    //to remove the click listener from the button after it's been clicked once.
    this.removeEventListener('click', handleInitialClick);
    
    //increade the total cart by 1
    totalCartCount += 1;
    //update the badge to show new total
    updateNavbarCart();
    updateCartTotal();
    transformToCartControls(this, item)
  };

  //go through each cart button 
  cartBtns.forEach(button => {
    //add an event listener for when is clicked the first time
    button.addEventListener('click', handleInitialClick);
  })


  //add to cart function with JSON
  function addToCart(item) {
    fetch('/add-to-cart', { //fetch sends data to the server
      method: 'POST', //to send information
      headers: { 'Content-Type': 'application/json' }, //converted to JSON so the server can understand it
      body: JSON.stringify(item)
    })
    .then(res => res.json()) //we wait for a response from the server
    .then(data => data)
    .catch(err => console.error('Error adding item:', err));
  }
  
  //to send the updated quantity to the server
  function updateCartQuantity(id, quantity) {
    fetch('/update-cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, quantity })
    });
  }

  //check if the cart is empty
  function checkCartEmpty() {
    const checkoutBtn = document.querySelector('.checkout-btn');
    const items = document.querySelectorAll('.item-container');
    const cartSection = document.querySelector('.cart-section');
    const existTitle = document.querySelector('.cart-h1');

    // If either the checkout button or cart section is missing, stop the function early
    if (!checkoutBtn || !cartSection) return;

    //check if the cart is empty
    if (items.length === 0) {
      checkoutBtn.style.display = 'none';
      if (existTitle) existTitle.style.display = 'none'; //hide the existing cart if existing 

      // Check if empty message exists, else create it
      let emptyTitle = document.querySelector('.empty-cart-title');
      if (!emptyTitle) {
        emptyTitle = document.createElement('h1');
        emptyTitle.classList.add('empty-cart-title');
        emptyTitle.textContent = 'Your Cart is empty';
        cartSection.insertBefore(emptyTitle, cartSection.firstChild);
      }
      emptyTitle.style.display = 'block';

    } else {
      checkoutBtn.style.display = 'inline-block';
      //show the original cart title if exists
      if (existTitle) {
        existTitle.style.display = 'block';
      }

      //try to find the empty-cart-title
      const emptyTitle = document.querySelector('.empty-cart-title');
      //We repeat this line because the first declaration is inside the if (items.length === 0) block, 
      // so it only exists inside that block — it's block-scoped.
      if (emptyTitle) { //if exists hide it
        emptyTitle.style.display = 'none';
      }
    }
  }


  function updateCartTotal() {
  // Select all item containers
    const items = document.querySelectorAll('.item-container');
    let total = 0;

    items.forEach(item => {
      const price = parseFloat(item.dataset.price);
      // Parse quantity from the h3 text, e.g. "Item Name - 3 selected"
      const quantityText = item.querySelector('h3').textContent;
      const quantityMatch = quantityText.match(/- (\d+) selected/);
      const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 0; //ternary operator and parseInt to extract and convert a number from a regex match result
      //match[0] is the entire match (what the regex matched overall). -> Full text that the regex matched
      // match[1] is the first capturing group (inside ()) -> makes the code more future-proof, because it's tied directly to the capturing group.
      
      total += price * quantity;
    });

    // Update the total element text with 2 decimals
    const cartTotalEl = document.getElementById('cartTotal');
    if (cartTotalEl) {
      cartTotalEl.textContent = `Total: $${total.toFixed(2)}`;
    }
  }
  
  //to remove items
  const trashBtns = document.querySelectorAll('.trash-btn');
  trashBtns.forEach(trashBtn => { //find all trash icons on the page
    trashBtn.addEventListener('click', function () {
      const itemContainer = this.closest('.item-container');
      const id = itemContainer.dataset.id;
      const price = parseFloat(itemContainer.dataset.price);

      const quantityText = itemContainer.querySelector('h3');
      
      // Extract title and quantity from text content (e.g., "Bread - 2 selected")
      const [rawTitle, quantityPart] = quantityText.textContent.split(' - ');
      const title = rawTitle.trim();
      let quantity = parseInt(quantityPart); // now it's defined

      //when clicking the icon, if less than 1 decrease the quntity by 1 and updates the UI and server
      if (quantity > 1) {
        quantity -= 1;
        quantityText.textContent = `${title} - ${quantity} selected`;

        // Update total price
        const newTotalPrice = (quantity * price).toFixed(2);
        itemContainer.querySelector('.item-price').textContent = `$${newTotalPrice}`;

        // Update total cart count and server
        totalCartCount -= 1;
        updateNavbarCart();
        updateCartQuantity(id, quantity); // use ID to update

        // ADD THIS LINE to update total immediately
        updateCartTotal();

        //if = 1 remove the item form the page
      } else {
        // Fade out and remove item
        itemContainer.style.transition = 'opacity 0.3s';
        itemContainer.style.opacity = '0';
        setTimeout(() => { 
          itemContainer.remove()
          updateCartTotal(); //update total after removal
          checkCartEmpty(); 
      }, 300);

        totalCartCount -= 1;
        updateNavbarCart();
        updateCartQuantity(id, 0); // inform server
      }
    });
  });
  checkCartEmpty(); //call it here


  const mediaQuery = window.matchMedia('(max-width: 500px)');
  const originalNavList = document.querySelector('.nav-list');
  const navBar = document.querySelector('.navbar');
  let navIcon; // The hamburger or close icon

  //to create the icon
  function createHamburgerIcon() {
    const icon = document.createElement('div');
    icon.classList.add('open-navbar-icon', 'navbar-icon', 'center');
  
    //to loop 3 times -> once for each line of the icon
    for (let i = 0; i < 3; i++) {
      const line = document.createElement('div'); //create a div
      line.classList.add('line'); //add the line class
      icon.appendChild(line); //append the child to the div container for the hamburger icon
    }
    navBar.appendChild(icon);
    return icon;
  }

  //create the mobile menu
  function createNavbarWrapper() {
    const wrapper = document.createElement('div');
    wrapper.classList.add('navbar-wrapper');

    const innerNavbar = document.createElement('nav');
    innerNavbar.classList.add('navbar');

    const closeIcon = document.createElement('div');
    closeIcon.classList.add('close-navbar-icon', 'navbar-icon', 'center');
    closeIcon.style.opacity = '0'; //start hidden

    const line1 = document.createElement('div');
    line1.classList.add('line', 'line-1');
    const line2 = document.createElement('div');
    line2.classList.add('line', 'line-2');

    closeIcon.appendChild(line1);
    closeIcon.appendChild(line2);

    // Close functionality
    //and controlling the timing of hiding and removing the mobile menu from the DOM.
    closeIcon.addEventListener('click', () => {
      wrapper.classList.remove('active'); //remove the class
      setTimeout(() => {
        wrapper.remove(); //remove it from the DOM

        // Show hamburger icon with delay
        navIcon = createHamburgerIcon(); //recreate the hamburger icon after closing the menu
        
        navIcon.addEventListener('click', handleIconClick); 
        //to attach the click handler back to the new hamburger icon.
        //So when the user clicks it again, handleIconClick() runs, which:
        //Removes the hamburger icon and recreates and displays the mobile menu.

      }, 200); // match wrapper transition
    });
    
    // Clone the original nav-list (all links and structure)
    const clonedNavList = originalNavList.cloneNode(true);

    //remove the inline style from the clone so it becomes visible.
    clonedNavList.style.display = 'flex';
    clonedNavList.style.flexDirection = 'column';

    innerNavbar.appendChild(closeIcon); //adding the X icon to the container
    innerNavbar.appendChild(clonedNavList); //adding the clone list
    wrapper.appendChild(innerNavbar); //placing the innerNavbar to the wrapper

    //to insert the wrapper element right after the navBar element in the DOM
    navBar.parentNode.insertBefore(wrapper, navBar.nextSibling);
    //navBar.parentNode: Gets the parent of navBar.
    //syntax-> insertBefore(newNode, referenceNode): Inserts newNode before referenceNode.

    // Trigger transition
    requestAnimationFrame(() => {
      wrapper.classList.add('active');
      closeIcon.style.transition = 'opacity 0.3s ease';
      closeIcon.style.opacity = '1';
    });
  }

  //remove the mobile menu if it exists, used when switching back to desktop layout
  function removeNavbarWrapper() {
    const wrapper = document.querySelector('.navbar-wrapper');
    //looking for the DOM element that was dynamically created earlier in the createNavbarWrapper function
    if (wrapper) wrapper.remove(); //if exists remove it
  }

  //handle click on hamburger
  function handleIconClick() {
    navIcon.remove(); // Remove hamburger icon
    createNavbarWrapper(); // open menu
  }

  //react to screen size change
  function handleMediaChange(e) {
    if(!originalNavList) return; //prevent errors if not found
    if (e.matches) {
      // On small screen
      originalNavList.style.display = 'none';

      //add hamburger icon if not already there
      if (!document.querySelector('.navbar-icon')) {
        navIcon = createHamburgerIcon(); //runs the function where it creates it
        navIcon.addEventListener('click', handleIconClick);
      }
    } else {
      // On wider screens
      originalNavList.style.display = 'flex'; //display the original 
      removeNavbarWrapper(); //and remove the mobile menu

      //and remove the hamburger icon
      const existingIcon = document.querySelector('.navbar-icon'); //searches for an existing navbar-icon
      //which could be the open or the close icon
      if (existingIcon) existingIcon.remove(); //and it removes it from DOM
    }
  }

  //initial check
  handleMediaChange(mediaQuery); //runs once to check the screen width 
  
  //listen for changes
  mediaQuery.addEventListener('change', handleMediaChange); //sets up a listener to react to screen resizes
})

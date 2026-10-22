/* =========================================================================
   Mama Mia menu — edit this file to update the menu on the site.
   price:  a number in US dollars, or null to hide it
   sizes:  [['4 pcs', 9], ['6 pcs', 14], ...] for items sold in sizes
   tags:   'new', 'hot'  (both also show up in the New & Hot tab)
   img:    a photo in assets/img/menu/ (NAME.webp and NAME-t.webp)
   icon:   drawn icon used when there is no photo
   Sections with no items are hidden automatically (Drinks, for now).
   Source: pizza961.com, October 2026.
   ========================================================================= */
(function () {
  var PZ_A = [['4 pcs', 9], ['6 pcs', 14], ['8 pcs', 16], ['12 pcs', 18]];
  var PZ_B = [['4 pcs', 8], ['6 pcs', 13], ['8 pcs', 15], ['12 pcs', 17]];

  window.MM_MENU = {
    currency: '$',
    sections: [
      { id: 'new', label: 'New & Hot', icon: 'flame', auto: true },
      { id: 'starters', label: 'Starters', title: 'Starters & appetizers' },
      { id: 'pastas', label: 'Pastas', title: 'Authentic pastas' },
      { id: 'pizzas', label: 'Pizzas', title: 'Natural gas fired pizzas' },
      { id: 'sandwiches', label: 'Sandwiches', title: 'Sandwiches & burgers' },
      { id: 'salads', label: 'Salads', title: 'Fresh salads' },
      { id: 'desserts', label: 'Desserts', title: 'Desserts & sweets' },
      { id: 'drinks', label: 'Drinks', title: 'Drinks' }
    ],
    items: [
      { s: 'starters', name: 'Fried Mozzarella', desc: 'Crispy breaded mozzarella served with rich arrabbiata sauce.', price: 12, tags: ['new'], img: 'fried-mozzarella' },
      { s: 'starters', name: 'Cheese Fries', desc: 'Golden fries topped with melted cheddar cheese.', price: 8, tags: ['hot'], img: 'cheese-fries' },
      { s: 'starters', name: 'French Fries', desc: 'Classic golden crispy fries.', sizes: [['S', 4], ['M', 6], ['L', 8]], img: 'french-fries' },
      { s: 'starters', name: 'Garlic Bread', desc: 'Toasted dough with garlic spread and cheese.', price: 7, icon: 'bread' },
      { s: 'starters', name: 'Chicken Strips', desc: '5 pieces of breaded chicken with BBQ sauce.', price: 10, icon: 'drum' },

      { s: 'pastas', name: 'Spaghetti Meatballs', desc: 'American-style spaghetti with marinara sauce and juicy meatballs. Served with garlic bread.', price: 20, tags: ['new'], img: 'meatballs' },
      { s: 'pastas', name: 'Chicken Alfredo', desc: 'Creamy white sauce, mushrooms and parmesan. Served with bread sticks.', price: 20, tags: ['hot'], img: 'chicken-alfredo' },
      { s: 'pastas', name: 'Fresh Mushroom Pasta', desc: 'Fresh mushrooms, parmesan and parsley. Served with bread sticks.', price: 18, tags: ['new'], img: 'mushroom-pasta' },
      { s: 'pastas', name: 'Vegetarian Lasagne', desc: 'Spinach, dried tomatoes and basil layers. Served with bread sticks.', price: 18, tags: ['new'], img: 'veg-lasagne' },

      { s: 'pizzas', name: 'Mama Mia Special', desc: 'Our signature: ham, pepperoni, salami and mushrooms.', sizes: PZ_A, tags: ['hot'], img: 'mama-mia-special' },
      { s: 'pizzas', name: 'After Dark', desc: 'Pepperoni, ham, mushroom and olives.', sizes: PZ_A, tags: ['new'], img: 'after-dark' },
      { s: 'pizzas', name: 'Original', desc: 'Ham, cheese, olives and oregano.', sizes: PZ_B, icon: 'pizza' },
      { s: 'pizzas', name: 'Vegetarian', desc: 'Mushrooms, green peppers and onions.', sizes: PZ_B, icon: 'pizza' },
      { s: 'pizzas', name: 'Cheese', desc: 'Simple and delicious: mozzarella and sauce.', sizes: PZ_B, icon: 'pizza' },
      { s: 'pizzas', name: 'Pepperoni', desc: 'Classic pepperoni and mozzarella cheese.', sizes: PZ_A, img: 'pepperoni' },
      { s: 'pizzas', name: 'Chicken', desc: 'Chicken breast, mushrooms and green pepper.', sizes: PZ_A, icon: 'pizza' },
      { s: 'pizzas', name: 'Hawaiian', desc: 'Ham and sweet pineapple.', sizes: PZ_A, icon: 'pizza' },

      { s: 'sandwiches', name: 'Philly Steak', desc: 'Steak, mushrooms, green peppers and onions.', price: 7, tags: ['hot'], icon: 'sub' },
      { s: 'sandwiches', name: 'Chicken Fajita', desc: 'Spicy chicken, onions and peppers.', price: 7, icon: 'sub' },
      { s: 'sandwiches', name: 'Classic Burger', desc: 'Beef patty, lettuce, tomato and onion.', price: 6, icon: 'burger' },
      { s: 'sandwiches', name: 'Chicken Sub', desc: 'Chicken breast, lettuce, mayo and mustard.', price: 7, icon: 'sub' },
      { s: 'sandwiches', name: 'Roast Beef', desc: 'Roast beef, lettuce, tomato and mayo.', price: 7, icon: 'sub' },

      { s: 'salads', name: 'Greek Salad', desc: 'Feta cheese, black olives, cucumber and lettuce.', sizes: [['S', 5], ['M', 7], ['L', 9], ['XL', 10]], tags: ['hot'], icon: 'salad' },
      { s: 'salads', name: 'Chicken Caesar', desc: 'Grilled chicken, parmesan and croutons.', sizes: [['S', 6], ['M', 8], ['L', 10]], icon: 'salad' },
      { s: 'salads', name: 'Green Salad', desc: 'Fresh mixed garden vegetables.', sizes: [['S', 4], ['M', 6], ['L', 9]], icon: 'salad' },
      { s: 'salads', name: 'Coleslaw', desc: 'Crunchy cabbage, carrots and mayo.', sizes: [['S', 4], ['M', 6], ['L', 8]], icon: 'salad' },

      { s: 'desserts', name: 'Dubai Chocolate Pizza', desc: 'Pistachio spread, dark chocolate and crispy kenafa.', price: 15, tags: ['new'], img: 'dubai-chocolate' },
      { s: 'desserts', name: 'Peanut Butter Chocolate Melt', desc: 'Melted chocolate, marshmallow and peanut butter pizza melt.', price: 15, tags: ['new'], img: 'pb-melt' },
      { s: 'desserts', name: 'Warm Brownies', desc: 'Served with vanilla ice cream and chocolate sauce.', price: 10, tags: ['new'], img: 'brownies' },
      { s: 'desserts', name: 'Chocolate Chip Cookies', desc: 'Freshly baked with M&Ms.', price: 3, img: 'cookies' },
      { s: 'desserts', name: 'Lazy Cake', desc: 'Rich no-bake chocolate biscuit cake.', price: 5, icon: 'cake' },
      { s: 'desserts', name: 'Cinnamon Roll', desc: 'Soft dough with cream cheese glaze.', price: 5, img: 'cinnamon-roll' }
    ]
  };
})();

import { PublicMenuResponse } from './api';

const alwaysAvailable = { type: 'always' as const, daysOfWeek: [] };

export const demoMenuData: PublicMenuResponse = {
  restaurant: {
    _id: 'demo',
    user: 'demo',
    name: 'Spice Garden',
    description: 'Authentic Indian Cuisine with a modern twist',
    logo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=200&fit=crop',
    banner: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200&h=400&fit=crop',
    Instaurl: 'https://instagram.com/spicegarden',
    address: 'Bandra West, Mumbai, India',
    phone: '+91 98765 43210',
    qrSlug: 'demo',
  },
  menu: [
    // Food - Starters
    {
      _id: '1', restaurant: 'demo',
      mainCategory: { _id: 'mc1', name: 'Food', order: 1, restaurant: 'demo', availability: alwaysAvailable, isCurrentlyAvailable: true },
      category: { _id: 'c1', name: 'Starters', mainCategory: { _id: 'mc1', name: 'Food', availability: alwaysAvailable, isCurrentlyAvailable: true }, restaurant: 'demo', order: 1, availability: alwaysAvailable, isCurrentlyAvailable: true },
      name: 'Paneer Tikka', description: 'Marinated cottage cheese cubes grilled to perfection in tandoor',
      price: 320, isVeg: true, isCurrentlyAvailable: true, availability: alwaysAvailable,
      image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300&h=200&fit=crop', order: 1,
    },
    {
      _id: '2', restaurant: 'demo',
      mainCategory: { _id: 'mc1', name: 'Food', order: 1, restaurant: 'demo', availability: alwaysAvailable, isCurrentlyAvailable: true },
      category: { _id: 'c1', name: 'Starters', mainCategory: { _id: 'mc1', name: 'Food', availability: alwaysAvailable, isCurrentlyAvailable: true }, restaurant: 'demo', order: 1, availability: alwaysAvailable, isCurrentlyAvailable: true },
      name: 'Chicken Malai Kebab', description: 'Creamy and tender chicken kebabs with aromatic spices',
      price: 380, isVeg: false, isCurrentlyAvailable: true, availability: alwaysAvailable,
      image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=300&h=200&fit=crop', order: 2,
    },
    {
      _id: '3', restaurant: 'demo',
      mainCategory: { _id: 'mc1', name: 'Food', order: 1, restaurant: 'demo', availability: alwaysAvailable, isCurrentlyAvailable: true },
      category: { _id: 'c1', name: 'Starters', mainCategory: { _id: 'mc1', name: 'Food', availability: alwaysAvailable, isCurrentlyAvailable: true }, restaurant: 'demo', order: 1, availability: alwaysAvailable, isCurrentlyAvailable: true },
      name: 'Crispy Corn', description: 'Golden fried corn kernels tossed with spices and herbs',
      price: 220, isVeg: true, isCurrentlyAvailable: true, availability: alwaysAvailable, order: 3,
    },
    // Food - Main Course
    {
      _id: '4', restaurant: 'demo',
      mainCategory: { _id: 'mc1', name: 'Food', order: 1, restaurant: 'demo', availability: alwaysAvailable, isCurrentlyAvailable: true },
      category: { _id: 'c2', name: 'Main Course', mainCategory: { _id: 'mc1', name: 'Food', availability: alwaysAvailable, isCurrentlyAvailable: true }, restaurant: 'demo', order: 2, availability: alwaysAvailable, isCurrentlyAvailable: true },
      name: 'Dal Makhani', description: 'Slow-cooked black lentils with butter and cream',
      price: 280, isVeg: true, isCurrentlyAvailable: true, availability: alwaysAvailable,
      image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=200&fit=crop', order: 1,
    },
    {
      _id: '5', restaurant: 'demo',
      mainCategory: { _id: 'mc1', name: 'Food', order: 1, restaurant: 'demo', availability: alwaysAvailable, isCurrentlyAvailable: true },
      category: { _id: 'c2', name: 'Main Course', mainCategory: { _id: 'mc1', name: 'Food', availability: alwaysAvailable, isCurrentlyAvailable: true }, restaurant: 'demo', order: 2, availability: alwaysAvailable, isCurrentlyAvailable: true },
      name: 'Butter Chicken', description: 'Tender chicken in rich tomato-butter gravy',
      price: 360, isVeg: false, isCurrentlyAvailable: true, availability: alwaysAvailable,
      image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=300&h=200&fit=crop', order: 2,
    },
    {
      _id: '6', restaurant: 'demo',
      mainCategory: { _id: 'mc1', name: 'Food', order: 1, restaurant: 'demo', availability: alwaysAvailable, isCurrentlyAvailable: true },
      category: { _id: 'c2', name: 'Main Course', mainCategory: { _id: 'mc1', name: 'Food', availability: alwaysAvailable, isCurrentlyAvailable: true }, restaurant: 'demo', order: 2, availability: alwaysAvailable, isCurrentlyAvailable: true },
      name: 'Paneer Butter Masala', description: 'Cottage cheese cubes in creamy tomato gravy',
      price: 300, isVeg: true, isCurrentlyAvailable: true, availability: alwaysAvailable, order: 3,
    },
    // Food - Breads
    {
      _id: '7', restaurant: 'demo',
      mainCategory: { _id: 'mc1', name: 'Food', order: 1, restaurant: 'demo', availability: alwaysAvailable, isCurrentlyAvailable: true },
      category: { _id: 'c3', name: 'Breads', mainCategory: { _id: 'mc1', name: 'Food', availability: alwaysAvailable, isCurrentlyAvailable: true }, restaurant: 'demo', order: 3, availability: alwaysAvailable, isCurrentlyAvailable: true },
      name: 'Butter Naan', description: 'Soft leavened bread brushed with butter',
      price: 60, isVeg: true, isCurrentlyAvailable: true, availability: alwaysAvailable, order: 1,
    },
    {
      _id: '8', restaurant: 'demo',
      mainCategory: { _id: 'mc1', name: 'Food', order: 1, restaurant: 'demo', availability: alwaysAvailable, isCurrentlyAvailable: true },
      category: { _id: 'c3', name: 'Breads', mainCategory: { _id: 'mc1', name: 'Food', availability: alwaysAvailable, isCurrentlyAvailable: true }, restaurant: 'demo', order: 3, availability: alwaysAvailable, isCurrentlyAvailable: true },
      name: 'Garlic Naan', description: 'Naan topped with fresh garlic and coriander',
      price: 80, isVeg: true, isCurrentlyAvailable: true, availability: alwaysAvailable, order: 2,
    },
    // Bar - Whisky
    {
      _id: '9', restaurant: 'demo',
      mainCategory: { _id: 'mc2', name: 'Bar', order: 2, restaurant: 'demo', availability: alwaysAvailable, isCurrentlyAvailable: true },
      category: { _id: 'c4', name: 'Whisky', mainCategory: { _id: 'mc2', name: 'Bar', availability: alwaysAvailable, isCurrentlyAvailable: true }, restaurant: 'demo', order: 1, availability: alwaysAvailable, isCurrentlyAvailable: true },
      name: 'Jack Daniels', description: 'Tennessee whiskey, 30ml',
      price: 450, isVeg: true, isCurrentlyAvailable: true, availability: alwaysAvailable, order: 1,
    },
    {
      _id: '10', restaurant: 'demo',
      mainCategory: { _id: 'mc2', name: 'Bar', order: 2, restaurant: 'demo', availability: alwaysAvailable, isCurrentlyAvailable: true },
      category: { _id: 'c4', name: 'Whisky', mainCategory: { _id: 'mc2', name: 'Bar', availability: alwaysAvailable, isCurrentlyAvailable: true }, restaurant: 'demo', order: 1, availability: alwaysAvailable, isCurrentlyAvailable: true },
      name: 'Johnnie Walker Black', description: 'Blended scotch whisky, 30ml',
      price: 550, isVeg: true, isCurrentlyAvailable: true, availability: alwaysAvailable, order: 2,
    },
    // Bar - Vodka
    {
      _id: '11', restaurant: 'demo',
      mainCategory: { _id: 'mc2', name: 'Bar', order: 2, restaurant: 'demo', availability: alwaysAvailable, isCurrentlyAvailable: true },
      category: { _id: 'c5', name: 'Vodka', mainCategory: { _id: 'mc2', name: 'Bar', availability: alwaysAvailable, isCurrentlyAvailable: true }, restaurant: 'demo', order: 2, availability: alwaysAvailable, isCurrentlyAvailable: true },
      name: 'Absolut', description: 'Premium Swedish vodka, 30ml',
      price: 350, isVeg: true, isCurrentlyAvailable: true, availability: alwaysAvailable, order: 1,
    },
    {
      _id: '12', restaurant: 'demo',
      mainCategory: { _id: 'mc2', name: 'Bar', order: 2, restaurant: 'demo', availability: alwaysAvailable, isCurrentlyAvailable: true },
      category: { _id: 'c5', name: 'Vodka', mainCategory: { _id: 'mc2', name: 'Bar', availability: alwaysAvailable, isCurrentlyAvailable: true }, restaurant: 'demo', order: 2, availability: alwaysAvailable, isCurrentlyAvailable: true },
      name: 'Grey Goose', description: 'French premium vodka, 30ml',
      price: 550, isVeg: true, isCurrentlyAvailable: true, availability: alwaysAvailable, order: 2,
    },
    // Beverages - Mocktails
    {
      _id: '13', restaurant: 'demo',
      mainCategory: { _id: 'mc3', name: 'Beverages', order: 3, restaurant: 'demo', availability: alwaysAvailable, isCurrentlyAvailable: true },
      category: { _id: 'c6', name: 'Mocktails', mainCategory: { _id: 'mc3', name: 'Beverages', availability: alwaysAvailable, isCurrentlyAvailable: true }, restaurant: 'demo', order: 1, availability: alwaysAvailable, isCurrentlyAvailable: true },
      name: 'Virgin Mojito', description: 'Refreshing mint and lime cooler',
      price: 180, isVeg: true, isCurrentlyAvailable: true, availability: alwaysAvailable,
      image: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=300&h=200&fit=crop', order: 1,
    },
    {
      _id: '14', restaurant: 'demo',
      mainCategory: { _id: 'mc3', name: 'Beverages', order: 3, restaurant: 'demo', availability: alwaysAvailable, isCurrentlyAvailable: true },
      category: { _id: 'c6', name: 'Mocktails', mainCategory: { _id: 'mc3', name: 'Beverages', availability: alwaysAvailable, isCurrentlyAvailable: true }, restaurant: 'demo', order: 1, availability: alwaysAvailable, isCurrentlyAvailable: true },
      name: 'Blue Lagoon', description: 'Blue curacao syrup with lemonade',
      price: 200, isVeg: true, isCurrentlyAvailable: true, availability: alwaysAvailable, order: 2,
    },
    // Beverages - Soft Drinks
    {
      _id: '15', restaurant: 'demo',
      mainCategory: { _id: 'mc3', name: 'Beverages', order: 3, restaurant: 'demo', availability: alwaysAvailable, isCurrentlyAvailable: true },
      category: { _id: 'c7', name: 'Soft Drinks', mainCategory: { _id: 'mc3', name: 'Beverages', availability: alwaysAvailable, isCurrentlyAvailable: true }, restaurant: 'demo', order: 2, availability: alwaysAvailable, isCurrentlyAvailable: true },
      name: 'Fresh Lime Soda', description: 'Choice of sweet or salted',
      price: 80, isVeg: true, isCurrentlyAvailable: true, availability: alwaysAvailable, order: 1,
    },
    {
      _id: '16', restaurant: 'demo',
      mainCategory: { _id: 'mc3', name: 'Beverages', order: 3, restaurant: 'demo', availability: alwaysAvailable, isCurrentlyAvailable: true },
      category: { _id: 'c7', name: 'Soft Drinks', mainCategory: { _id: 'mc3', name: 'Beverages', availability: alwaysAvailable, isCurrentlyAvailable: true }, restaurant: 'demo', order: 2, availability: alwaysAvailable, isCurrentlyAvailable: true },
      name: 'Cold Coffee', description: 'Chilled coffee with ice cream',
      price: 150, isVeg: true, isCurrentlyAvailable: true, availability: alwaysAvailable, order: 2,
    },
  ],
};

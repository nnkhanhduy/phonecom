import React, { useState, useEffect, useContext, createContext, useMemo } from 'react';
import {
  ShoppingCart, User as UserIcon, LogOut, Package,
  Search, Filter, Plus, Minus, X, CheckCircle,
  AlertCircle, Truck, ClipboardList, Settings,
  ChevronDown, MapPin, Tag, Mail, Lock, ArrowRight, UserPlus, User as UserIconSmall,
  Star, Smartphone, CreditCard, LayoutDashboard, Users, DollarSign, TrendingUp, Activity,
  Edit2, Trash2, Image
} from 'lucide-react';
import {
  Role, OrderStatus, Product, User, CartItem, Order,
  InventoryTx, StaffNote, Address, Variant
} from './types';

import { api } from './api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart as ReBarChart, Bar,
  PieChart as RePieChart, Pie, Cell, Legend
} from 'recharts';

// --- APP STATE CONTEXT ---
interface Notification {
  message: string;
  type: 'success' | 'error';
  id: number;
}

interface AppState {
  currentUser: User | null;
  allUsers: User[];
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  view: string;
  currentProduct: Product | null;
  notifications: Notification[];
}

interface AppContextType extends AppState {
  login: (email: string, role?: Role) => void;
  register: (fullName: string, email: string, password: string, role: Role) => void;
  logout: () => void;
  addToCart: (variant: Variant, product: Product) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQty: (itemId: string, delta: number) => void;
  placeOrder: (shippingAddress: Address) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus, note?: string) => void;
  setView: (view: string) => void;
  setCurrentProduct: (product: Product | null) => void;
  addStaffNote: (orderId: string, noteContent: string) => void;
  editStaffNote: (noteId: string, content: string) => void;
  deleteStaffNote: (noteId: string) => void;
  updateInventory: (variantId: string, newStock: number) => void;
  updateUserRole: (userId: string, newRole: Role) => Promise<void>;
  updateProduct: (productId: string, data: any) => Promise<void>;
  updateVariant: (variantId: string, data: any) => Promise<void>;
  showNotification: (message: string, type?: 'success' | 'error') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [view, setView] = useState('home');
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Initial Data Fetching
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsData, usersData] = await Promise.all([
        api.products.getAll(),
        api.users.getAll().catch(() => []) // Catch if auth fails/admin only
      ]);
      setProducts(productsData);
      setAllUsers(usersData);
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  // Reload user data when current user changes (e.g., after login)
  useEffect(() => {
    if (currentUser) {
      loadUserData(currentUser.id);
    } else {
      setCart([]);
      setOrders([]);
    }
  }, [currentUser?.id]);

  const loadUserData = async (userId: string) => {
    try {
      const [cartData, ordersData, userData] = await Promise.all([
        api.users.getCart(userId),
        api.users.getOrders(userId),
        api.users.getById(userId)
      ]);
      setCart(cartData);
      setOrders(ordersData);
      // Update current user details (e.g. addresses)
      setCurrentUser(userData);
    } catch (error) {
      console.error("Failed to load user data", error);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { message, type, id }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const login = async (email: string, role?: Role) => {
    try {
      // In a real app, this would be a POST /login call
      // Here we simulate by fetching all users and finding the match
      const users = await api.users.getAll();
      setAllUsers(users); // Refresh users list

      const user = users.find(u => u.email === email && (!role || u.role.name === role));

      if (user) {
        setCurrentUser(user);
        if (user.role.name === Role.CUSTOMER) {
          setView('home');
        } else if (user.role.name === Role.ADMIN) {
          setView('admin-dashboard');
        } else {
          setView('dashboard');
        }
        showNotification(`Welcome back, ${user.fullName}`);
        loadUserData(user.id);
      } else {
        showNotification("Invalid credentials or user not found", "error");
      }
    } catch (error) {
      showNotification("Login failed", "error");
    }
  };

  const register = async (fullName: string, email: string, password: string) => {
    try {
      const newUser = await api.users.create({ fullName, email, role: Role.CUSTOMER });
      setAllUsers(prev => [...prev, newUser]);
      setCurrentUser(newUser);

      setView('home');

      showNotification(`Welcome, ${fullName}! Account created successfully.`);
    } catch (error: any) {
      showNotification(error.message || "Registration failed", "error");
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setCart([]);
    setOrders([]);
    setView('home');
    showNotification("Logged out successfully");
  };

  const addToCart = async (variant: Variant, product: Product) => {
    if (!currentUser) return;
    try {
      await api.cart.add(currentUser.id, variant.id, 1);
      await loadUserData(currentUser.id); // Refresh cart
      showNotification(`Added ${product.name} to cart`);
    } catch (error: any) {
      showNotification(error.message || "Failed to add to cart", "error");
    }
  };

  const removeFromCart = async (itemId: string) => {
    if (!currentUser) return;
    try {
      await api.cart.remove(itemId);
      await loadUserData(currentUser.id); // Refresh
      showNotification("Item removed from cart");
    } catch (error) {
      showNotification("Failed to remove item", "error");
    }
  };

  const updateCartQty = async (itemId: string, delta: number) => {
    if (!currentUser) return;
    const item = cart.find(c => c.id === itemId);
    if (!item) return;

    const newQty = item.quantity + delta;
    if (newQty < 1) return; // Or trigger remove?

    try {
      await api.cart.updateQty(itemId, newQty);
      await loadUserData(currentUser.id); // Refresh
    } catch (error: any) {
      showNotification(error.message || "Failed to update quantity", "error");
    }
  };

  const placeOrder = async (shippingAddress: Address) => {
    if (!currentUser) return;
    try {
      const formattedAddress = `${shippingAddress.recipientName}, ${shippingAddress.phoneNumber}, ${shippingAddress.line1}, ${shippingAddress.ward}, ${shippingAddress.district}, ${shippingAddress.province}`;
      await api.orders.create(currentUser.id, formattedAddress);

      await loadUserData(currentUser.id); // Refresh cart and orders
      setView('orders');
      showNotification('Order placed successfully!');
    } catch (error: any) {
      showNotification(error.message || "Failed to place order", "error");
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus, noteContent?: string) => {
    try {
      await api.orders.updateStatus(orderId, status);
      if (noteContent && currentUser) {
        await api.staffNotes.create(orderId, currentUser.id, noteContent);
      }

      // Refresh orders (for everyone, but mainly for the viewer)
      // If staff/admin, we might need to fetch ALL orders, not just current user's
      if (currentUser?.role.name === Role.STAFF || currentUser?.role.name === Role.ADMIN) {
        const allOrders = await api.orders.getAll();
        setOrders(allOrders);
        // Also refresh products for inventory updates
        const updatedProducts = await api.products.getAll();
        setProducts(updatedProducts);
      } else {
        // Customer view
        if (currentUser) loadUserData(currentUser.id);
      }

      showNotification(`Order status updated to ${status}`);
    } catch (error: any) {
      showNotification(error.message || "Failed to update status", "error");
    }
  };

  const addStaffNote = async (orderId: string, noteContent: string) => {
    if (!currentUser) return;
    try {
      await api.staffNotes.create(orderId, currentUser.id, noteContent);
      // Refresh orders to see notes
      if (currentUser.role.name === Role.STAFF || currentUser.role.name === Role.ADMIN) {
        const allOrders = await api.orders.getAll();
        setOrders(allOrders);
      } else {
        if (currentUser) loadUserData(currentUser.id);
      }
      showNotification('Note added');
    } catch (error) {
      showNotification("Failed to add note", "error");
    }
  };

  const editStaffNote = async (noteId: string, content: string) => {
    try {
      await api.staffNotes.update(noteId, content);
      if (currentUser?.role.name === Role.STAFF || currentUser?.role.name === Role.ADMIN) {
        const allOrders = await api.orders.getAll();
        setOrders(allOrders);
      } else {
        if (currentUser) loadUserData(currentUser.id);
      }
      showNotification('Note updated');
    } catch (error) {
      showNotification("Failed to update note", "error");
    }
  };

  const deleteStaffNote = async (noteId: string) => {
    try {
      await api.staffNotes.delete(noteId);
      if (currentUser?.role.name === Role.STAFF || currentUser?.role.name === Role.ADMIN) {
        const allOrders = await api.orders.getAll();
        setOrders(allOrders);
      } else {
        if (currentUser) loadUserData(currentUser.id);
      }
      showNotification('Note deleted');
    } catch (error) {
      showNotification("Failed to delete note", "error");
    }
  };

  const updateInventory = async (variantId: string, newStock: number) => {
    try {
      await api.variants.update(variantId, { stockQuantity: newStock });
      // Refresh products
      const updatedProducts = await api.products.getAll();
      setProducts(updatedProducts);
      showNotification('Inventory updated');
    } catch (error) {
      showNotification("Failed to update inventory", "error");
    }
  };

  const updateVariant = async (variantId: string, data: any) => {
    try {
      await api.variants.update(variantId, data);
      const updatedProducts = await api.products.getAll();
      setProducts(updatedProducts);
      showNotification('Variant updated');
    } catch (error) {
      showNotification("Failed to update variant", "error");
    }
  };

  const updateProduct = async (productId: string, data: any) => {
    try {
      await api.products.update(productId, data);
      const updatedProducts = await api.products.getAll();
      setProducts(updatedProducts);
      showNotification('Product updated successfully');
    } catch (error) {
      showNotification("Failed to update product", "error");
    }
  };

  const addAddress = async (addressData: Omit<Address, 'id' | 'isDefault' | 'userId'>) => {
    if (!currentUser) return;
    try {
      await api.addresses.create({
        ...addressData,
        userId: currentUser.id,
        isDefault: currentUser.addresses.length === 0 // Make default if first one
      });
      // Refresh user data
      const user = await api.users.getById(currentUser.id);
      setCurrentUser(user);
      showNotification("Address added successfully");
    } catch (error) {
      showNotification("Failed to add address", "error");
    }
  };

  const updateUserRole = async (userId: string, newRole: Role) => {
    try {
      const updatedUser = await api.users.update(userId, { role: newRole });
      setAllUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
      showNotification(`Role updated to ${newRole}`);
    } catch (error: any) {
      showNotification(error.message || "Failed to update role", "error");
    }
  };

  // Admin/Staff loads data on dashboard views
  useEffect(() => {
    if ((view === 'dashboard' || view === 'admin-dashboard' || view === 'orders')) {
      if (currentUser?.role.name === Role.STAFF || currentUser?.role.name === Role.ADMIN) {
        api.orders.getAll().then(setOrders).catch(console.error);
        if (currentUser?.role.name === Role.ADMIN) {
          api.users.getAll().then(setAllUsers).catch(console.error);
        }
      }
    }
  }, [view, currentUser]);

  return (
    <AppContext.Provider value={{
      currentUser, allUsers, products, cart, orders, view, currentProduct, notifications,
      login, register, logout, addToCart, removeFromCart, updateCartQty, placeOrder,
      updateOrderStatus, setView, setCurrentProduct, addStaffNote, editStaffNote, deleteStaffNote, updateInventory, showNotification, addAddress, updateUserRole, updateProduct, updateVariant
    }}>
      {children}
    </AppContext.Provider>
  );
};

const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};

// --- COMPONENTS ---

const Header: React.FC = () => {
  const { currentUser, cart, logout, setView, view } = useAppContext();
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center cursor-pointer group" onClick={() => setView('home')}>
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200 group-hover:bg-indigo-700 transition-colors">
              <Smartphone className="h-6 w-6 text-white" />
            </div>
            <span className="ml-3 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">PhoneCom</span>
          </div>

          <div className="flex items-center space-x-4">
            {currentUser ? (
              <>
                <div className="hidden md:flex flex-col items-end mr-2">
                  <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{currentUser.role.name}</span>
                  <span className="text-sm font-medium text-gray-700">{currentUser.fullName}</span>
                </div>

                {currentUser.role.name === Role.CUSTOMER && (
                  <>
                    <button
                      onClick={() => setView('orders')}
                      className={`text-sm font-medium transition-colors ${view === 'orders' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                      My Orders
                    </button>
                    <button
                      onClick={() => setView('cart')}
                      className="relative p-2 text-gray-500 hover:text-indigo-600 transition-colors"
                    >
                      <ShoppingCart className="h-6 w-6" />
                      {cartItemCount > 0 && (
                        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-5 w-5 text-xs font-bold leading-none text-white transform bg-red-500 rounded-full border-2 border-white">
                          {cartItemCount}
                        </span>
                      )}
                    </button>
                  </>
                )}

                {(currentUser.role.name === Role.STAFF) && (
                  <button
                    onClick={() => setView('dashboard')}
                    className={`flex items-center px-3 py-1.5 rounded-md transition-colors ${view === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                  >
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Staff Dashboard</span>
                  </button>
                )}

                {(currentUser.role.name === Role.ADMIN) && (
                  <button
                    onClick={() => setView('admin-dashboard')}
                    className={`flex items-center px-3 py-1.5 rounded-md transition-colors ${view === 'admin-dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                  >
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Admin Dashboard</span>
                  </button>
                )}

                <div className="h-6 w-px bg-gray-200 mx-2"></div>

                <button
                  onClick={logout}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setView('login')}
                className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-indigo-600 shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:scale-105"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

const HeroSection: React.FC = () => {
  return (
    <div className="relative bg-white overflow-hidden mb-12">
      <div className="max-w-7xl mx-auto">
        <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
          <svg
            className="hidden lg:block absolute right-0 inset-y-0 h-full w-48 text-white transform translate-x-1/2"
            fill="currentColor"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <polygon points="50,0 100,0 50,100 0,100" />
          </svg>

          <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
            <div className="sm:text-center lg:text-left">
              <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block xl:inline">Premium Technology</span>{' '}
                <span className="block text-indigo-600 xl:inline">for Modern Life</span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                Discover the latest smartphones with cutting-edge features. From professional photography to AI-powered assistance, find the perfect device for you.
              </p>
            </div>
          </main>
        </div>
      </div>
      <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
        <img
          className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full"
          src="https://images.unsplash.com/photo-1616348436168-de43ad0db179?auto=format&fit=crop&q=80&w=1600"
          alt="Smartphones"
        />
        <div className="absolute inset-0 bg-indigo-900/10 mix-blend-multiply"></div>
      </div>
    </div>
  );
};

const ProductList: React.FC = () => {
  const { products, setView, setCurrentProduct, addToCart, currentUser, showNotification } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState<string>('All');

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = brandFilter === 'All' || p.brand === brandFilter;
    return matchesSearch && matchesBrand;
  });

  const uniqueBrands = ['All', ...Array.from(new Set(products.map(p => p.brand)))];

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation(); // Prevent going to detail view

    if (!currentUser) {
      showNotification("Please login to purchase", "error");
      setView('login');
      return;
    }

    if (currentUser.role.name !== Role.CUSTOMER) {
      showNotification("Only Customers can purchase", "error");
      return;
    }

    // Find first available variant
    const availableVariant = product.variants.find(v => v.stockQuantity > 0);

    if (availableVariant) {
      addToCart(availableVariant, product);
    } else {
      showNotification("Product is out of stock", "error");
    }
  };

  return (
    <>
      <HeroSection />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-16 relative z-20">
        <div className="bg-white rounded-xl shadow-xl p-6 mb-12">
          {/* Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="relative w-full md:w-96">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors sm:text-sm"
                placeholder="Search phones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              <span className="text-sm font-medium text-gray-500 mr-2 flex items-center"><Filter className="h-4 w-4 mr-1" /> Brands:</span>
              {uniqueBrands.map(brand => (
                <button
                  key={brand}
                  onClick={() => setBrandFilter(brand)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${brandFilter === brand ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map(product => {
            const minPrice = Math.min(...product.variants.map(v => v.price));
            const totalStock = product.variants.reduce((acc, v) => acc + v.stockQuantity, 0);

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer border border-gray-100 flex flex-col h-full transform hover:-translate-y-1"
                onClick={() => { setCurrentProduct(product); setView('product-detail'); }}
              >
                <div className="aspect-w-4 aspect-h-3 bg-gray-100 relative overflow-hidden">
                  <img
                    src={product.imageUrl || product.variants[0]?.imageUrl}
                    alt={product.name}
                    className="w-full h-64 object-cover object-center transform group-hover:scale-105 transition-transform duration-500"
                  />
                  {totalStock === 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg transform -rotate-12">OUT OF STOCK</span>
                    </div>
                  )}
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-1">{product.brand}</p>
                      <h3 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-indigo-700 transition-colors">{product.name}</h3>
                    </div>
                    <div className="flex items-center bg-green-50 px-2 py-1 rounded text-green-700">
                      <Tag className="h-3 w-3 mr-1" />
                      <span className="text-sm font-bold">${minPrice}</span>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500 line-clamp-2 flex-1">{product.description}</p>

                  <div className="mt-6 pt-4 border-t border-gray-50 flex justify-between items-center gap-2">
                    <span className={`text-xs font-semibold flex items-center ${totalStock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${totalStock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      {totalStock > 0 ? `${totalStock} Available` : 'Unavailable'}
                    </span>

                    <div className="flex gap-2">
                      {/* Quick Add Button */}
                      {totalStock > 0 && (
                        <button
                          onClick={(e) => handleQuickAdd(e, product)}
                          className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-indigo-600 hover:text-white hover:border-transparent transition-all shadow-sm"
                          title="Quick Add to Cart"
                        >
                          <ShoppingCart className="h-5 w-5" />
                        </button>
                      )}

                      <button
                        onClick={(e) => { e.stopPropagation(); setCurrentProduct(product); setView('product-detail'); }}
                        className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-indigo-600 transition-colors shadow-sm"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No products found</h3>
            <p className="mt-1 text-gray-500">We couldn't find anything matching your search.</p>
            <button onClick={() => { setSearchTerm(''); setBrandFilter('All'); }} className="mt-4 text-indigo-600 font-medium hover:text-indigo-800">Clear filters</button>
          </div>
        )}
      </div>
    </>
  );
};

const ProductDetail: React.FC = () => {
  const { currentProduct, addToCart, setView, currentUser, showNotification } = useAppContext();
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    currentProduct?.variants[0]?.id || null
  );

  if (!currentProduct) return null;

  const selectedVariant = currentProduct.variants.find(v => v.id === selectedVariantId);

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    if (!currentUser) {
      showNotification("Please login to purchase", "error");
      setView('login');
      return;
    }
    if (currentUser.role.name !== Role.CUSTOMER) {
      showNotification("Only Customers can purchase. Please login as a Customer.", "error");
      return;
    }
    addToCart(selectedVariant, currentProduct);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <button
        onClick={() => setView('home')}
        className="mb-8 text-sm font-medium text-gray-500 hover:text-indigo-600 flex items-center transition-colors"
      >
        <ArrowRight className="h-4 w-4 mr-1 transform rotate-180" /> Back to browsing
      </button>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden lg:grid lg:grid-cols-2 lg:gap-0">
        <div className="p-12 bg-gray-50 flex items-center justify-center border-r border-gray-100 relative">
          <div className="absolute top-8 left-8">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white text-gray-800 shadow-sm border border-gray-200">
              {currentProduct.brand}
            </span>
          </div>
          <img
            src={selectedVariant?.imageUrl || currentProduct.imageUrl || currentProduct.variants[0]?.imageUrl}
            alt={selectedVariant?.name}
            className="max-h-[500px] w-auto object-contain drop-shadow-2xl transform transition-transform duration-500 hover:scale-105"
          />
        </div>

        <div className="p-10 lg:p-14 flex flex-col justify-center">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">{currentProduct.name}</h1>
          <div className="mt-4 flex items-center space-x-2">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-current" />)}
            </div>
            <span className="text-gray-400 text-sm">(Mock Reviews)</span>
          </div>

          <p className="mt-6 text-gray-600 text-lg leading-relaxed">{currentProduct.description}</p>

          <div className="mt-10 pt-10 border-t border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Select Configuration</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentProduct.variants.map(variant => (
                <div
                  key={variant.id}
                  onClick={() => setSelectedVariantId(variant.id)}
                  className={`cursor-pointer group relative rounded-xl border-2 p-4 flex justify-between items-center transition-all ${selectedVariantId === variant.id ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'}`}
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900">{variant.capacity}</span>
                    <span className="text-sm text-gray-500">{variant.color}</span>
                  </div>
                  <div className="text-right">
                    <span className="block font-bold text-indigo-700 text-lg">${variant.price}</span>
                    <span className={`text-xs font-medium ${variant.stockQuantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {variant.stockQuantity > 0 ? 'In Stock' : 'Sold Out'}
                    </span>
                  </div>
                  {selectedVariantId === variant.id && (
                    <div className="absolute -top-2 -right-2 bg-indigo-600 text-white p-1 rounded-full shadow-sm">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
              <span className="text-gray-600 font-medium">Total Price:</span>
              <span className="text-3xl font-bold text-gray-900">${selectedVariant?.price || 0}</span>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!selectedVariant || selectedVariant.stockQuantity === 0}
              className={`w-full flex items-center justify-center px-8 py-4 border border-transparent text-lg font-bold rounded-xl text-white shadow-lg transition-all transform hover:-translate-y-1
                ${(!selectedVariant || selectedVariant.stockQuantity === 0)
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/30'}`}
            >
              {selectedVariant?.stockQuantity === 0 ? 'Out of Stock' : (
                <><ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart</>
              )}
            </button>
            {!currentUser && (
              <p className="text-center text-sm text-gray-500 bg-yellow-50 p-2 rounded text-yellow-800">Please <button onClick={() => setView('login')} className="underline font-bold">sign in</button> to purchase this item.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const CartView: React.FC = () => {
  const { cart, removeFromCart, updateCartQty, setView } = useAppContext();
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-100 mb-6">
          <ShoppingCart className="h-10 w-10 text-gray-400" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Your cart is empty</h2>
        <p className="mt-2 text-gray-500 mb-8">Looks like you haven't added anything to your cart yet.</p>
        <button
          onClick={() => setView('home')}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
        >
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-10">Shopping Cart</h1>
      <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
        <div className="lg:col-span-8">
          <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-gray-200">
            <ul className="divide-y divide-gray-200">
              {cart.map((item) => (
                <li key={item.id} className="p-6 sm:flex items-center hover:bg-gray-50 transition-colors">
                  <div className="flex-shrink-0 w-24 h-24 border border-gray-200 rounded-lg overflow-hidden">
                    <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-center object-cover" />
                  </div>
                  <div className="ml-4 flex-1 flex flex-col sm:ml-6 justify-between h-24">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {item.productName}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">{item.variantName}</p>
                      </div>
                      <p className="text-lg font-bold text-gray-900">${item.price}</p>
                    </div>

                    <div className="flex justify-between items-end">
                      <div className="flex items-center border border-gray-300 rounded-lg bg-white">
                        <button onClick={() => updateCartQty(item.id, -1)} className="p-2 hover:bg-gray-100 rounded-l-lg text-gray-600"><Minus className="h-4 w-4" /></button>
                        <span className="px-4 py-1 text-gray-900 font-medium border-l border-r border-gray-300 min-w-[3rem] text-center">{item.quantity}</span>
                        <button onClick={() => updateCartQty(item.id, 1)} className="p-2 hover:bg-gray-100 rounded-r-lg text-gray-600"><Plus className="h-4 w-4" /></button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-sm font-medium text-red-600 hover:text-red-500 flex items-center p-2 rounded hover:bg-red-50 transition-colors"
                      >
                        <X className="h-4 w-4 mr-1" /> Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-4 mt-16 lg:mt-0">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
            <dl className="space-y-4">
              <div className="flex items-center justify-between">
                <dt className="text-gray-600">Subtotal</dt>
                <dd className="font-medium text-gray-900">${total.toLocaleString()}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-gray-600">Shipping Estimate</dt>
                <dd className="font-medium text-gray-900">$10.00</dd>
              </div>
              <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
                <dt className="text-xl font-bold text-gray-900">Total</dt>
                <dd className="text-xl font-bold text-indigo-600">${(total + 10).toLocaleString()}</dd>
              </div>
            </dl>

            <button
              onClick={() => setView('checkout')}
              className="mt-8 w-full bg-indigo-600 border border-transparent rounded-xl shadow-lg shadow-indigo-200 py-4 px-4 text-lg font-bold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:-translate-y-1"
            >
              Proceed to Checkout
            </button>
            <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
              <Lock className="h-4 w-4 mr-1" /> Secure Checkout
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CheckoutView: React.FC = () => {
  const { currentUser, placeOrder, setView, showNotification, addAddress } = useAppContext();
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    recipientName: '',
    phoneNumber: '',
    line1: '',
    ward: '',
    district: '',
    province: ''
  });

  // Effect to select default or first address initially
  useEffect(() => {
    if (currentUser && currentUser.addresses.length > 0 && !selectedAddress) {
      // Prefer default, otherwise first
      const defaultAddr = currentUser.addresses.find(a => a.isDefault);
      setSelectedAddress(defaultAddr ? defaultAddr.id : currentUser.addresses[0].id);
    }
  }, [currentUser, selectedAddress]);

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.recipientName || !formData.phoneNumber || !formData.line1 || !formData.ward || !formData.district || !formData.province) {
      showNotification("Please fill in all fields", "error");
      return;
    }
    addAddress(formData);
    setIsAdding(false);
    setFormData({ recipientName: '', phoneNumber: '', line1: '', ward: '', district: '', province: '' });
  };

  const handlePlaceOrder = () => {
    const address = currentUser?.addresses.find(a => a.id === selectedAddress);
    if (!address) {
      showNotification("Please select a valid address", "error");
      return;
    }
    placeOrder(address);
  };

  if (!currentUser) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <button onClick={() => setView('cart')} className="mb-8 text-sm text-gray-500 hover:text-gray-900 flex items-center">
        <ArrowRight className="h-4 w-4 mr-1 transform rotate-180" /> Back to Cart
      </button>

      <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16">
        <div>
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900">Shipping Information</h2>
            <p className="mt-1 text-sm text-gray-500">Where should we send your order?</p>
          </div>

          <div className="space-y-4">
            {isAdding ? (
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 shadow-inner">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Add New Address</h4>
                <form onSubmit={handleSaveAddress} className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Name</label>
                    <input
                      type="text"
                      className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2.5"
                      value={formData.recipientName}
                      onChange={e => setFormData({ ...formData, recipientName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2.5"
                      value={formData.phoneNumber}
                      onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Street Address (Line 1)</label>
                    <input
                      type="text"
                      className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2.5"
                      value={formData.line1}
                      onChange={e => setFormData({ ...formData, line1: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ward</label>
                      <input
                        type="text"
                        className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2.5"
                        value={formData.ward}
                        onChange={e => setFormData({ ...formData, ward: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                      <input
                        type="text"
                        className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2.5"
                        value={formData.district}
                        onChange={e => setFormData({ ...formData, district: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Province/City</label>
                      <input
                        type="text"
                        className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2.5"
                        value={formData.province}
                        onChange={e => setFormData({ ...formData, province: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                    >
                      Save Address
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <>
                <div className="grid gap-4">
                  {currentUser.addresses.map(addr => (
                    <div
                      key={addr.id}
                      className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all ${selectedAddress === addr.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'}`}
                      onClick={() => setSelectedAddress(addr.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="block text-sm font-bold text-gray-900">{addr.recipientName}</span>
                          <span className="block text-sm text-gray-600 mt-1">{addr.line1}, {addr.ward}, {addr.district}, {addr.province}</span>
                          <span className="block text-sm text-gray-500 mt-1">{addr.phoneNumber}</span>
                        </div>
                        {selectedAddress === addr.id && (
                          <CheckCircle className="h-5 w-5 text-indigo-600" />
                        )}
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center justify-center p-5 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add New Address
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="mt-10 pt-10 border-t border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Method</h2>
            <div className="bg-white border-2 border-indigo-100 rounded-xl p-6 flex items-center shadow-sm">
              <div className="bg-green-100 p-3 rounded-full mr-4">
                <Truck className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Cash on Delivery (COD)</p>
                <p className="text-sm text-gray-500">Pay securely when you receive your order.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 lg:mt-0">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-8 sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              By confirming, your order will be placed immediately. Stock is reserved but only deducted upon staff confirmation.
            </p>

            <button
              onClick={handlePlaceOrder}
              disabled={!selectedAddress}
              className={`w-full py-4 px-6 border border-transparent rounded-xl shadow-lg text-lg font-bold text-white transition-all transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 
                  ${!selectedAddress ? 'bg-gray-300 cursor-not-allowed shadow-none hover:translate-y-0' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}
            >
              Confirm Order
            </button>

            <div className="mt-6 flex justify-center space-x-4 text-gray-400">
              <CreditCard className="h-6 w-6" />
              <Truck className="h-6 w-6" />
              <Package className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const OrderHistory: React.FC = () => {
  const { orders, currentUser, updateOrderStatus } = useAppContext();
  const myOrders = orders.filter(o => o.userId === currentUser?.id);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case OrderStatus.CONFIRMED: return 'bg-blue-100 text-blue-800 border-blue-200';
      case OrderStatus.COMPLETED: return 'bg-green-100 text-green-800 border-green-200';
      case OrderStatus.CANCELLED: return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatAddress = (addr: any) => {
    if (typeof addr === 'string') return addr;
    if (typeof addr === 'object' && addr !== null) {
      const { recipientName, phoneNumber, line1, ward, district, province } = addr;
      return [recipientName, phoneNumber, line1, ward, district, province].filter(Boolean).join(', ');
    }
    return 'Unknown Address';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">My Orders</h1>
      {myOrders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <ClipboardList className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-lg text-gray-500">You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {myOrders.map(order => (
            <div key={order.id} className="bg-white shadow-md rounded-2xl overflow-hidden border border-gray-100 transition-shadow hover:shadow-lg">
              <div className="px-6 py-5 bg-gray-50/50 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-gray-900">Order #{order.id}</h3>
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                </div>

                {order.status === OrderStatus.PENDING && (
                  <button
                    onClick={() => updateOrderStatus(order.id, OrderStatus.CANCELLED)}
                    className="text-sm font-medium text-red-600 hover:text-red-800 bg-white border border-red-200 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
              <div className="px-6 py-6">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Items</h4>
                    <ul className="divide-y divide-gray-100">
                      {order.items.map(item => (
                        <li key={item.id} className="py-3 flex justify-between">
                          <div className="flex items-center">
                            <div className="h-10 w-10 bg-gray-100 rounded-md mr-3"></div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                              <p className="text-xs text-gray-500">{item.variantName} x {item.quantity}</p>
                            </div>
                          </div>
                          <p className="text-sm font-bold text-gray-900">${item.price * item.quantity}</p>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="md:w-1/3 bg-gray-50 rounded-xl p-5">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">${order.totalAmount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Shipping</span>
                        <span className="font-medium">$0</span>
                      </div>
                      <div className="flex justify-between text-base pt-3 border-t border-gray-200">
                        <span className="font-bold text-gray-900">Total</span>
                        <span className="font-bold text-indigo-600">${order.totalAmount}</span>
                      </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Shipping To</h4>
                      <p className="text-sm text-gray-700">{formatAddress(order.shippingAddress)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const StaffDashboard: React.FC = () => {
  const { orders, products, currentUser, allUsers, updateOrderStatus, addStaffNote, editStaffNote, deleteStaffNote, updateInventory, updateUserRole, updateProduct, updateVariant } = useAppContext();
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory' | 'overview' | 'users'>('orders');
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteContent, setEditNoteContent] = useState<string>('');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editProductData, setEditProductData] = useState<{
    name: string;
    brand: string;
    description: string;
    imageUrl: string;
    status: string;
  }>({ name: '', brand: '', description: '', imageUrl: '', status: 'ACTIVE' });

  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [editVariantData, setEditVariantData] = useState<{
    name: string;
    color: string;
    capacity: string;
    price: number;
    stockQuantity: number;
    imageUrl: string;
    status: string;
  }>({ name: '', color: '', capacity: '', price: 0, stockQuantity: 0, imageUrl: '', status: 'IN_STOCK' });

  const isAdmin = currentUser?.role.name === Role.ADMIN;

  // Set initial tab based on role
  useEffect(() => {
    if (isAdmin && activeTab === 'orders') {
      // Keep default as orders or switch to overview if preferred, sticking to orders for now unless manually changed
    }
  }, [isAdmin]);

  const handleNoteChange = (orderId: string, value: string) => {
    setNoteInputs(prev => ({ ...prev, [orderId]: value }));
  };

  const submitNote = (orderId: string) => {
    if (noteInputs[orderId]) {
      addStaffNote(orderId, noteInputs[orderId]);
      setNoteInputs(prev => ({ ...prev, [orderId]: '' }));
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProductId(product.id);
    setEditProductData({
      name: product.name,
      brand: product.brand,
      description: product.description,
      imageUrl: product.imageUrl || '',
      status: (product as any).status || 'ACTIVE'
    });
  };

  const handleSaveProduct = async () => {
    if (editingProductId) {
      await updateProduct(editingProductId, editProductData);
      setEditingProductId(null);
    }
  };

  const handleEditVariant = (variant: Variant) => {
    setEditingVariantId(variant.id);
    setEditVariantData({
      name: variant.name,
      color: variant.color,
      capacity: variant.capacity,
      price: variant.price,
      stockQuantity: variant.stockQuantity,
      imageUrl: variant.imageUrl || '',
      status: (variant as any).status || 'IN_STOCK'
    });
  };

  const handleSaveVariant = async () => {
    if (editingVariantId) {
      await updateVariant(editingVariantId, editVariantData);
      setEditingVariantId(null);
    }
  };

  // --- Dashboard Statistics Calculation ---
  const stats = useMemo(() => {
    const totalRevenue = orders
      .filter(o => o.status === OrderStatus.COMPLETED || o.status === OrderStatus.CONFIRMED)
      .reduce((sum, o) => sum + o.totalAmount, 0); // Including shipping

    const activeOrders = orders.filter(o => o.status === OrderStatus.PENDING || o.status === OrderStatus.CONFIRMED).length;
    const totalCustomers = allUsers.filter(u => u.role.name === Role.CUSTOMER).length;

    let lowStockCount = 0;
    products.forEach(p => {
      p.variants.forEach(v => {
        if (v.stockQuantity < 5) lowStockCount++;
      });
    });

    return { totalRevenue, activeOrders, totalCustomers, lowStockCount };
  }, [orders, allUsers, products]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isAdmin ? 'Admin Dashboard' : 'Staff Dashboard'}
          </h1>
          <p className="text-sm text-gray-500">Manage orders, inventory, and view analytics.</p>
        </div>

        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg self-start overflow-x-auto">
          {isAdmin && (
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'overview' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Overview
            </button>
          )}
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'orders' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Order Management
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'inventory' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Inventory Management
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'users' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              User Management
            </button>
          )}

        </div>
      </div>

      {isAdmin && activeTab === 'overview' && (
        <div className="space-y-6 animate-slide-in-right">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center">
              <div className="p-3 bg-green-100 rounded-full mr-4">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center">
              <div className="p-3 bg-blue-100 rounded-full mr-4">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Active Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeOrders}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center">
              <div className="p-3 bg-purple-100 rounded-full mr-4">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center">
              <div className="p-3 bg-orange-100 rounded-full mr-4">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Low Stock Alerts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.lowStockCount}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            {/* Revenue Trend */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Revenue Trend (Daily)</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={
                    Object.entries(orders.reduce((acc, order) => {
                      const date = new Date(order.createdAt).toLocaleDateString();
                      acc[date] = (acc[date] || 0) + Number(order.totalAmount);
                      return acc;
                    }, {} as Record<string, number>))
                      .map(([date, revenue]) => ({ date, revenue }))
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  }>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} tickFormatter={(val) => `$${val}`} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                      formatter={(val: number) => [`$${val.toFixed(2)}`, 'Revenue']}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Order Status Distribution */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Order Status Distribution</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={
                        Object.entries(orders.reduce((acc, order) => {
                          acc[order.status] = (acc[order.status] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>))
                          .map(([name, value]) => ({ name, value }))
                      }
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {Object.keys(OrderStatus).map((key, index) => (
                        <Cell key={`cell-${index}`} fill={[
                          '#f59e0b', // PENDING
                          '#3b82f6', // CONFIRMED
                          '#10b981', // COMPLETED
                          '#ef4444'  // CANCELLED
                        ][index] || '#6366f1'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', shadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                    <Legend verticalAlign="bottom" height={36} />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 lg:col-span-2">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Top Selling Products (by Quantity)</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ReBarChart data={
                    Object.entries(orders.flatMap(o => o.items).reduce((acc, item) => {
                      const productName = item.productName || 'Unknown Product';
                      acc[productName] = (acc[productName] || 0) + (item.quantity || 1);
                      return acc;
                    }, {} as Record<string, number>))
                      .map(([name, quantity]) => ({ name, quantity }))
                      .sort((a, b) => b.quantity - a.quantity)
                      .slice(0, 5)
                  } layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#4b5563', fontWeight: 'bold' }} width={120} />
                    <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '12px', border: 'none', shadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="quantity" fill="#818cf8" radius={[0, 4, 4, 0]} barSize={20} />
                  </ReBarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-200 animate-slide-in-right">
          <ul className="divide-y divide-gray-200">
            {orders.length === 0 && <li className="p-8 text-center text-gray-500">No active orders found.</li>}
            {orders.map(order => (
              <li key={order.id} className="p-6 hover:bg-gray-50 transition duration-150 ease-in-out">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-lg font-bold text-indigo-600">Order #{order.id}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide
                           ${order.status === OrderStatus.PENDING ? 'bg-yellow-100 text-yellow-800' :
                          order.status === OrderStatus.CONFIRMED ? 'bg-blue-100 text-blue-800' :
                            order.status === OrderStatus.COMPLETED ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{order.customerName}</p>
                    <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString()}</p>
                    <div className="mt-2 text-sm text-gray-600">
                      {order.items.length} items | Total: <span className="font-bold">${order.totalAmount}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    {order.status === OrderStatus.PENDING && (
                      <>
                        <button
                          onClick={() => updateOrderStatus(order.id, OrderStatus.CONFIRMED)}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm transition-colors"
                        >
                          Confirm Order
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, OrderStatus.CANCELLED)}
                          className="bg-white text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {order.status === OrderStatus.CONFIRMED && (
                      <button
                        onClick={() => updateOrderStatus(order.id, OrderStatus.COMPLETED)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 shadow-sm transition-colors"
                      >
                        Mark Delivered
                      </button>
                    )}
                  </div>
                </div>

                {/* Notes Section */}
                <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Staff Notes</h4>
                  <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
                    {order.notes.length === 0 && <p className="text-xs text-gray-400 italic">No notes yet.</p>}
                    {order.notes.map(note => (
                      <div key={note.id} className="text-xs bg-white p-2 rounded border border-gray-100 group relative">
                        {editingNoteId === note.id ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              className="flex-1 border border-gray-300 rounded text-xs p-1"
                              value={editNoteContent}
                              onChange={(e) => setEditNoteContent(e.target.value)}
                              autoFocus
                            />
                            <button
                              onClick={() => {
                                editStaffNote(note.id, editNoteContent);
                                setEditingNoteId(null);
                              }}
                              className="text-indigo-600 font-bold"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingNoteId(null)}
                              className="text-gray-400"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="pr-12">
                              <span className="font-bold text-gray-700">{note.authorName}:</span> {note.content}
                            </div>
                            <div className="absolute right-1 top-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  setEditingNoteId(note.id);
                                  setEditNoteContent(note.content);
                                }}
                                className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Delete this note?')) {
                                    deleteStaffNote(note.id);
                                  }
                                }}
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 border border-gray-300 rounded-md text-xs p-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Add internal note..."
                      value={noteInputs[order.id] || ''}
                      onChange={(e) => handleNoteChange(order.id, e.target.value)}
                    />
                    <button onClick={() => submitNote(order.id)} className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-xs font-bold text-gray-700 transition-colors">Add</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeTab === 'inventory' && isAdmin && (
        <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-200 animate-slide-in-right">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Image</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Variant</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Stock Level</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.flatMap(p => p.variants.map(v => ({ ...v, productName: p.name }))).map((variant) => (
                  <tr key={variant.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-900">{variant.productName}</span>
                        <button
                          onClick={() => {
                            const p = products.find(prod => prod.id === variant.productId);
                            if (p) handleEditProduct(p);
                          }}
                          className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                          title="Edit Product Details"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-10 w-10 rounded border border-gray-100 overflow-hidden bg-gray-50">
                        <img
                          src={variant.imageUrl || products.find(p => p.id === variant.productId)?.imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                          onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/40?text=No+Img')}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <span className="truncate max-w-[150px]">{variant.name}</span>
                        <button
                          onClick={() => handleEditVariant(variant as any)}
                          className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                          title="Edit Variant Details"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${variant.stockQuantity < 5 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {variant.stockQuantity} Units
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1 border rounded-lg bg-gray-50 p-1">
                          <button
                            onClick={() => updateInventory(variant.id, Math.max(0, variant.stockQuantity - 1))}
                            className="p-1 rounded hover:bg-white hover:shadow-sm text-gray-600 transition-all"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-2 text-xs font-bold text-gray-700 min-w-[20px] text-center">{variant.stockQuantity}</span>
                          <button
                            onClick={() => updateInventory(variant.id, variant.stockQuantity + 5)}
                            className="p-1 rounded hover:bg-white hover:shadow-sm text-indigo-600 transition-all"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'users' && isAdmin && (
        <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-200 animate-slide-in-right">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Current Role</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs mr-3">
                          {user.fullName.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{user.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide
                        ${user.role.name === Role.ADMIN ? 'bg-purple-100 text-purple-800' :
                          user.role.name === Role.STAFF ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                        {user.role.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.id !== currentUser?.id ? (
                        <div className="flex items-center space-x-2">
                          <select
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2"
                            value={user.role.name}
                            onChange={async (e) => {
                              const newRole = e.target.value as Role;
                              await updateUserRole(user.id, newRole);
                            }}
                          >
                            <option value={Role.CUSTOMER}>Customer</option>
                            <option value={Role.STAFF}>Staff</option>
                            <option value={Role.ADMIN}>Admin</option>
                          </select>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">(Self)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProductId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 animate-scale-up">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-900">Edit Product Information</h3>
              <button
                onClick={() => setEditingProductId(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Image Preview */}
              <div className="flex justify-center mb-6">
                <div className="relative group">
                  <div className="h-40 w-40 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center transition-all group-hover:border-indigo-300">
                    {editProductData.imageUrl ? (
                      <img src={editProductData.imageUrl} alt="Preview" className="h-full w-full object-contain" />
                    ) : (
                      <div className="text-center p-4">
                        <Package className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                        <span className="text-xs text-gray-400 font-medium">No Image URL</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Product Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    value={editProductData.name}
                    onChange={(e) => setEditProductData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Brand</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    value={editProductData.brand}
                    onChange={(e) => setEditProductData(prev => ({ ...prev, brand: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Image URL</label>
                <input
                  type="text"
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-mono text-sm"
                  value={editProductData.imageUrl}
                  onChange={(e) => setEditProductData(prev => ({ ...prev, imageUrl: e.target.value }))}
                />
                <p className="mt-1 text-[10px] text-gray-400 italic">This will set the primary image for all variants of this product.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all h-32 resize-none"
                  value={editProductData.description}
                  onChange={(e) => setEditProductData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
                <select
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  value={editProductData.status}
                  onChange={(e) => setEditProductData(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end bg-gray-50/50">
              <button
                onClick={() => setEditingProductId(null)}
                className="px-6 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProduct}
                className="px-8 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Variant Modal */}
      {editingVariantId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 animate-scale-up">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-900">Edit Variant Details</h3>
              <button
                onClick={() => setEditingVariantId(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Image Preview */}
              <div className="flex justify-center mb-6">
                <div className="relative group">
                  <div className="h-40 w-40 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center transition-all group-hover:border-indigo-300">
                    {editVariantData.imageUrl ? (
                      <img src={editVariantData.imageUrl} alt="Preview" className="h-full w-full object-contain" />
                    ) : (
                      <div className="text-center p-4">
                        <Image className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                        <span className="text-xs text-gray-400 font-medium">No Variant Image</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Variant Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    value={editVariantData.name}
                    onChange={(e) => setEditVariantData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Price ($)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    value={editVariantData.price}
                    onChange={(e) => setEditVariantData(prev => ({ ...prev, price: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Color</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    value={editVariantData.color}
                    onChange={(e) => setEditVariantData(prev => ({ ...prev, color: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Capacity</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    value={editVariantData.capacity}
                    onChange={(e) => setEditVariantData(prev => ({ ...prev, capacity: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Variant Image URL</label>
                <input
                  type="text"
                  placeholder="https://example.com/variant-image.jpg"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-mono text-sm"
                  value={editVariantData.imageUrl}
                  onChange={(e) => setEditVariantData(prev => ({ ...prev, imageUrl: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Stock Quantity</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    value={editVariantData.stockQuantity}
                    onChange={(e) => setEditVariantData(prev => ({ ...prev, stockQuantity: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    value={editVariantData.status}
                    onChange={(e) => setEditVariantData(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="IN_STOCK">In Stock</option>
                    <option value="OUT_OF_STOCK">Out of Stock</option>
                    <option value="DISCONTINUED">Discontinued</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end bg-gray-50/50">
              <button
                onClick={() => setEditingVariantId(null)}
                className="px-6 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveVariant}
                className="px-8 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

const RegisterView: React.FC = () => {
  const { register, setView } = useAppContext();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // const [role, setRole] = useState<Role>(Role.CUSTOMER); // Removed role selection for users
  const [error, setError] = useState('');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setError('');
    register(fullName, email, password);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl shadow-lg flex items-center justify-center transform rotate-3">
            <UserPlus className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 tracking-tight">
            Create account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join PhoneCom today
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          {error && (
            <div className="rounded-lg bg-red-50 p-4 border border-red-100 flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-sm font-medium text-red-800">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIconSmall className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition-all"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition-all"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition-all"
                    placeholder="••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Confirm</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition-all"
                    placeholder="••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Role selection removed - all new users are CUSTOMER */}
          </div>

          <button
            type="submit"
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-lg shadow-indigo-200"
          >
            Create Account
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <button onClick={() => setView('login')} className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

const LoginView: React.FC = () => {
  const { login, setView } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(email);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl shadow-lg flex items-center justify-center transform -rotate-3">
            <Package className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 tracking-tight">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access your premium account
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition-all"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 cursor-pointer">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                Forgot password?
              </a>
            </div>
          </div>

          <button
            type="submit"
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-lg shadow-indigo-200"
          >
            Sign in
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <button onClick={() => setView('register')} className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors">
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

// --- MAIN LAYOUT ---

const ToastContainer: React.FC = () => {
  const { notifications } = useAppContext();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col space-y-3 pointer-events-none">
      {notifications.map(n => (
        <div
          key={n.id}
          className={`pointer-events-auto px-6 py-4 rounded-xl shadow-2xl text-white flex items-center space-x-3 transform transition-all duration-300 animate-slide-in-right border border-white/10 backdrop-blur-md
            ${n.type === 'error' ? 'bg-red-500/90' : 'bg-green-500/90'}`}
        >
          {n.type === 'error' ? <AlertCircle size={20} className="text-white" /> : <CheckCircle size={20} className="text-white" />}
          <span className="font-medium text-sm">{n.message}</span>
        </div>
      ))}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900 selection:bg-indigo-100 selection:text-indigo-900">
        <MainContent />
        <ToastContainer />
      </div>
    </AppProvider>
  );
};

const MainContent: React.FC = () => {
  const { view } = useAppContext();

  return (
    <>
      <Header />
      <main className="pb-16">
        {view === 'home' && <ProductList />}
        {view === 'product-detail' && <ProductDetail />}
        {view === 'cart' && <CartView />}
        {view === 'checkout' && <CheckoutView />}
        {view === 'orders' && <OrderHistory />}
        {view === 'dashboard' && <StaffDashboard />}
        {view === 'admin-dashboard' && <StaffDashboard />}
        {view === 'login' && <LoginView />}
        {view === 'register' && <RegisterView />}
      </main>
    </>
  );
};

export default App;
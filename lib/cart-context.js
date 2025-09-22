"use client";

import { createContext, useContext, useReducer, useEffect } from "react";

// Cart item structure
// {
//   id: unique identifier,
//   medicineId: string,
//   storeId: string,
//   inventoryId: string,
//   medicine: { name, category, price, ... },
//   store: { storeName, storeAddress, ... },
//   quantity: number,
//   unitPrice: number, // Price from inventory
//   totalPrice: number
// }

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case "ADD_TO_CART": {
      const { medicineId, storeId, inventoryId, medicine, store, quantity = 1, unitPrice } = action.payload;

      // Check if item already exists in cart
      const existingItemIndex = state.items.findIndex(
        item => item.medicineId === medicineId && item.storeId === storeId
      );

      let newItems;
      if (existingItemIndex >= 0) {
        // Update quantity of existing item
        newItems = state.items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Add new item
        const price = unitPrice || medicine.price || 0; // Use inventory price, fallback to medicine price
        const newItem = {
          id: `${storeId}-${medicineId}-${Date.now()}`,
          medicineId,
          storeId,
          inventoryId,
          medicine,
          store,
          quantity,
          unitPrice: price,
          totalPrice: price * quantity
        };
        newItems = [...state.items, newItem];
      }

      const updatedState = {
        ...state,
        items: newItems,
        totalItems: newItems.reduce((sum, item) => sum + item.quantity, 0),
        totalPrice: newItems.reduce((sum, item) => sum + item.totalPrice, 0)
      };

      return updatedState;
    }

    case "REMOVE_FROM_CART": {
      const newItems = state.items.filter(item => item.id !== action.payload);
      return {
        ...state,
        items: newItems,
        totalItems: newItems.reduce((sum, item) => sum + item.quantity, 0),
        totalPrice: newItems.reduce((sum, item) => sum + item.totalPrice, 0)
      };
    }

    case "UPDATE_QUANTITY": {
      const { itemId, quantity } = action.payload;
      const newItems = state.items.map(item =>
        item.id === itemId
          ? { ...item, quantity, totalPrice: (item.unitPrice || 0) * quantity }
          : item
      );

      return {
        ...state,
        items: newItems,
        totalItems: newItems.reduce((sum, item) => sum + item.quantity, 0),
        totalPrice: newItems.reduce((sum, item) => sum + item.totalPrice, 0)
      };
    }

    case "CLEAR_CART":
      return {
        items: [],
        totalItems: 0,
        totalPrice: 0
      };

    case "LOAD_CART":
      return action.payload;

    default:
      return state;
  }
};

const initialState = {
  items: [],
  totalItems: 0,
  totalPrice: 0
};

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("medicine-cart");
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        dispatch({ type: "LOAD_CART", payload: parsedCart });
      } catch (error) {
        console.error("Failed to load cart from localStorage:", error);
      }
    }
  }, []);

  // Save cart to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem("medicine-cart", JSON.stringify(state));
  }, [state]);

  const addToCart = (medicineId, storeId, inventoryId, medicine, store, quantity = 1, unitPrice) => {
    dispatch({
      type: "ADD_TO_CART",
      payload: { medicineId, storeId, inventoryId, medicine, store, quantity, unitPrice }
    });
  };

  const removeFromCart = (itemId) => {
    dispatch({ type: "REMOVE_FROM_CART", payload: itemId });
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    dispatch({ type: "UPDATE_QUANTITY", payload: { itemId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: "CLEAR_CART" });
  };

  // Real-time stock update function
  const updateStock = async (inventoryId, newStock) => {
    try {
      const response = await fetch(`/api/medicine-inventory/${inventoryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stock: newStock }),
      });

      if (!response.ok) {
        throw new Error('Failed to update stock');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
    }
  };

  const getCartItemCount = () => state.totalItems;

  const getCartTotal = () => state.totalPrice;

  return (
    <CartContext.Provider
      value={{
        cart: state,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        updateStock,
        getCartItemCount,
        getCartTotal
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

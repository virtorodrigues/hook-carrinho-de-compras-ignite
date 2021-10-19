import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productFind = cart.find(product => product.id === productId);

      let newCart = [];

      if (productFind) {

        const stock = (await api.get(`/stock/${productId}`))?.data;

        if (stock.amount >= productFind.amount + 1) {

          newCart = cart.map((product) => (
            product.id === productId
              ? { ...product, amount: product.amount + 1 }
              : product
          ));
        } else {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

      } else {

        const product = (await api.get(`/products/${productId}`))?.data;
        const newProduct = { ...product, amount: 1 };

        newCart = [...cart, newProduct];
      }

      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {

      const productFind = cart.find(product => product.id === productId);

      if (!productFind) {
        toast.error('Erro na remoção do produto');
        return;
      }

      const newCart = cart.filter(product => product.id !== productId);

      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      const stock = (await api.get(`/stock/${productId}`))?.data;

      if (amount > 0 && stock.amount >= amount) {

        const newCart = cart.map(product => product.id === productId
          ? { ...product, amount }
          : product);

        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      } else {
        toast.error('Quantidade solicitada fora de estoque');
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}

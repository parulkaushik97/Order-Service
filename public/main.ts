
interface Order {
  id: number;
  productId: number;
  quantity: number;
  customerId: number;
  orderDate: string;
  status: string;
}

declare global {
  interface Window {
    fetchOrders: () => void;
  }
}

window.fetchOrders = async function () {
  try {
    const response = await fetch('/orders');
    const orders: Order[] = await response.json();

    const tbody = document.querySelector('#ordersTable tbody') as HTMLTableSectionElement;
    tbody.innerHTML = '';

    orders.forEach(order => {
      const row = `
        <tr>
          <td>${order.id}</td>
          <td>${order.productId}</td>
          <td>${order.quantity}</td>
          <td>${order.customerId}</td>
          <td>${order.status}</td>
        </tr>`;
      tbody.innerHTML += row;
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
  }
};
export {};
